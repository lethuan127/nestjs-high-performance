// Main k6 Load Test Script for 100,000 Concurrent Users
// Authentication System Load Test

import { config } from './config.js';
import { mixedAuthTest, loginStressTest, registrationBurstTest, setup, teardown } from './scenarios.js';
import { handleSummary, startRealTimeMonitoring, stopRealTimeMonitoring } from './monitoring.js';

// Export k6 configuration
export { options } from './scenarios.js';

// Export test scenarios
export { mixedAuthTest, loginStressTest, registrationBurstTest };

// Export setup and teardown functions
export { setup, teardown };

// Export custom summary handler
export { handleSummary };

// Global test state
let monitoringInterval;

// VU initialization (runs once per VU)
export function vuInit() {
  // This runs once per VU at the start of the test
  console.log(`VU ${__VU} initialized`);
}

// Test setup (runs once before all scenarios)
export function globalSetup() {
  console.log('🎯 Starting Authentication System Load Test');
  console.log('📋 Test Configuration:');
  console.log(`   • Target: 100,000 concurrent users`);
  console.log(`   • Scenarios: ${Object.keys(config.scenarios).length}`);
  console.log(`   • Duration: ~30 minutes total`);
  console.log('');
  
  // Start monitoring
  monitoringInterval = startRealTimeMonitoring();
  
  return {
    startTime: Date.now(),
    testConfig: config,
  };
}

// Test teardown (runs once after all scenarios)
export function globalTeardown(data) {
  console.log('');
  console.log('🏁 Load Test Completed');
  console.log(`⏱️  Total Duration: ${Math.round((Date.now() - data.startTime) / 1000)}s`);
  
  // Stop monitoring
  stopRealTimeMonitoring(monitoringInterval);
  
  console.log('📊 Check the results/ directory for detailed reports');
}

// Default export for direct execution
export default function() {
  // This is the default function that runs when no specific scenario is selected
  mixedAuthTest();
}
