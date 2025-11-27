#!/bin/bash
# redeploy.sh
echo "// Redeploy: $(date)" >> src/app/page.tsx
git add .
git commit -m "chore: redeploy to clear cache"
git push