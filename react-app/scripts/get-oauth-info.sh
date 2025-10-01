#!/bin/bash
set -e

# Script to retrieve OAuth Client ID and Job ID for React app configuration
# Usage: ./scripts/get-oauth-info.sh

WORKSPACE_URL="${DATABRICKS_HOST:-https://e2-demo-field-eng.cloud.databricks.com}"
TOKEN="${DATABRICKS_TOKEN}"

echo "=========================================="
echo "OAuth & Job ID Configuration Script"
echo "=========================================="
echo ""

# Check prerequisites
if [ -z "$TOKEN" ]; then
    echo "❌ Error: DATABRICKS_TOKEN environment variable not set"
    echo ""
    echo "Please set it with:"
    echo "  export DATABRICKS_TOKEN=your_token_here"
    exit 1
fi

echo "✅ Using workspace: $WORKSPACE_URL"
echo "✅ Token found (length: ${#TOKEN})"
echo ""

# ==========================================
# 1. Check for existing OAuth apps
# ==========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Checking for existing OAuth apps..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

OAUTH_RESPONSE=$(curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "$WORKSPACE_URL/api/2.0/preview/scim/v2/ServicePrincipals" 2>/dev/null || echo "{}")

# Check if we got OAuth apps
if echo "$OAUTH_RESPONSE" | grep -q "Resources"; then
    echo "📋 Found OAuth/Service Principals:"
    echo "$OAUTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$OAUTH_RESPONSE"
    echo ""
else
    echo "⚠️  No OAuth apps found via API (may need manual creation)"
    echo ""
fi

# ==========================================
# 2. Find Feature 001 Job
# ==========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Searching for Feature 001 Job..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

JOBS_RESPONSE=$(curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "$WORKSPACE_URL/api/2.0/jobs/list" 2>/dev/null)

# Look for synthetic data generation job
FEATURE_001_JOB=$(echo "$JOBS_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    jobs = data.get('jobs', [])
    for job in jobs:
        name = job.get('settings', {}).get('name', '').lower()
        if 'synthetic' in name or 'identity' in name or 'graph' in name:
            print(f\"Found: {job.get('settings', {}).get('name', 'Unknown')} (ID: {job.get('job_id', 'Unknown')})\")
            print(f\"JOB_ID={job.get('job_id', '')}\")
            sys.exit(0)
    print('No matching job found')
except:
    print('Error parsing jobs response')
" 2>/dev/null)

if [ -n "$FEATURE_001_JOB" ]; then
    echo "✅ $FEATURE_001_JOB"
    JOB_ID=$(echo "$FEATURE_001_JOB" | grep "JOB_ID=" | cut -d'=' -f2)
    echo ""
else
    echo "⚠️  Could not find Feature 001 job automatically"
    echo ""
    echo "All jobs in workspace:"
    echo "$JOBS_RESPONSE" | python3 -m json.tool 2>/dev/null | grep -A 2 '"name"' || echo "$JOBS_RESPONSE"
    echo ""
fi

# ==========================================
# 3. Generate .env file
# ==========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Generating .env file..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ENV_FILE="$(dirname "$0")/../.env"

cat > "$ENV_FILE" <<EOF
# Databricks OAuth Configuration
# Generated: $(date)

# OAuth 2.0 Settings
# To get OAuth Client ID:
# 1. Go to Databricks Workspace → Settings → Developer → OAuth
# 2. Click "Create OAuth App"
# 3. Name: "Synthetic Data Generator React"
# 4. Redirect URI: http://localhost:5174/oauth/callback
# 5. Scopes: jobs:read, jobs:write, catalogs:read
# 6. Copy the Client ID and paste below
VITE_OAUTH_CLIENT_ID=your_oauth_client_id_here

# Databricks Workspace Configuration
VITE_DATABRICKS_HOST=$WORKSPACE_URL
VITE_DATABRICKS_CATALOG=bryan_li

# Feature 001 Job ID
# This is the Databricks job that generates synthetic data
${JOB_ID:+VITE_FEATURE_001_JOB_ID=$JOB_ID}
${JOB_ID:-# VITE_FEATURE_001_JOB_ID=your_job_id_here}

# Development Mode (Optional)
# Uncomment to bypass OAuth during local development
# VITE_DEV_TOKEN=$TOKEN
EOF

echo "✅ Created .env file at: $ENV_FILE"
echo ""

# ==========================================
# 4. Display instructions
# ==========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$JOB_ID" ]; then
    echo "⚠️  MANUAL ACTION REQUIRED:"
    echo ""
    echo "1. Find your Feature 001 Job ID:"
    echo "   databricks jobs list --output json | grep -i synthetic"
    echo ""
    echo "2. Update .env file with Job ID:"
    echo "   nano $ENV_FILE"
    echo ""
fi

echo "📱 To create OAuth Client ID:"
echo ""
echo "1. Open Databricks workspace in browser:"
echo "   $WORKSPACE_URL"
echo ""
echo "2. Navigate to: Settings → Developer → OAuth"
echo ""
echo "3. Click 'Create OAuth App' with:"
echo "   - Name: Synthetic Data Generator React"
echo "   - Redirect URI: http://localhost:5174/oauth/callback"
echo "   - Scopes: jobs:read, jobs:write, catalogs:read"
echo ""
echo "4. Copy the Client ID and update .env:"
echo "   VITE_OAUTH_CLIENT_ID=<paste_here>"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Quick Start (Dev Mode - No OAuth)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To test immediately without OAuth:"
echo ""
echo "1. Uncomment this line in .env:"
echo "   VITE_DEV_TOKEN=$TOKEN"
echo ""
echo "2. Restart dev server:"
echo "   npm run dev"
echo ""

echo "✅ Configuration complete!"
echo ""
echo "Current .env file contents:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$ENV_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
