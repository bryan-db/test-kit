# Troubleshooting Guide: Databricks Asset Bundles

**Feature**: 003-databricks-asset-bundles
**Purpose**: Diagnose and resolve common bundle deployment issues
**Audience**: DevOps engineers, data engineers

---

## Table of Contents

1. [Validation Errors](#validation-errors)
2. [Deployment Failures](#deployment-failures)
3. [Authentication Issues](#authentication-issues)
4. [Resource Configuration Errors](#resource-configuration-errors)
5. [CI/CD Pipeline Issues](#cicd-pipeline-issues)
6. [Rollback Procedures](#rollback-procedures)
7. [Performance Issues](#performance-issues)
8. [Getting Help](#getting-help)

---

## Validation Errors

### Error: "please specify target"

**Symptom**:
```bash
$ databricks bundle validate
Error: please specify target
```

**Cause**: No default target configured; must specify `--target` explicitly

**Solution**:
```bash
databricks bundle validate --target dev
# or
databricks bundle validate --target prod
```

---

### Error: "notebook {path} not found"

**Symptom**:
```bash
Error: notebook databricks_app/generation_notebook.py not found
```

**Cause**: Notebook file doesn't exist or path is incorrect

**Solution**:
```bash
# 1. Verify file exists
ls databricks_app/generation_notebook.py

# 2. Check path in databricks.yml
grep -A5 "notebook_path" databricks.yml

# 3. Ensure path is relative to bundle root (not resources/ directory)
# Correct:   notebook_path: databricks_app/generation_notebook.py
# Incorrect: notebook_path: ../../databricks_app/generation_notebook.py
```

---

### Error: "variable '{name}' has no value"

**Symptom**:
```bash
Error: variable 'schema_name' has no value
```

**Cause**: Variable not defined in target configuration or has no default

**Solution**:
```yaml
# In databricks.yml, ensure target defines all required variables
targets:
  dev:
    variables:
      schema_name: synthetic_datasets_dev  # Must be set
      cluster_node_type: i3.xlarge
      cluster_num_workers: 2
```

---

### Error: "invalid YAML syntax"

**Symptom**:
```bash
Error: yaml: line 42: mapping values are not allowed in this context
```

**Cause**: YAML indentation or syntax error

**Solution**:
```bash
# 1. Check indentation (use spaces, not tabs)
cat -A databricks.yml | head -50

# 2. Validate YAML syntax online or with yq
yq eval databricks.yml

# 3. Common issues:
# - Inconsistent indentation
# - Missing colons after keys
# - Unquoted special characters
```

---

## Deployment Failures

### Error: "permission denied" during deployment

**Symptom**:
```bash
Error: permission denied: user lacks CAN_MANAGE permission on job
```

**Cause**: Insufficient permissions in Databricks workspace

**Solution**:
```bash
# 1. Verify workspace access
databricks workspace list /

# 2. Check catalog permissions
# Required permissions:
# - CREATE on catalog (bryan_li)
# - CREATE SCHEMA on catalog
# - CAN_MANAGE on jobs (if updating existing job)

# 3. Request permissions from workspace admin
# Example GRANT statement:
# GRANT CREATE ON CATALOG bryan_li TO `user@example.com`
```

---

### Error: "cluster node type not available"

**Symptom**:
```bash
Error: node_type_id 'i3.xlarge' is not available in this workspace
```

**Cause**: Cluster node type not enabled or unavailable in region

**Solution**:
```bash
# 1. List available node types
databricks clusters spark-versions

# 2. Update databricks.yml with available type
targets:
  dev:
    variables:
      cluster_node_type: m5.large  # Change to available type
```

---

### Error: "deployment state conflict"

**Symptom**:
```bash
Error: deployment state conflict - resource already exists
```

**Cause**: Resource created manually or by different user

**Solution**:
```bash
# Option 1: Delete existing resource (if safe)
databricks jobs delete <job-id>
databricks bundle deploy --target dev

# Option 2: Import existing resource into bundle
# Contact Databricks support for import guidance

# Option 3: Change bundle name to avoid conflict
bundle:
  name: test-kit-v2  # New unique name
```

---

## Authentication Issues

### Error: "Invalid access to Org"

**Symptom**:
```bash
Error: Invalid access to Org: 1444828305810485
```

**Cause**: Token expired or invalid

**Solution**:
```bash
# 1. Generate new token in Databricks UI
# Settings → Developer → Access Tokens → Generate New Token

# 2. Update environment variable
export DATABRICKS_TOKEN=<new-token>

# 3. Verify authentication
databricks workspace list /
```

---

### Error: "authentication required"

**Symptom**:
```bash
Error: authentication required
```

**Cause**: Missing or incorrect authentication credentials

**Solution**:
```bash
# Check which auth method you're using:

# Method 1: Environment variables
export DATABRICKS_HOST=https://e2-demo-field-eng.cloud.databricks.com
export DATABRICKS_TOKEN=<your-token>

# Method 2: Profile
databricks configure --profile test-kit-dev
export DATABRICKS_CONFIG_PROFILE=test-kit-dev

# Method 3: Service principal (prod only)
export DATABRICKS_CLIENT_ID=<client-id>
export DATABRICKS_CLIENT_SECRET=<client-secret>

# Verify
databricks auth profiles
```

---

## Resource Configuration Errors

### Error: "app source_code_path not found"

**Symptom**:
```bash
Error: source_code_path 'react-app/' does not exist or missing app.yaml
```

**Cause**: App directory missing or app.yaml not present

**Solution**:
```bash
# 1. Verify directory exists
ls -la react-app/

# 2. Check for app.yaml
ls react-app/app.yaml

# 3. If missing, create app.yaml
cat > react-app/app.yaml <<EOF
command: ["sh", "-c", "python3 -m http.server 8080 --directory dist"]
EOF
```

---

### Error: "circular dependency in resources"

**Symptom**:
```bash
Error: circular dependency detected: app → job → app
```

**Cause**: Resources reference each other in a loop

**Solution**:
```yaml
# Ensure job doesn't reference app, only app references job
resources:
  apps:
    synthetic_data_generator:
      resources:
        - job:
            id: "${resources.jobs.synthetic_data_generation.id}"  # ✅ Correct

  jobs:
    synthetic_data_generation:
      # Don't reference app here ❌
```

---

## CI/CD Pipeline Issues

### GitHub Actions: "secrets not found"

**Symptom**:
```
Error: secret DATABRICKS_TOKEN not found
```

**Cause**: GitHub repository secrets not configured

**Solution**:
```bash
# 1. Go to GitHub repository
# 2. Settings → Secrets and variables → Actions
# 3. Add required secrets:

# For dev deployments:
DATABRICKS_HOST=https://e2-demo-field-eng.cloud.databricks.com
DATABRICKS_TOKEN=<dev-token>

# For prod deployments:
DATABRICKS_CLIENT_ID=<service-principal-id>
DATABRICKS_CLIENT_SECRET=<service-principal-secret>
```

---

### GitHub Actions: "environment protection rules"

**Symptom**:
```
Deployment blocked: environment 'production' requires approval
```

**Cause**: Production environment not configured or reviewers not set

**Solution**:
```bash
# 1. Go to GitHub repository
# 2. Settings → Environments → New environment
# 3. Name: production
# 4. Add required reviewers
# 5. Set deployment branch restrictions (optional)
# 6. Save protection rules
```

---

### GitHub Actions: "workflow not triggering"

**Symptom**: Workflow doesn't run on push or tag

**Cause**: Workflow trigger configuration or permissions issue

**Solution**:
```yaml
# Check .github/workflows/databricks-deploy.yml

# For dev deployments (on push):
on:
  push:
    branches: [main]  # Ensure branch name matches

# For prod deployments (on tag):
on:
  push:
    tags:
      - 'v*'  # Tag must start with 'v'

# Verify tag format:
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0  # Must push tag explicitly
```

---

## Rollback Procedures

### Scenario: Prod deployment broke job execution

**Symptoms**:
- Job runs fail after deployment
- Data not being written to tables
- Cluster startup errors

**Rollback Steps**:

```bash
# 1. Identify last working version
git log --oneline --tags

# Example output:
# a1b2c3d (tag: v1.0.0) Production release 1.0.0
# d4e5f6g (tag: v0.9.0) Previous stable release

# 2. Checkout previous version
git checkout v0.9.0

# 3. Redeploy to prod
databricks bundle deploy --target prod

# 4. Verify job functionality
databricks jobs list | grep "Synthetic Data Generation (prod)"
databricks jobs run-now <job-id>

# 5. Monitor job run
databricks runs get-output <run-id>

# 6. If successful, update tracking
git tag -a v0.9.1-rollback -m "Rollback to v0.9.0"
git push origin v0.9.1-rollback
```

---

### Scenario: Incremental deployment stuck

**Symptoms**:
- Deployment hangs or times out
- Resource partially updated

**Recovery Steps**:

```bash
# 1. Cancel stuck deployment (Ctrl+C)

# 2. Check deployment state
databricks workspace list /Users/<you>/.bundle/prod/test-kit/

# 3. Force clean redeployment
databricks bundle deploy --target prod --force

# 4. If still stuck, delete bundle state
rm -rf /Users/<you>/.bundle/prod/test-kit/
databricks bundle deploy --target prod
```

---

## Performance Issues

### Issue: Bundle validation is slow (>30 seconds)

**Causes & Solutions**:

```bash
# Cause 1: Large number of files
# Solution: Exclude unnecessary files
# Add to .gitignore and ensure they're not in bundle

# Cause 2: Network latency to workspace
# Solution: Use workspace closer to your location or VPN

# Cause 3: Complex variable substitution
# Solution: Simplify variable expressions

# Debug with timing:
time databricks bundle validate --target dev --debug
```

---

### Issue: Deployment takes >10 minutes

**Causes & Solutions**:

```bash
# Cause 1: Large notebook/code uploads
# Solution: Reduce uploaded file size, exclude node_modules/

# Cause 2: Many resources being updated
# Solution: Deploy incrementally, use --force sparingly

# Cause 3: Cluster provisioning delays
# Solution: Use existing cluster or smaller cluster for dev

# Monitor deployment:
databricks bundle deploy --target dev --debug 2>&1 | tee deploy.log
```

---

## Getting Help

### Debug Mode

Enable verbose output for all commands:

```bash
# Validation
databricks bundle validate --target dev --debug

# Deployment
databricks bundle deploy --target dev --debug --verbose

# Save output for support
databricks bundle deploy --target dev --debug 2>&1 | tee support.log
```

---

### Diagnostic Information to Collect

When reporting issues, include:

```bash
# 1. CLI version
databricks --version

# 2. Bundle configuration (sanitized)
cat databricks.yml

# 3. Validation output
databricks bundle validate --target dev

# 4. Deployment error
databricks bundle deploy --target dev --debug

# 5. Workspace info
databricks workspace list / | head -20

# 6. Authentication method
echo "DATABRICKS_HOST: $DATABRICKS_HOST"
echo "Using token: ${DATABRICKS_TOKEN:0:10}..."  # First 10 chars only
```

---

### Common Diagnostic Commands

```bash
# Check bundle structure
tree -L 3 -I 'node_modules|.venv'

# Validate YAML syntax
yq eval databricks.yml

# List deployed resources
databricks bundle resources list --target dev

# Check job status
databricks jobs get <job-id>

# View recent job runs
databricks jobs list-runs --job-id <job-id> --limit 5

# Check app status
databricks apps get <app-name>

# Inspect workspace bundle state
databricks workspace export /Users/<you>/.bundle/dev/test-kit/state.json
```

---

### Support Channels

- **Databricks Documentation**: [Asset Bundles](https://docs.databricks.com/dev-tools/bundles/index.html)
- **CLI Reference**: [Bundle CLI](https://docs.databricks.com/dev-tools/cli/bundle-cli.html)
- **GitHub Issues**: Report bugs in test-kit repository
- **Databricks Support**: Contact via workspace support portal

---

### Quick Reference: Error Codes

| Error | Meaning | Quick Fix |
|-------|---------|-----------|
| `please specify target` | No target specified | Add `--target dev` |
| `notebook not found` | Path incorrect | Check `notebook_path` in YAML |
| `permission denied` | Insufficient access | Request workspace permissions |
| `authentication required` | Missing credentials | Set `DATABRICKS_TOKEN` |
| `Invalid access to Org` | Token expired | Generate new token |
| `node_type not available` | Instance type unavailable | Use different node type |
| `deployment state conflict` | Resource exists | Delete resource or rename bundle |

---

**Last Updated**: 2025-10-02
**Version**: 1.0.0
**Maintainer**: test-kit team
