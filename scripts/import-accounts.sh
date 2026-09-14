#!/bin/bash
#
# One-Click Account Data Import
# 
# Drag and drop a file onto this script to import account data
# Supports: CSV, JSON, Excel (will be converted)
#

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║      Otto.de Account Data - One Click Import         ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if file provided
if [ -z "$1" ]; then
  echo "❌ No file provided"
  echo ""
  echo "Usage:"
  echo "  Drag and drop a file onto this script"
  echo "  OR run: ./import-accounts.sh <file>"
  echo ""
  echo "Supported formats: CSV, JSON"
  exit 1
fi

INPUT_FILE="$1"

# Check file exists
if [ ! -f "$INPUT_FILE" ]; then
  echo "❌ File not found: $INPUT_FILE"
  exit 1
fi

echo "📄 Input file: $INPUT_FILE"
echo ""

# Get file extension
EXT="${INPUT_FILE##*.}"
EXT_LOWER=$(echo "$EXT" | tr '[:upper:]' '[:lower:]')

echo "🔍 Detected format: $EXT_LOWER"
echo ""

# Parse based on format
cd "$(dirname "$0")/.."

case "$EXT_LOWER" in
  csv)
    echo "📋 Parsing CSV file..."
    node scripts/parse-accounts.cjs "$INPUT_FILE"
    ;;
  json)
    echo "📋 Parsing JSON file..."
    node scripts/parse-accounts.cjs "$INPUT_FILE"
    ;;
  xlsx|xls)
    echo "⚠️  Excel files need to be converted to CSV first"
    echo ""
    echo "💡 How to convert:"
    echo "   1. Open Excel file"
    echo "   2. File → Save As → CSV"
    echo "   3. Run this script again with the CSV file"
    exit 1
    ;;
  *)
    echo "❌ Unsupported file format: $EXT_LOWER"
    echo ""
    echo "Supported formats: CSV, JSON"
    exit 1
    ;;
esac

echo ""
echo "✅ Import complete!"
echo ""
echo "📱 Next steps:"
echo "   1. Open: https://otto-qa-runner.vercel.app/register.html"
echo "   2. Click: 📂 Load Saved Accounts"
echo "   3. Your imported accounts will appear"
echo ""

# Keep terminal open on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  read -p "Press Enter to close..."
fi
