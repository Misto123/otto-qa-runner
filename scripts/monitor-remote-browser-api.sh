#!/bin/bash

################################################################################
# Remote Browser API Health Monitor
#
# Monitors the Remote Browser API nginx proxy and alerts when issues occur
#
# This script checks:
# 1. API endpoint (port 3000) - Main API accessibility
# 2. WebSocket proxy (port 8080) - Browser connections
# 3. Nginx service status (if running on same server)
#
# Usage:
#   # Run once
#   ./monitor-remote-browser-api.sh
#
#   # Run continuously (check every 60 seconds)
#   ./monitor-remote-browser-api.sh --continuous
#
#   # Run with custom interval (seconds)
#   ./monitor-remote-browser-api.sh --continuous --interval 30
#
#   # Send alerts via webhook
#   ./monitor-remote-browser-api.sh --webhook "https://hooks.slack.com/..."
#
################################################################################

set -e

# Configuration
API_URL="${REMOTE_BROWSER_API_URL:-http://65.21.199.228:3000}"
API_KEY="${REMOTE_BROWSER_API_KEY:-}"
WS_HOST="65.21.199.228"
WS_PORT="8080"
CHECK_INTERVAL=60
CONTINUOUS=false
WEBHOOK_URL=""
LOG_FILE="/tmp/remote-browser-api-monitor.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --continuous)
      CONTINUOUS=true
      shift
      ;;
    --interval)
      CHECK_INTERVAL="$2"
      shift 2
      ;;
    --webhook)
      WEBHOOK_URL="$2"
      shift 2
      ;;
    --api-url)
      API_URL="$2"
      shift 2
      ;;
    --api-key)
      API_KEY="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --continuous           Run continuously"
      echo "  --interval SECONDS     Check interval (default: 60)"
      echo "  --webhook URL          Webhook URL for alerts"
      echo "  --api-url URL          Remote Browser API URL"
      echo "  --api-key KEY          API key for authentication"
      echo "  --help                 Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Logging function
