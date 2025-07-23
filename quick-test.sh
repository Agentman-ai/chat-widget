#!/bin/bash

echo "🚀 Quick Test Script for Chat Widget Attachments"
echo "=============================================="

# Check if server is running
echo -n "Checking if API server is running on port 8000... "
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not running"
    echo "Please start the Chain of Agents API server first!"
    exit 1
fi

# Build the widget
echo -n "Building widget... "
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Built"
else
    echo "❌ Build failed"
    exit 1
fi

# Open test files
echo ""
echo "Opening test files in your browser:"
echo "1. Basic upload test..."
open test-file-upload.html

echo "2. Welcome screen upload test..."
open test-welcome-upload.html

echo "3. Attachment display test..."
open test-attachment-display.html

echo ""
echo "✨ Test files opened! Check your browser."
echo ""
echo "Test Steps:"
echo "1. Try uploading an image in each test file"
echo "2. Check console logs for API requests"
echo "3. Verify attachments display correctly"
echo "4. Test with different file types (PDF, TXT, etc.)"