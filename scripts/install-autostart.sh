#!/bin/bash

# Otto QA Runner - Auto-Start Installation
# Installs the companion server to start automatically on login

set -e

PROJECT_DIR="/Users/northsea/ClaudeProjects/otto-qa-runner"
PLIST_SOURCE="$PROJECT_DIR/scripts/com.otto.qa-runner.plist"
PLIST_TARGET="$HOME/Library/LaunchAgents/com.otto.qa-runner.plist"

echo "🔧 Installing Otto QA Runner Auto-Start..."
echo ""

# 1. Create logs directory
mkdir -p "$PROJECT_DIR/logs"
echo "✅ Created logs directory"

# 2. Make start script executable
chmod +x "$PROJECT_DIR/scripts/start-all.sh"
echo "✅ Made start script executable"

# 3. Copy plist to LaunchAgents
mkdir -p "$HOME/Library/LaunchAgents"
cp "$PLIST_SOURCE" "$PLIST_TARGET"
echo "✅ Installed LaunchAgent"

# 4. Unload if already loaded
launchctl unload "$PLIST_TARGET" 2>/dev/null || true

# 5. Load the LaunchAgent
launchctl load "$PLIST_TARGET"
echo "✅ LaunchAgent loaded"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Installation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 What happens now:"
echo "   • Companion server will start automatically on login"
echo "   • AdsPower will launch automatically"
echo "   • Services will restart if they crash"
echo ""
echo "🌐 Web Interface:"
echo "   https://otto-qa-runner.vercel.app"
echo "   Password: rereeu"
echo ""
echo "📝 Logs:"
echo "   Companion: $PROJECT_DIR/logs/companion.log"
echo "   LaunchAgent: $PROJECT_DIR/logs/launchd.out.log"
echo ""
echo "🔍 Check status:"
echo "   launchctl list | grep otto"
echo "   ps aux | grep companion"
echo ""
echo "🛑 To uninstall:"
echo "   launchctl unload $PLIST_TARGET"
echo "   rm $PLIST_TARGET"
echo ""
echo "🚀 Starting services now..."
bash "$PROJECT_DIR/scripts/start-all.sh"
