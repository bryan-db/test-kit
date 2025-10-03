# Quickstart: Databricks Asset Bundle Deployment

**Feature**: 003-databricks-asset-bundles
**Purpose**: Step-by-step guide to deploy test-kit using Databricks Asset Bundles
**Audience**: DevOps engineers, data engineers

## Prerequisites

**Required Tools**:
- Databricks CLI 0.200+ ([install guide](https://docs.databricks.com/dev-tools/cli/install.html))
- Git
- Access to e2-demo-field-eng.cloud.databricks.com workspace
- Databricks authentication (PAT or service principal)

**Required Permissions**:
- Workspace access
- CREATE permission on bryan_li catalog
- CREATE SCHEMA permission
- CAN_MANAGE permission on existing job (if updating)
- Apps deployment permission

**Verification**:
```bash
# Verify CLI installation
databricks --version  # Should show 0.200 or higher

# Verify authentication
databricks auth profiles  # Should list available profiles

# Verify workspace access
databricks workspace list /  # Should list workspace root
```

---

## Step 1: Clone Repository

```bash
# Clone the test-kit repository
git clone https://github.com/your-org/test-kit.git
cd test-kit

# Checkout the bundle feature branch
git checkout 003-databricks-asset-bundles
```

**Expected Output**:
```
Switched to branch '003-databricks-asset-bundles'
```

---

## Step 2: Configure Authentication

**Option A: Using Personal Access Token (Development)**

```bash
# Set environment variables
export DATABRICKS_HOST=https://e2-demo-field-eng.cloud.databricks.com
export DATABRICKS_TOKEN=<your-personal-access-token>
```

**Option B: Using Service Principal (Production)**

```bash
# Set environment variables
export DATABRICKS_HOST=https://e2-demo-field-eng.cloud.databricks.com
export DATABRICKS_CLIENT_ID=<service-principal-client-id>
export DATABRICKS_CLIENT_SECRET=<service-principal-secret>
```

**Option C: Using Profile (Persistent)**

```bash
# Configure a named profile
databricks configure --profile test-kit-dev

# Follow prompts:
# Host: https://e2-demo-field-eng.cloud.databricks.com
# Token: <your-pat-or-leave-blank-for-oauth>

# Use profile in commands
export DATABRICKS_CONFIG_PROFILE=test-kit-dev
```

---

## Step 3: Validate Bundle Configuration

```bash
# Validate the bundle structure
databricks bundle validate

# Expected output:
# Validation OK!
```

**What This Does**:
- Checks databricks.yml syntax
- Verifies resource references (jobs, apps, notebooks)
- Validates variable substitution
- Confirms workspace permissions

**If Validation Fails**:
```bash
# Common issues:

# 1. Missing notebook file
Error: notebook_path not found: databricks_app/generation_notebook.py
Fix: Ensure all source files exist in repository

# 2. Invalid YAML syntax
Error: yaml: line 10: mapping values are not allowed in this context
Fix: Check YAML indentation and structure

# 3. Unresolved variable
Error: variable 'catalog_name' has no value
Fix: Ensure target profile defines all required variables
```

---

## Step 4: Deploy to Dev Environment

```bash
# Deploy to dev workspace
databricks bundle deploy --target dev

# Expected output:
# Uploading databricks_app to workspace...
# Creating job "Synthetic Data Generation (dev)"...
# Creating app "Synthetic Data Generator (dev)"...
# Deployment complete!
```

**What This Does**:
1. Uploads notebooks to workspace path
2. Creates/updates job with dev-specific configuration
3. Creates/updates app deployment
4. Writes deployment state to workspace .bundle directory

**Verification**:
```bash
# List deployed resources
databricks bundle resources list --target dev

# Expected output:
# jobs/synthetic_data_generation: <job-id>
# apps/synthetic_data_generator: <app-id>
```

**Manual Verification** (via UI):
1. Open workspace: https://e2-demo-field-eng.cloud.databricks.com
2. Navigate to "Workflows" → "Jobs"
3. Find job: "Synthetic Data Generation (dev)"
4. Navigate to "Apps"
5. Find app: "Synthetic Data Generator (dev)"

---

## Step 5: Test Dev Deployment

### Test Job Execution

```bash
# Trigger job run
databricks jobs run-now <job-id> --notebook-params '{"config": "{\"seed\": 42, \"num_households\": 100}"}'

# Monitor job status
databricks runs get-output <run-id>
```

**Expected Behavior**:
- Job starts cluster
- Executes generation_notebook.py
- Writes data to bryan_li.synthetic_datasets_dev
- Job completes successfully

### Test App Access

```bash
# Get app URL
databricks apps get <app-name>

# Open URL in browser
# Expected: React app loads and displays wizard interface
```

---

## Step 6: Deploy to Prod Environment (With Safeguards)

**⚠️ Production Deployment Safety**

Production deployment requires THREE safeguards:

1. **Explicit Flag**: Must specify `--target prod`
2. **Environment Lock**: Bundle mode is `production` (enforces stricter checks)
3. **Manual Approval**: GitHub Actions workflow requires approval (when using CI/CD)

### Local Production Deployment

```bash
# Deploy to prod (will prompt for confirmation)
databricks bundle deploy --target prod

# Expected prompts:
# ⚠️  Target is in production mode
# The following resources will be updated:
#   - jobs/synthetic_data_generation
#   - apps/synthetic_data_generator
#
# Proceed with deployment? [y/N]: y

# After confirmation:
# Uploading databricks_app to workspace...
# Updating job "Synthetic Data Generation (prod)"...
# Updating app "Synthetic Data Generator (prod)"...
# Deployment complete!
```

**Production Deployment Checklist**:
- [ ] Dev deployment tested successfully
- [ ] Code review approved
- [ ] Changes merged to main branch
- [ ] Prod deployment approved (if using GitHub Actions)
- [ ] Backup of previous prod state available
- [ ] Rollback plan documented

---

## Step 7: Verify Production Deployment

```bash
# Verify prod resources
databricks bundle resources list --target prod

# Check job configuration
databricks jobs get <prod-job-id>

# Verify correct catalog/schema
# Expected: job writes to bryan_li.synthetic_datasets_prod
```

**Key Differences (Dev vs Prod)**:
| Aspect | Dev | Prod |
|--------|-----|------|
| Schema | synthetic_datasets_dev | synthetic_datasets_prod |
| Cluster Size | 2 workers (i3.xlarge) | 8 workers (i3.2xlarge) |
| Mode | development | production |
| Approval | None | Required (CI/CD) |
| Confirmation | Auto-approve | Manual confirmation |

---

## Step 8: Incremental Updates

When you update code or configuration:

```bash
# Make changes to source code
vim databricks_app/generation_notebook.py

# Commit changes
git add databricks_app/
git commit -m "Update generation logic"

# Re-validate
databricks bundle validate

# Deploy updated bundle
databricks bundle deploy --target dev

# Expected output:
# Detected changes in:
#   - databricks_app/generation_notebook.py
# Uploading updated notebook...
# Job configuration unchanged (skipped)
# Deployment complete!
```

**Change Detection**:
- CLI compares current bundle with deployed state
- Only changed resources are updated
- Unchanged resources are skipped (faster deployment)

---

## Step 9: Rollback (If Needed)

If a deployment causes issues:

```bash
# Method 1: Redeploy previous Git version
git log --oneline  # Find previous working commit
git checkout <previous-commit-sha>
databricks bundle deploy --target prod

# Method 2: Redeploy previous Git tag
git tag -l  # List tags
git checkout v0.1.0-prod  # Checkout previous version
databricks bundle deploy --target prod

# Method 3: Manual resource rollback
# Revert specific job to previous definition
databricks jobs reset <job-id> --json-file backup/job-definition.json
```

**Rollback Verification**:
1. Check job configuration reverted
2. Trigger test job run
3. Verify data output
4. Monitor for errors

---

## Common Workflows

### Daily Development Cycle

```bash
# 1. Pull latest changes
git pull origin 003-databricks-asset-bundles

# 2. Make code changes
vim databricks_app/src/generators/household_generator.py

# 3. Test locally (if applicable)
pytest tests/

# 4. Validate bundle
databricks bundle validate

# 5. Deploy to dev
databricks bundle deploy --target dev

# 6. Test in dev workspace
# (Manually trigger job or test app)

# 7. Commit and push
git add .
git commit -m "feat: improve household generation"
git push

# 8. GitHub Actions automatically deploys to dev
```

### Production Release Cycle

```bash
# 1. Ensure dev is stable
databricks bundle deploy --target dev
# Run comprehensive tests

# 2. Create release branch (if not using main)
git checkout -b release/v0.2.0

# 3. Tag release
git tag -a v0.2.0-prod -m "Production release 0.2.0"
git push origin v0.2.0-prod

# 4. Deploy to prod via GitHub Actions
# (Workflow triggers on tag push, requires manual approval)

# OR deploy locally with safeguards:
databricks bundle deploy --target prod
# Respond to confirmation prompts
```

### Hotfix Workflow (Emergency Prod Fix)

```bash
# 1. Create hotfix branch from prod tag
git checkout v1.0.0-prod
git checkout -b hotfix/critical-fix

# 2. Make minimal fix
vim databricks_app/generation_notebook.py

# 3. Commit fix
git add databricks_app/generation_notebook.py
git commit -m "fix: critical data generation bug"

# 4. Deploy to dev for testing
databricks bundle deploy --target dev

# 5. Trigger test job run
databricks jobs run-now <dev-job-id>

# 6. If successful, tag hotfix
git tag -a v1.0.1-prod -m "Hotfix: critical bug"
git push origin v1.0.1-prod

# 7. GitHub Actions deploys to prod with approval
# 8. Merge hotfix back to main
git checkout main
git merge hotfix/critical-fix
git push origin main
```

### Multi-Environment Promotion Workflow

```bash
# Scenario: Add staging environment between dev and prod

# 1. Add staging target to databricks.yml
targets:
  staging:
    mode: development
    workspace:
      host: https://e2-demo-field-eng.cloud.databricks.com
    variables:
      schema_name: synthetic_datasets_staging
      cluster_node_type: i3.xlarge
      cluster_num_workers: 4  # Between dev (2) and prod (8)

# 2. Deploy to staging
databricks bundle deploy --target staging

# 3. Promotion workflow: dev → staging → prod
# After dev testing:
databricks bundle deploy --target staging

# After staging validation:
git tag -a v1.1.0-prod -m "Release 1.1.0"
git push origin v1.1.0-prod
# (Triggers prod deployment with approval)
```

### Parallel Development Workflow

```bash
# Scenario: Multiple developers working on same bundle

# Developer A: Working on household generator
git checkout -b feature/household-improvements
vim databricks_app/src/generators/household_generator.py
databricks bundle deploy --target dev  # Deploy to dev

# Developer B: Working on campaign generator (parallel)
git checkout -b feature/campaign-improvements
vim databricks_app/src/generators/campaign_generator.py
databricks bundle deploy --target dev  # Overwrites dev deployment

# Solution: Use personal dev environments
# Developer A:
databricks bundle deploy --target dev --var="schema_name=synthetic_datasets_dev_alice"

# Developer B:
databricks bundle deploy --target dev --var="schema_name=synthetic_datasets_dev_bob"
```

### Configuration-Only Update

```bash
# Scenario: Update cluster size without code changes

# 1. Edit databricks.yml
vim databricks.yml
# Change: cluster_num_workers from 2 to 4 in dev target

# 2. Validate change
databricks bundle validate --target dev

# 3. Deploy (only config updated, no code upload)
databricks bundle deploy --target dev

# Expected: Bundle detects only config change
# Deployment time: ~30 seconds (vs ~2 minutes for full)
```

### Troubleshooting Deployment Issues

```bash
# View detailed deployment logs
databricks bundle deploy --target dev --debug

# Validate specific target
databricks bundle validate --target prod

# Check workspace filesystem
databricks workspace list /Users/<your-user>/.bundle/

# Inspect deployed job definition
databricks jobs get <job-id> --output json | jq .

# Check app status
databricks apps get <app-name>

# Compare deployed vs local configuration
databricks bundle deploy --target dev --dry-run
```

### Blue-Green Deployment Pattern

```bash
# Scenario: Zero-downtime production deployment

# 1. Create blue (current prod) and green (new version) targets
targets:
  prod-blue:
    mode: production
    variables:
      schema_name: synthetic_datasets_prod

  prod-green:
    mode: production
    variables:
      schema_name: synthetic_datasets_prod_green

# 2. Deploy new version to green
databricks bundle deploy --target prod-green

# 3. Run parallel testing (green vs blue)
# Verify green produces same results

# 4. Switch traffic to green (update job schedule)
# Update databricks.yml to point 'prod' to green config

# 5. Keep blue as rollback option for 24 hours
# Then decommission blue environment
```

---

## Success Criteria

After completing this quickstart, you should have:

- [x] Validated bundle configuration locally
- [x] Deployed to dev environment successfully
- [x] Verified dev job and app are functional
- [x] Deployed to prod with all safeguards active
- [x] Verified prod deployment uses correct catalog/schema
- [x] Tested incremental update (change detection works)
- [x] Documented rollback procedure

---

## Next Steps

- **Automate with GitHub Actions**: See `.github/workflows/databricks-deploy.yml`
- **Add More Environments**: Extend bundle with staging target
- **Configure Alerts**: Set up job failure notifications
- **Monitor Performance**: Review job run metrics in Databricks UI
- **Scale Configuration**: Adjust cluster sizes based on workload

---

## Reference

**Key Files**:
- `databricks.yml` - Root bundle configuration
- `resources/jobs/synthetic-data-generation.yml` - Job definition
- `resources/apps/synthetic-data-generator.yml` - App definition
- `.github/workflows/databricks-deploy.yml` - CI/CD automation

**CLI Commands**:
- `databricks bundle validate` - Validate configuration
- `databricks bundle deploy --target <env>` - Deploy to environment
- `databricks bundle resources list --target <env>` - List deployed resources
- `databricks jobs run-now <job-id>` - Trigger job execution

**Documentation**:
- [Databricks Asset Bundles](https://docs.databricks.com/dev-tools/bundles/index.html)
- [CLI Reference](https://docs.databricks.com/dev-tools/cli/bundle-cli.html)
- [GitHub Actions Integration](https://github.com/databricks/setup-cli)

---

**Completion Time**: 20-30 minutes for first deployment, 5-10 minutes for subsequent updates
