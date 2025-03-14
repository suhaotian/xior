#!/bin/bash

# Create a temporary file
TMP_FILE=$(mktemp)

# Build and save output to temp file
bun build dist/index.mjs --minify > "$TMP_FILE"

# Get original size
SIZE=$(cat "$TMP_FILE" | wc -c | awk '{comp=$1/1024; printf "%.2f", comp}')
echo "Size: $SIZE KB"

# Get gzipped size
GZIP_SIZE=$(cat "$TMP_FILE" | gzip -c | wc -c | awk '{comp=$1/1024; printf "%.2f", comp}')
echo "Gzip: $GZIP_SIZE KB"

# Clean up
rm "$TMP_FILE"