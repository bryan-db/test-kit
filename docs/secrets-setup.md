# Secret Scope Configuration Guide

**Feature**: 003-databricks-asset-bundles
**Purpose**: Configure Databricks secret scopes for secure credential management
**Audience**: DevOps engineers, platform administrators

---

## Overview

Databricks secret scopes provide secure storage for sensitive credentials (API tokens, database passwords, service principal secrets) that can be referenced in bundle configurations and job parameters.

This guide covers setup of **environment-specific secret scopes** for the test-kit bundle deployment.

---

## Architecture

### Secret Scope Strategy

```
dev-secrets (scope)
├── databricks_token        # Dev workspace PAT
├── external_api_key        # Optional: external service keys
└── db_connection_string    # Optional: database credentials

prod-secrets (scope)
├── databricks_client_id      # Service principal ID
├── databricks_client_secret  # Service principal secret
├── external_api_key          # Production API keys
└── db_connection_string      # Production database credentials
```

**Environment Isolation**: Separate scopes ensure dev and prod credentials never mix.

---

## Prerequisites

**Required Permissions**:
- **Secret Admin**: Ability to create secret scopes
- **Catalog Admin**: Grant READ access to service principals/users

**Required Tools**:
- Databricks CLI 0.200+
- Workspace access

---

## Step 1: Create Secret Scopes

### Create Dev Secret Scope

```bash
# Using Databricks CLI
databricks secrets create-scope dev-secrets

# Expected output:
# Successfully created secret scope: dev-secrets
```

### Create Prod Secret Scope

```bash
databricks secrets create-scope prod-secrets

# Expected output:
# Successfully created secret scope: prod-secrets
```

**Verification**:
```bash
# List all secret scopes
databricks secrets list-scopes

# Expected output:
# Scope        Backend Type
# dev-secrets  DATABRICKS
# prod-secrets DATABRICKS
```

---

## Step 2: Add Secrets to Dev Scope

### Dev Workspace Token (Personal Access Token)

```bash
# Generate token in Databricks UI:
# 1. User Settings → Developer → Access Tokens
# 2. Generate New Token
# 3. Comment: "test-kit dev deployment"
# 4. Lifetime: 90 days
# 5. Copy token (shown once)

# Add token to dev-secrets scope
databricks secrets put-secret dev-secrets databricks_token

# Interactive prompt will open in editor
# Paste token, save, and exit
```

**Alternative (Non-interactive)**:
```bash
echo -n "dapi..." | databricks secrets put-secret dev-secrets databricks_token --string-value
```

---

### Optional: External Service Credentials (Dev)

```bash
# Example: External API key for dev environment
databricks secrets put-secret dev-secrets external_api_key

# Example: Dev database connection string
databricks secrets put-secret dev-secrets db_connection_string
```

---

## Step 3: Add Secrets to Prod Scope

### Service Principal Credentials (Recommended for Prod)

**Why Service Principal**: Better security, rotation, auditing compared to user tokens.

#### Create Service Principal

```bash
# 1. In Databricks UI:
# Admin Console → Service Principals → Add Service Principal

# 2. Name: test-kit-prod-deployer
# 3. Copy:
#    - Application (Client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
#    - Client Secret: (generate and copy immediately)
```

#### Store Service Principal Credentials

```bash
# Store client ID
echo -n "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" | \
  databricks secrets put-secret prod-secrets databricks_client_id --string-value

# Store client secret
databricks secrets put-secret prod-secrets databricks_client_secret

# Interactive editor opens - paste secret, save, exit
```

---

### Optional: Production Service Credentials

```bash
# Production API key
databricks secrets put-secret prod-secrets external_api_key

# Production database connection
databricks secrets put-secret prod-secrets db_connection_string
```

---

## Step 4: Grant Access Permissions

### For Dev Scope

```bash
# Grant READ permission to users/groups
databricks secrets put-acl dev-secrets user@example.com READ

# Grant READ to service account
databricks secrets put-acl dev-secrets test-kit-dev-sa READ

# List ACLs
databricks secrets list-acls dev-secrets
```

### For Prod Scope

