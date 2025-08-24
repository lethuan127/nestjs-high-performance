import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom monitoring and reporting utilities
export class LoadTestMonitor {
  constructor() {
    this.metrics = {
      startTime: Date.now(),
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {},
      },
      performance: {
        responseTime: [],
        throughput: [],
        errorRate: [],
      },
      users: {
        registered: 0,
        loggedIn: 0,
        profileAccessed: 0,
      },
      errors: [],
    };
  }

  // Record a request
  recordRequest(endpoint, success, responseTime, error = null) {
    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
      if (error) {
        this.metrics.errors.push({
          timestamp: Date.now(),
          endpoint,
          error: error.toString(),
        });
      }
    }

    // Track by endpoint
    if (!this.metrics.requests.byEndpoint[endpoint]) {
      this.metrics.requests.byEndpoint[endpoint] = {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        responseTimes: [],
      };
    }

    const endpointMetrics = this.metrics.requests.byEndpoint[endpoint];
    endpointMetrics.total++;
    endpointMetrics.responseTimes.push(responseTime);
    endpointMetrics.avgResponseTime = 
      endpointMetrics.responseTimes.reduce((a, b) => a + b, 0) / endpointMetrics.responseTimes.length;

    if (success) {
      endpointMetrics.successful++;
    } else {
      endpointMetrics.failed++;
    }

    // Record performance metrics
    this.metrics.performance.responseTime.push({
      timestamp: Date.now(),
      value: responseTime,
      endpoint,
    });
  }

  // Record user action
  recordUserAction(action) {
    if (this.metrics.users[action] !== undefined) {
      this.metrics.users[action]++;
    }
  }

  // Get current statistics
  getStats() {
    const now = Date.now();
    const duration = (now - this.metrics.startTime) / 1000; // seconds
    const rps = this.metrics.requests.total / duration;
    const errorRate = this.metrics.requests.total > 0 
      ? (this.metrics.requests.failed / this.metrics.requests.total) * 100 
      : 0;

    return {
      duration: Math.round(duration),
      totalRequests: this.metrics.requests.total,
      successfulRequests: this.metrics.requests.successful,
      failedRequests: this.metrics.requests.failed,
      requestsPerSecond: Math.round(rps * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      userActions: this.metrics.users,
      endpointStats: this.metrics.requests.byEndpoint,
      recentErrors: this.metrics.errors.slice(-10), // Last 10 errors
    };
  }

  // Generate real-time dashboard data
  getDashboardData() {
    const stats = this.getStats();
    const now = Date.now();
    
    // Get recent performance data (last 60 seconds)
    const recentPerformance = this.metrics.performance.responseTime
      .filter(p => (now - p.timestamp) <= 60000)
      .reduce((acc, p) => {
        if (!acc[p.endpoint]) {
          acc[p.endpoint] = [];
        }
        acc[p.endpoint].push(p.value);
        return acc;
      }, {});

    return {
      ...stats,
      recentPerformance,
      timestamp: now,
    };
  }
}

// Global monitor instance
export const monitor = new LoadTestMonitor();

// Custom summary function for k6
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Generate comprehensive HTML report
  const htmlReportContent = htmlReport(data, {
    title: 'Authentication System Load Test Report',
    description: 'Load test results for 100,000 concurrent users',
    logoUrl: 'https://k6.io/docs/static/img/k6-logo.svg',
  });

  // Generate text summary
  const textSummaryContent = textSummary(data, { indent: ' ', enableColors: true });

  // Generate custom JSON report with additional metrics
  const customReport = generateCustomReport(data);

  return {
    'results/summary.html': htmlReportContent,
    'results/summary.txt': textSummaryContent,
    'results/detailed-report.json': JSON.stringify(customReport, null, 2),
    stdout: textSummaryContent,
  };
}

// Generate custom detailed report
function generateCustomReport(data) {
  const report = {
    metadata: {
      testName: 'Authentication System Load Test',
      timestamp: new Date().toISOString(),
      duration: data.state.testRunDurationMs / 1000,
      k6Version: data.state.k6Version,
    },
    summary: {
      totalRequests: data.metrics.http_reqs?.count || 0,
      failedRequests: data.metrics.http_req_failed?.count || 0,
      successRate: calculateSuccessRate(data),
      averageResponseTime: data.metrics.http_req_duration?.avg || 0,
      p95ResponseTime: data.metrics.http_req_duration?.p95 || 0,
      p99ResponseTime: data.metrics.http_req_duration?.p99 || 0,
      maxVUs: data.metrics.vus_max?.max || 0,
      dataReceived: data.metrics.data_received?.count || 0,
      dataSent: data.metrics.data_sent?.count || 0,
    },
    endpoints: analyzeEndpoints(data),
    thresholds: analyzeThresholds(data),
    performance: {
      responseTimes: extractResponseTimeData(data),
      throughput: calculateThroughput(data),
      errorAnalysis: analyzeErrors(data),
    },
    recommendations: generateRecommendations(data),
  };

  return report;
}

