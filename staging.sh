#!/bin/bash
echo "Vite build..."
pnpm run build

echo "Echo Offline HTML..."
echo '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>The app works offline!</p></body></html>' > dist/offline.html

echo "Deploy Netlify..."
npx netlify deploy --prod --dir=dist

echo "Deployment complete!"