```bash
# Grant READ permission to prod service principal
databricks secrets put-acl prod-secrets test-kit-prod-deployer READ

# Grant READ to prod job execution account
databricks secrets put-acl prod-secrets <job-execution-principal> READ

# List ACLs
databricks secrets list-acls prod-secrets
```

**Important**: Follow principle of least privilege - only grant READ access to necessary principals.

---

## Step 5: Reference Secrets in Bundle

### Using Secrets in Job Parameters

Update `databricks.yml` to reference secrets:

```yaml
resources:
  jobs:
    synthetic_data_generation:
      tasks:
        - task_key: generate_data
          notebook_task:
            notebook_path: databricks_app/generation_notebook.py
            base_parameters:
              catalog: "${var.catalog_name}"
              schema: "${var.schema_name}"
              # Reference secret from environment-specific scope
              api_key: "{{secrets/${var.secret_scope}/external_api_key}}"
```

### Define Secret Scope Variable

```yaml
variables:
  secret_scope:
    description: "Secret scope name (environment-specific)"
    # No default - must be set by target

targets:
  dev:
    variables:
      secret_scope: dev-secrets  # Use dev scope

  prod:
    variables:
      secret_scope: prod-secrets  # Use prod scope
```

---

## Step 6: Configure GitHub Actions Secrets

### For Dev Deployments

```bash
# In GitHub repository:
# Settings → Secrets and variables → Actions → New repository secret

# Add secrets:
Name: DATABRICKS_HOST
Value: https://e2-demo-field-eng.cloud.databricks.com

Name: DATABRICKS_TOKEN
Value: <dev-workspace-pat>
```

### For Prod Deployments

```bash
# Add production secrets:
Name: DATABRICKS_CLIENT_ID
Value: <service-principal-client-id>

Name: DATABRICKS_CLIENT_SECRET
Value: <service-principal-client-secret>
```

**Verification**:
```bash
# Check secrets are set (values hidden)
# Repository → Settings → Secrets and variables → Actions
```

---

## Step 7: Verify Secret Access

### From CLI

```bash
# List secrets in scope (names only, values never shown)
databricks secrets list-secrets dev-secrets

# Expected output:
# Key                  Last Updated
# databricks_token     2025-10-02T16:00:00Z
# external_api_key     2025-10-02T16:05:00Z
```

### From Notebook/Job

```python
# In Databricks notebook
dbutils.secrets.get(scope="dev-secrets", key="external_api_key")
# Returns: <redacted> (value is masked in output)

# Use in code
api_key = dbutils.secrets.get(scope="dev-secrets", key="external_api_key")
# api_key contains actual value (never logged)
```

**Security Note**: Secret values are NEVER displayed in logs, notebook outputs, or error messages.

---

## Secret Rotation

### Rotate Dev Token

```bash
# 1. Generate new token in Databricks UI
# 2. Update secret
databricks secrets put-secret dev-secrets databricks_token

# 3. Update GitHub secret
# GitHub → Settings → Secrets → DATABRICKS_TOKEN → Update

# 4. Test deployment
databricks bundle deploy --target dev
```

### Rotate Prod Service Principal Secret

```bash
# 1. Generate new secret in Databricks UI
# Admin Console → Service Principals → test-kit-prod-deployer → Generate Secret

# 2. Update secret scope
databricks secrets put-secret prod-secrets databricks_client_secret

# 3. Update GitHub secret
# GitHub → Settings → Secrets → DATABRICKS_CLIENT_SECRET → Update

# 4. Test deployment (requires approval)
git tag v1.0.1-test
git push origin v1.0.1-test
```

**Recommended Rotation Schedule**:
- Dev tokens: Every 90 days
- Prod service principal secrets: Every 180 days
- External API keys: Per vendor requirements

---

## Best Practices

### Security

1. **Principle of Least Privilege**
   - Grant only READ access to secrets
   - Limit scope access to specific principals
   - Separate dev and prod scopes

2. **Never Commit Secrets**
   ```bash
   # ❌ DO NOT
   export DATABRICKS_TOKEN=dapi123456789...
   git add .env  # BAD - secrets in version control

   # ✅ DO
   # Use secret scopes or GitHub secrets
   # Add .env to .gitignore
   ```

