#!/bin/bash

# Otto QA Runner - Auto Start Script
# This script ensures AdsPower and the companion server are always running

PROJECT_DIR="/Users/northsea/ClaudeProjects/otto-qa-runner"
LOG_DIR="$PROJECT_DIR/logs"
ADSPOWER_APP="/Applications/AdsPower.app"

# Create logs directory
mkdir -p "$LOG_DIR"

echo "🚀 Starting Otto QA Runner services..."

# 1. Start AdsPower (if not already running)
if ! pgrep -f "AdsPower" > /dev/null; then
    echo "📱 Starting AdsPower..."
    open -a "$ADSPOWER_APP"
    sleep 5  # Wait for AdsPower to fully start
    echo "✅ AdsPower started"
else
    echo "✅ AdsPower already running"
fi

# 2. Kill old companion server if running
if pgrep -f "companion/server.cjs" > /dev/null; then
    echo "🔄 Stopping old companion server..."
    pkill -f "companion/server.cjs"
    sleep 2
fi

# 3. Start companion server
echo "🔌 Starting companion server..."
cd "$PROJECT_DIR"
HTTPS=true nohup node companion/server.cjs > "$LOG_DIR/companion.log" 2>&1 &
COMPANION_PID=$!
sleep 3

# 4. Verify services are running
echo ""
echo "📊 Service Status:"
echo "─────────────────────────────────────"

if pgrep -f "AdsPower" > /dev/null; then
    echo "✅ AdsPower: Running"
else
    echo "❌ AdsPower: Not running"
fi

if pgrep -f "companion/server.cjs" > /dev/null; then
    echo "✅ Companion: Running (PID: $COMPANION_PID)"
    echo "   📍 URL: https://127.0.0.1:8787"
else
    echo "❌ Companion: Not running"
fi

echo "─────────────────────────────────────"
echo ""
echo "📝 Logs available at:"
echo "   $LOG_DIR/companion.log"
echo ""
echo "🌐 Web Interface:"
echo "   https://otto-qa-runner.vercel.app"
echo ""
echo "⚠️  To stop services:"
echo "   pkill -f 'companion/server.cjs'"
echo "   killall AdsPower"
echo ""
echo "✨ All services started successfully!"
