#!/bin/bash

################################################################################
# Deploy Otto QA Companion to VPS with proper SSL
#
# This script deploys the companion server to a VPS with a real domain
# and Let's Encrypt SSL certificate, making it accessible from anywhere.
#
# Prerequisites:
# 1. A VPS (Ubuntu/Debian recommended)
# 2. A domain pointing to the VPS (e.g., companion.yourdomain.com)
# 3. Ports 80, 443, 8787 open in firewall
#
# Usage:
#   ./deploy-companion-to-vps.sh
#
################################################################################

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Otto QA Companion - VPS Deployment with SSL            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Get configuration
read -p "Enter your domain (e.g., companion.yourdomain.com): " DOMAIN
read -p "Enter your email for Let's Encrypt: " EMAIL
read -p "Enter Remote Browser API URL (or press Enter to skip): " REMOTE_API_URL
read -p "Enter Remote Browser API Key (or press Enter to skip): " REMOTE_API_KEY

echo ""
echo "Configuration:"
echo "  Domain: $DOMAIN"
echo "  Email: $EMAIL"
echo "  Remote API: ${REMOTE_API_URL:-Not configured}"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
apt-get update -qq
apt-get install -y nodejs npm git nginx certbot python3-certbot-nginx curl jq

# Create app directory
APP_DIR="/opt/otto-qa-companion"
echo "📁 Creating application directory: $APP_DIR"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Clone repository
echo "📥 Cloning repository..."
if [ -d ".git" ]; then
  git pull
else
  git clone https://github.com/Misto123/otto-qa-runner.git .
fi

# Install Node.js dependencies
echo "📦 Installing Node.js packages..."
npm install

# Create environment file
echo "⚙️  Creating environment configuration..."
cat > .env << EOF
REMOTE_BROWSER_API_URL=${REMOTE_API_URL}
REMOTE_BROWSER_API_KEY=${REMOTE_API_KEY}
NODE_ENV=production
EOF

# Get SSL certificate
echo "🔒 Obtaining SSL certificate from Let's Encrypt..."
certbot certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"

# Create nginx configuration
echo "🌐 Configuring nginx reverse proxy..."
cat > /etc/nginx/sites-available/otto-qa-companion << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;

    location / {
        proxy_pass https://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/otto-qa-companion /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Create systemd service
echo "🔧 Creating systemd service..."
cat > /etc/systemd/system/otto-qa-companion.service << EOF
[Unit]
Description=Otto QA Companion Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/node $APP_DIR/companion/server.cjs
Restart=always
RestartSec=10
StandardOutput=append:/var/log/otto-qa-companion.log
StandardError=append:/var/log/otto-qa-companion-error.log

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable otto-qa-companion
systemctl start otto-qa-companion

# Setup auto-renewal for SSL
echo "🔄 Setting up SSL auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Configure firewall (if ufw is active)
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    echo "🔥 Configuring firewall..."
    ufw allow 'Nginx Full'
    ufw allow 8787/tcp
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                  ✅ DEPLOYMENT COMPLETE                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 Otto QA Companion is now running!"
echo ""
echo "📍 Access URLs:"
echo "   https://$DOMAIN"
echo ""
echo "🔍 Check status:"
echo "   systemctl status otto-qa-companion"
echo "   journalctl -u otto-qa-companion -f"
echo ""
echo "📊 Logs:"
echo "   /var/log/otto-qa-companion.log"
echo "   /var/log/otto-qa-companion-error.log"
echo ""
echo "🔄 Manage service:"
echo "   sudo systemctl restart otto-qa-companion"
echo "   sudo systemctl stop otto-qa-companion"
echo ""
echo "🌐 Update Vercel app with this URL:"
echo "   https://$DOMAIN"
echo ""
echo "🔒 SSL certificate auto-renews every 60 days"
echo ""
