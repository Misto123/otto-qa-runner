#!/bin/bash
cd "$(dirname "$0")"

# Generate certs if they don't exist
if [ ! -f "certs/cert.pem" ] || [ ! -f "certs/key.pem" ]; then
  echo "🔐 Generating self-signed HTTPS certificates..."
  npm run generate-certs
fi

# Start with HTTPS by default for remote access
npm run companion:https