3. **Audit Secret Access**
   ```bash
   # Regularly review who has access
   databricks secrets list-acls dev-secrets
   databricks secrets list-acls prod-secrets
   ```

### Naming Conventions

```bash
# Secret scope names
{environment}-secrets         # dev-secrets, prod-secrets

# Secret key names (lowercase, underscores)
databricks_token             # PAT for workspace access
databricks_client_id         # Service principal ID
databricks_client_secret     # Service principal secret
external_api_key             # Third-party API keys
db_connection_string         # Database credentials
```

### Documentation

```bash
# Document all secrets in secrets-inventory.md
# Include:
# - Secret name
# - Purpose
# - Rotation schedule
# - Owner
# - Access principals

# Example:
# | Secret | Scope | Purpose | Rotation | Owner |
# |--------|-------|---------|----------|-------|
# | databricks_token | dev-secrets | Dev deployment | 90 days | DevOps team |
```

---

## Troubleshooting

### Error: "secret scope already exists"

```bash
# Check existing scopes
databricks secrets list-scopes

# If scope exists but you need to recreate:
# (WARNING: Deletes all secrets in scope)
databricks secrets delete-scope dev-secrets
databricks secrets create-scope dev-secrets
```

### Error: "permission denied: secret not found"

```bash
# Verify secret exists
databricks secrets list-secrets dev-secrets

# Check ACL permissions
databricks secrets list-acls dev-secrets

# Grant access if needed
databricks secrets put-acl dev-secrets <principal> READ
```

### Error: "secret value is empty"

```bash
# Re-put secret with value
databricks secrets put-secret dev-secrets databricks_token

# Verify (shows last updated time)
databricks secrets list-secrets dev-secrets
```

---

## Migration Guide

### Migrating from Environment Variables

**Before**:
```yaml
# databricks.yml
resources:
  jobs:
    my_job:
      tasks:
        - notebook_task:
            base_parameters:
              api_key: "${var.api_key}"  # Passed as variable
```

**After**:
```yaml
# databricks.yml
resources:
  jobs:
    my_job:
      tasks:
        - notebook_task:
            base_parameters:
              api_key: "{{secrets/${var.secret_scope}/api_key}}"  # From secret scope
```

**Migration Steps**:
1. Create secret scopes (dev-secrets, prod-secrets)
2. Add secrets to scopes
3. Update bundle configuration to reference secrets
4. Remove environment variables from CI/CD
5. Test deployments
6. Delete old environment variables

---

## Quick Reference

### Common Commands

```bash
# Create scope
databricks secrets create-scope <scope-name>

# Add secret (interactive)
databricks secrets put-secret <scope> <key>

# Add secret (non-interactive)
echo -n "<value>" | databricks secrets put-secret <scope> <key> --string-value

# List scopes
databricks secrets list-scopes

# List secrets in scope
databricks secrets list-secrets <scope>

# Grant access
databricks secrets put-acl <scope> <principal> READ

# List ACLs
databricks secrets list-acls <scope>

# Delete secret
databricks secrets delete-secret <scope> <key>

# Delete scope
databricks secrets delete-scope <scope>
```

### Secret Scope Reference

| Scope | Purpose | Secrets | Access |
|-------|---------|---------|--------|
| **dev-secrets** | Development environment | databricks_token, external_api_key | Dev users, dev service account |
| **prod-secrets** | Production environment | databricks_client_id, databricks_client_secret, external_api_key | Prod service principal only |

---

## Additional Resources

- **Databricks Docs**: [Secret Scopes](https://docs.databricks.com/security/secrets/index.html)
- **CLI Reference**: [Secrets Commands](https://docs.databricks.com/dev-tools/cli/secrets-cli.html)
- **Bundle Docs**: [Using Secrets in Bundles](https://docs.databricks.com/dev-tools/bundles/settings.html#use-secret-references)

---

**Last Updated**: 2025-10-02
**Version**: 1.0.0
**Maintainer**: test-kit security team
