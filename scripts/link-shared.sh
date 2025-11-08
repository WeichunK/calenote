#!/bin/bash
# Link the shared package to web/node_modules
# This ensures Next.js can resolve @calenote/shared

echo "Linking @calenote/shared to web/node_modules..."

mkdir -p packages/web/node_modules/@calenote
ln -sf ../../../node_modules/@calenote/shared packages/web/node_modules/@calenote/shared

echo "Link created successfully!"