log() {
  local level="$1"
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Send alert
send_alert() {
  local severity="$1"
  local message="$2"
  
  log "$severity" "$message"
  
  if [ -n "$WEBHOOK_URL" ]; then
    local emoji="⚠️"
    [ "$severity" = "ERROR" ] && emoji="🔴"
    [ "$severity" = "WARN" ] && emoji="⚠️"
    [ "$severity" = "INFO" ] && emoji="✅"
    
    local payload=$(cat <<EOF
{
  "text": "$emoji Remote Browser API Monitor",
  "attachments": [{
    "color": $([ "$severity" = "ERROR" ] && echo '"danger"' || echo '"warning"'),
    "fields": [
      {
        "title": "Severity",
        "value": "$severity",
        "short": true
      },
      {
        "title": "Timestamp",
        "value": "$(date '+%Y-%m-%d %H:%M:%S')",
        "short": true
      },
      {
        "title": "Message",
        "value": "$message",
        "short": false
      }
    ]
  }]
}
EOF
)
    
    curl -s -X POST "$WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "$payload" > /dev/null 2>&1 || true
  fi
}

# Check API endpoint (port 3000)
check_api() {
  local status_code
  local response
  
  if [ -n "$API_KEY" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" -m 5 \
      "$API_URL/browsers/status" \
      -H "x_api_key: $API_KEY" 2>&1)
    status_code=$?
  else
    response=$(curl -s -o /dev/null -w "%{http_code}" -m 5 \
      "$API_URL/browsers/status" 2>&1)
    status_code=$?
  fi
  
  if [ $status_code -ne 0 ]; then
    echo -e "${RED}✗${NC} API endpoint unreachable"
    send_alert "ERROR" "Remote Browser API endpoint ($API_URL) is unreachable - nginx may be down"
    return 1
  fi
  
  if [ "$response" = "200" ] || [ "$response" = "401" ]; then
    echo -e "${GREEN}✓${NC} API endpoint responding (HTTP $response)"
    return 0
  else
    echo -e "${YELLOW}⚠${NC} API endpoint returned HTTP $response"
    send_alert "WARN" "Remote Browser API returned unexpected status code: $response"
    return 1
  fi
}

# Check WebSocket proxy (port 8080)
check_websocket() {
  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" -m 5 \
    "http://$WS_HOST:$WS_PORT" 2>&1)
  local status_code=$?
  
  if [ $status_code -ne 0 ]; then
    echo -e "${RED}✗${NC} WebSocket proxy unreachable"
    send_alert "ERROR" "Remote Browser API WebSocket proxy (port $WS_PORT) is unreachable - nginx may be down"
    return 1
  fi
  
  # 404 or 400 is expected (no valid path), means nginx is working
  if [ "$response" = "404" ] || [ "$response" = "400" ] || [ "$response" = "426" ]; then
    echo -e "${GREEN}✓${NC} WebSocket proxy responding (HTTP $response)"
    return 0
  else
    echo -e "${YELLOW}⚠${NC} WebSocket proxy returned unexpected HTTP $response"
    send_alert "WARN" "WebSocket proxy returned unexpected status: $response"
    return 1
  fi
}

# Check nginx service (if script is running on same server)
check_nginx_service() {
  if command -v systemctl &> /dev/null; then
    if systemctl is-active --quiet nginx; then
      echo -e "${GREEN}✓${NC} Nginx service is running"
      return 0
    else
      echo -e "${RED}✗${NC} Nginx service is NOT running"
      send_alert "ERROR" "Nginx service is not running on Remote Browser API server"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠${NC} Cannot check nginx service (systemctl not available or not on same server)"
    return 0
  fi
}

# Test browser start (optional, more thorough)
test_browser_start() {
  if [ -z "$API_KEY" ]; then
    echo -e "${YELLOW}⚠${NC} Skipping browser start test (no API key)"
    return 0
  fi
  
  local response
  response=$(curl -s -X POST "$API_URL/browsers/start" \
    -H "x_api_key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "provider": "adspower",
      "profileId": "test-profile-id",
      "timeout": 10000,
      "clientId": "monitor"
    }' 2>&1)
  
  local status_code=$?
  
  if [ $status_code -ne 0 ]; then
    echo -e "${RED}✗${NC} Browser start API failed (connection error)"
    send_alert "ERROR" "Failed to test browser start API - connection failed"
    return 1
  fi
  
  # Check if response contains success or error
  if echo "$response" | grep -q '"success"'; then
    echo -e "${GREEN}✓${NC} Browser start API responding"
    return 0
  else
    echo -e "${YELLOW}⚠${NC} Browser start API returned unexpected response"
    log "WARN" "Browser start response: $response"
    return 1
  fi
}

# Run all checks
run_checks() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo ""
  echo "════════════════════════════════════════════════════════"
  echo "  Remote Browser API Health Check"
  echo "  $timestamp"
  echo "════════════════════════════════════════════════════════"
  echo ""
  
  local all_ok=true
  
  echo "Checking API endpoint ($API_URL)..."
  check_api || all_ok=false
  
  echo ""
  echo "Checking WebSocket proxy ($WS_HOST:$WS_PORT)..."
  check_websocket || all_ok=false
  
  echo ""
  echo "Checking nginx service..."
  check_nginx_service || all_ok=false
  
  echo ""
  echo "════════════════════════════════════════════════════════"
  
  if [ "$all_ok" = true ]; then
    echo -e "${GREEN}✓ All checks passed${NC}"
    log "INFO" "All health checks passed"
    return 0
  else
    echo -e "${RED}✗ Some checks failed${NC}"
    log "ERROR" "Health check failures detected"
    return 1
  fi
}

# Main loop
main() {
  log "INFO" "Remote Browser API monitor started"
  log "INFO" "API URL: $API_URL"
  log "INFO" "WebSocket: $WS_HOST:$WS_PORT"
  log "INFO" "Continuous: $CONTINUOUS"
  [ "$CONTINUOUS" = true ] && log "INFO" "Check interval: ${CHECK_INTERVAL}s"
  [ -n "$WEBHOOK_URL" ] && log "INFO" "Webhook alerts enabled"
  
  if [ "$CONTINUOUS" = true ]; then
    echo "Starting continuous monitoring (interval: ${CHECK_INTERVAL}s)"
    echo "Press Ctrl+C to stop"
    echo ""
    
    while true; do
      run_checks
      echo ""
      echo "Next check in ${CHECK_INTERVAL} seconds..."
      sleep "$CHECK_INTERVAL"
    done
  else
    run_checks
  fi
}

# Run
main
