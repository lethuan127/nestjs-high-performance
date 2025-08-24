#!/bin/bash

# k6 Load Test Runner Script for 100,000 Concurrent Users
# Authentication System Load Testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BASE_URL="http://localhost:3000"
ENVIRONMENT="local"
TEST_TYPE="mixed"
OUTPUT_FORMAT="json,csv,html"
CLEAN_RESULTS=false
MONITORING=false

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --url URL          Base URL for the API (default: http://localhost:3000)"
    echo "  -e, --env ENV          Environment (local|staging|production)"
    echo "  -t, --type TYPE        Test type (mixed|login|register|smoke|stress|spike)"
    echo "  -o, --output FORMAT    Output format (json,csv,html,influxdb,prometheus)"
    echo "  -c, --clean            Clean results directory before running"
    echo "  -m, --monitoring       Start monitoring stack (Grafana + InfluxDB)"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run default mixed load test"
    echo "  $0 --type smoke                      # Run smoke test"
    echo "  $0 --type stress --monitoring        # Run stress test with monitoring"
    echo "  $0 --url https://api.example.com     # Test against remote server"
    echo "  $0 --env production --clean          # Production test with clean results"
}

# Function to clean results
clean_results() {
    if [ "$CLEAN_RESULTS" = true ]; then
        print_message $YELLOW "🧹 Cleaning results directory..."
        rm -rf results/*
        mkdir -p results
        print_message $GREEN "✅ Results directory cleaned"
    fi
}

# Function to start monitoring stack
start_monitoring() {
    if [ "$MONITORING" = true ]; then
        print_message $YELLOW "📊 Starting monitoring stack..."
        docker-compose -f docker-compose.k6.yml up -d influxdb grafana
        
        # Wait for services to be ready
        sleep 10
        
        print_message $GREEN "✅ Monitoring stack started"
        print_message $BLUE "   • Grafana: http://localhost:3001 (admin/admin)"
        print_message $BLUE "   • InfluxDB: http://localhost:8086"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_message $YELLOW "🔍 Checking prerequisites..."
    
    # Check if k6 is installed
    if ! command -v k6 &> /dev/null; then
        print_message $RED "❌ k6 is not installed"
        print_message $YELLOW "Please install k6: https://k6.io/docs/get-started/installation/"
        exit 1
    fi
    
    # Check if Docker is running (for monitoring)
    if [ "$MONITORING" = true ]; then
        if ! docker info &> /dev/null; then
            print_message $RED "❌ Docker is not running"
            print_message $YELLOW "Please start Docker for monitoring features"
            exit 1
        fi
    fi
    
    # Check if target server is reachable
    print_message $YELLOW "🌐 Checking server connectivity..."
    if curl -s --max-time 5 "$BASE_URL" > /dev/null; then
        print_message $GREEN "✅ Server is reachable: $BASE_URL"
    else
        print_message $YELLOW "⚠️  Warning: Server might not be reachable: $BASE_URL"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_message $GREEN "✅ Prerequisites check completed"
}

# Function to run k6 test
run_k6_test() {
    local test_command="k6 run"
    local output_options=""
    local k6_options=""
    
    # Set environment variables
    export BASE_URL="$BASE_URL"
    export ENVIRONMENT="$ENVIRONMENT"
    
    # Configure output options
    if [[ "$OUTPUT_FORMAT" == *"json"* ]]; then
        output_options="$output_options --out json=results/load-test-results.json"
    fi
    
    if [[ "$OUTPUT_FORMAT" == *"csv"* ]]; then
        output_options="$output_options --out csv=results/load-test-results.csv"
    fi
    
    if [[ "$OUTPUT_FORMAT" == *"influxdb"* ]]; then
        output_options="$output_options --out influxdb=http://localhost:8086/k6-bucket"
    fi
    
    # Configure test-specific options
    case $TEST_TYPE in
        "smoke")
            k6_options="--vus 10 --duration 30s"
            ;;
        "stress")
            k6_options="--vus 10000 --duration 5m"
            ;;
        "spike")
            k6_options="--stage 0:0s,5000:10s,5000:30s,0:10s"
            ;;
        "login")
            export K6_SCENARIO="loginStressTest"
            ;;
        "register")
            export K6_SCENARIO="registrationBurstTest"
            ;;
        "mixed"|*)
            # Use default mixed scenario
            ;;
    esac
    
    # Build final command
    local full_command="$test_command $k6_options $output_options --summary-export=results/summary.json main.js"
    
    print_message $BLUE "🚀 Starting k6 load test..."
    print_message $YELLOW "Command: $full_command"
    print_message $YELLOW "Target: $BASE_URL"
    print_message $YELLOW "Environment: $ENVIRONMENT"
    print_message $YELLOW "Test Type: $TEST_TYPE"
    echo ""
    
    # Run the test
    eval $full_command
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_message $GREEN "✅ Load test completed successfully!"
    else
        print_message $RED "❌ Load test failed with exit code: $exit_code"
        exit $exit_code
    fi
}

# Function to generate reports
generate_reports() {
    print_message $YELLOW "📊 Generating reports..."
    
    # Check if results exist
    if [ ! -f "results/load-test-results.json" ]; then
        print_message $YELLOW "⚠️  No JSON results found, skipping report generation"
        return
    fi
    
    # Generate HTML report if k6 supports it
    if command -v k6 &> /dev/null; then
        print_message $BLUE "📄 Results available in:"
        ls -la results/
        
        if [ -f "results/summary.html" ]; then
            print_message $GREEN "   • HTML Report: results/summary.html"
        fi
        
        if [ -f "results/load-test-results.json" ]; then
            print_message $GREEN "   • JSON Results: results/load-test-results.json"
        fi
        
        if [ -f "results/load-test-results.csv" ]; then
            print_message $GREEN "   • CSV Results: results/load-test-results.csv"
        fi
    fi
    
    print_message $GREEN "✅ Reports generated"
}

# Function to show final summary
show_summary() {
    echo ""
    print_message $GREEN "🎉 Load Test Session Completed!"
    print_message $BLUE "📋 Test Summary:"
    print_message $BLUE "   • Target URL: $BASE_URL"
    print_message $BLUE "   • Environment: $ENVIRONMENT"
    print_message $BLUE "   • Test Type: $TEST_TYPE"
    print_message $BLUE "   • Results: $(pwd)/results/"
    
    if [ "$MONITORING" = true ]; then
        echo ""
        print_message $YELLOW "📊 Monitoring Dashboard:"
        print_message $BLUE "   • Grafana: http://localhost:3001"
        print_message $BLUE "   • InfluxDB: http://localhost:8086"
        print_message $YELLOW "   • To stop monitoring: docker-compose -f docker-compose.k6.yml down"
    fi
    
    echo ""
    print_message $YELLOW "💡 Next Steps:"
    print_message $BLUE "   • Review results in the results/ directory"
    print_message $BLUE "   • Analyze performance metrics and bottlenecks"
    print_message $BLUE "   • Optimize your application based on findings"
    print_message $BLUE "   • Re-run tests to validate improvements"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--type)
            TEST_TYPE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        -c|--clean)
            CLEAN_RESULTS=true
            shift
            ;;
        -m|--monitoring)
            MONITORING=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_message $RED "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_message $GREEN "🎯 k6 Authentication Load Test Runner"
    print_message $GREEN "======================================"
    echo ""
    
    # Create results directory
    mkdir -p results
    
    # Run all steps
    check_prerequisites
    clean_results
    start_monitoring
    run_k6_test
    generate_reports
    show_summary
}

# Run main function
main