// Calculate success rate
function calculateSuccessRate(data) {
  const totalRequests = data.metrics.http_reqs?.count || 0;
  const failedRequests = data.metrics.http_req_failed?.count || 0;
  
  if (totalRequests === 0) return 0;
  
  return ((totalRequests - failedRequests) / totalRequests) * 100;
}

// Analyze endpoint performance
function analyzeEndpoints(data) {
  const endpoints = {};
  
  // Extract endpoint-specific metrics
  Object.keys(data.metrics).forEach(metricName => {
    if (metricName.includes('http_req_duration{endpoint:')) {
      const endpointMatch = metricName.match(/endpoint:(\w+)/);
      if (endpointMatch) {
        const endpoint = endpointMatch[1];
        const metric = data.metrics[metricName];
        
        endpoints[endpoint] = {
          averageResponseTime: metric.avg || 0,
          p95ResponseTime: metric.p95 || 0,
          p99ResponseTime: metric.p99 || 0,
          maxResponseTime: metric.max || 0,
          minResponseTime: metric.min || 0,
        };
      }
    }
  });

  return endpoints;
}

// Analyze threshold results
function analyzeThresholds(data) {
  const thresholds = {};
  
  if (data.thresholds) {
    Object.keys(data.thresholds).forEach(threshold => {
      const result = data.thresholds[threshold];
      thresholds[threshold] = {
        passed: !result.failed,
        actualValue: result.actualValue,
        expectedValue: result.expectedValue,
      };
    });
  }

  return thresholds;
}

// Extract response time data for visualization
function extractResponseTimeData(data) {
  const responseTimeMetric = data.metrics.http_req_duration;
  
  if (!responseTimeMetric) return null;

  return {
    average: responseTimeMetric.avg,
    median: responseTimeMetric.med,
    p90: responseTimeMetric.p90,
    p95: responseTimeMetric.p95,
    p99: responseTimeMetric.p99,
    max: responseTimeMetric.max,
    min: responseTimeMetric.min,
  };
}

// Calculate throughput metrics
function calculateThroughput(data) {
  const duration = data.state.testRunDurationMs / 1000;
  const totalRequests = data.metrics.http_reqs?.count || 0;
  
  return {
    requestsPerSecond: duration > 0 ? totalRequests / duration : 0,
    totalRequests,
    duration,
  };
}

// Analyze errors
function analyzeErrors(data) {
  const totalRequests = data.metrics.http_reqs?.count || 0;
  const failedRequests = data.metrics.http_req_failed?.count || 0;
  const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

  return {
    totalErrors: failedRequests,
    errorRate,
    errorTypes: extractErrorTypes(data),
  };
}

// Extract error types (simplified)
function extractErrorTypes(data) {
  // This would need to be enhanced based on actual error tracking
  return {
    timeouts: 0,
    connectionErrors: 0,
    httpErrors: data.metrics.http_req_failed?.count || 0,
  };
}

// Generate performance recommendations
function generateRecommendations(data) {
  const recommendations = [];
  const successRate = calculateSuccessRate(data);
  const p95ResponseTime = data.metrics.http_req_duration?.p95 || 0;
  const errorRate = data.metrics.http_req_failed?.count || 0;

  // Success rate recommendations
  if (successRate < 95) {
    recommendations.push({
      type: 'critical',
      category: 'reliability',
      message: `Success rate is ${successRate.toFixed(2)}%. Consider investigating error causes and improving system stability.`,
    });
  }

  // Response time recommendations
  if (p95ResponseTime > 2000) {
    recommendations.push({
      type: 'warning',
      category: 'performance',
      message: `95th percentile response time is ${p95ResponseTime.toFixed(0)}ms. Consider optimizing database queries and adding caching.`,
    });
  }

  // Error rate recommendations
  if (errorRate > 0) {
    recommendations.push({
      type: 'info',
      category: 'monitoring',
      message: 'Monitor error logs and implement proper error handling and retry mechanisms.',
    });
  }

  // Scaling recommendations
  const maxVUs = data.metrics.vus_max?.max || 0;
  if (maxVUs >= 90000) {
    recommendations.push({
      type: 'success',
      category: 'scalability',
      message: `System handled ${maxVUs} concurrent users successfully. Consider horizontal scaling for higher loads.`,
    });
  }

  return recommendations;
}

// Real-time monitoring utilities
export function startRealTimeMonitoring() {
  console.log('🚀 Starting real-time monitoring...');
  
  // Log initial system info
  console.log(`📊 Test started at: ${new Date().toISOString()}`);
  console.log(`🎯 Target: 100,000 concurrent users`);
  console.log(`⏱️  Expected duration: ~30 minutes`);
  
  // Set up periodic status updates
  const statusInterval = setInterval(() => {
    const stats = monitor.getStats();
    console.log(`📈 Status Update - Requests: ${stats.totalRequests}, RPS: ${stats.requestsPerSecond}, Error Rate: ${stats.errorRate}%`);
  }, 30000); // Every 30 seconds

  return statusInterval;
}

export function stopRealTimeMonitoring(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
  }
  console.log('🏁 Real-time monitoring stopped');
}
