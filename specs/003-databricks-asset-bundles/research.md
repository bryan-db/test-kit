# Research: Databricks Asset Bundles Deployment

**Feature**: 003-databricks-asset-bundles
**Date**: 2025-10-02
**Status**: Complete

## Research Questions

All critical unknowns were resolved during /clarify session. Additional technical research conducted below.

## 1. Databricks Asset Bundle Format

**Question**: What is the optimal DAB configuration structure for this project?

**Decision**: Use databricks.yml with targets pattern (dev/prod environments)

**Rationale**:
- Official Databricks standard for packaging Databricks resources
- Native support for jobs, notebooks, and Databricks Apps
- Built-in environment targeting (dev/prod) with variable interpolation
- Declarative YAML format integrates with version control
- Databricks CLI provides validation and deployment tooling

**Research Findings**:
- DAB v1.0 schema supports `bundle`, `resources`, `targets`, `variables`
- Jobs are defined in `resources/jobs/*.yml` with notebook_task, cluster spec, schedule
- Apps are defined in `resources/apps/*.yml` or directly in databricks.yml `resources.apps`
- Targets allow environment-specific overrides (workspace URLs, catalog names, cluster sizes)
- Mode setting (`development` vs `production`) affects deployment safety checks

**Alternatives Considered**:
1. **Terraform** - Rejected: More complex, requires additional tooling, not Databricks-native
2. **Manual deployment scripts** - Rejected: Not repeatable, no environment targeting, error-prone
3. **Separate repos per environment** - Rejected: Duplicates code, makes promotion difficult

**Documentation**:
- https://docs.databricks.com/dev-tools/cli/bundle-cli.html
- https://docs.databricks.com/dev-tools/bundles/index.html

---

## 2. GitHub Actions Integration

**Question**: How to integrate Databricks CLI with GitHub Actions for CI/CD?

**Decision**: Use `databricks/setup-cli@main` action with service principal authentication

**Rationale**:
- Official Databricks-maintained action
- Handles CLI installation automatically
- Supports multiple authentication methods (service principal, OAuth, PAT)
- Provides caching for faster workflow execution
- Well-documented and actively maintained

**Research Findings**:
- Action installs latest Databricks CLI by default (can pin version)
- Authentication via environment variables (`DATABRICKS_HOST`, `DATABRICKS_CLIENT_ID`, `DATABRICKS_CLIENT_SECRET`)
- Service principal is recommended for production workflows (more secure than PAT)
- Can use GitHub Environments for approval gates (manual approval before prod deploy)
- Workflow example:
  ```yaml
  - uses: databricks/setup-cli@main
  - run: databricks bundle validate
  - run: databricks bundle deploy --target dev
  ```

**Alternatives Considered**:
1. **Custom Docker image** - Rejected: Unnecessary complexity, slower builds
2. **Direct CLI installation** - Rejected: Reinvents action, less maintainable
3. **Jenkins/CircleCI** - Rejected: GitHub Actions requirement from clarifications

**Documentation**:
- https://github.com/databricks/setup-cli
- https://docs.github.com/en/actions/deployment/targeting-different-environments

---

## 3. Production Deployment Safeguards

**Question**: How to implement multi-layer safeguards (approval + lock + flag)?

**Decision**: Combine GitHub Environment protection, DAB mode setting, and CLI flag requirement

**Rationale**:
- Layered approach provides defense-in-depth
- Each layer catches different types of errors (human, config, automation)
- Complies with /clarify requirement: "All of the above"

**Implementation Strategy**:

**Layer 1: Explicit --prod Flag**
- Require `--target prod` in all production deployments
- No default production target
- CLI command: `databricks bundle deploy --target prod`

**Layer 2: Environment Lock (DAB mode)**
- Set `mode: production` in prod target configuration
- Databricks CLI enforces additional checks in production mode
- Prevents accidental destructive operations
- Example:
  ```yaml
  targets:
    prod:
      mode: production
      workspace:
        host: https://e2-demo-field-eng.cloud.databricks.com
  ```

**Layer 3: Manual Approval Gate (GitHub)**
- Configure GitHub Environment "production" with required reviewers
- Workflow waits for manual approval before deploying
- Example:
  ```yaml
  environment:
    name: production
    url: ${{ steps.deploy.outputs.url }}
  ```

**Research Findings**:
- GitHub Environment protection rules support:
  - Required reviewers (1-6 reviewers)
  - Wait timer (delay deployment by X minutes)
  - Deployment branches (restrict to specific branches)
- DAB `mode: production` adds validation checks for resource changes
- Combining all three layers prevents:
  - Accidental deploys (manual approval)
  - Misconfigured deploys (mode validation)
  - Scripting errors (explicit flag requirement)

**Alternatives Considered**:
1. **Single-layer (approval only)** - Rejected: Doesn't meet "all of the above" requirement
2. **Custom gatekeeper script** - Rejected: Reinvents native capabilities
3. **Separate prod repository** - Rejected: Complicates code sync

**Documentation**:
- https://docs.databricks.com/dev-tools/bundles/deployment-modes.html
- https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment

---

## 4. Databricks Secrets Management

**Question**: How to reference secrets in DAB configuration for environment-specific credentials?

**Decision**: Use secret scopes with dynamic references in bundle configuration

**Rationale**:
- Databricks secrets are the clarified requirement
- Secret scopes provide environment isolation (dev scope, prod scope)
- Dynamic references (`{{ secrets/scope/key }}`) keep secrets out of version control
- Unity Catalog integration for access control

**Implementation Pattern**:
```yaml
variables:
  secret_scope:
    description: Databricks secret scope for credentials
    default: ${bundle.target}  # dev or prod

resources:
  jobs:
    synthetic_data_generation:
      tasks:
        - task_key: generate_data
          notebook_task:
            base_parameters:
              token: "{{ secrets/${var.secret_scope}/databricks_token }}"
```

**Research Findings**:
- Secret scopes: `dev-secrets`, `prod-secrets` (naming convention)
- Access control via Unity Catalog ACLs on secret scopes
- Job service principal needs READ permission on secret scope
- Secrets never appear in bundle validation or logs
- CLI manages secrets: `databricks secrets put --scope <scope> --key <key>`

**Best Practices**:
1. Use separate secret scopes per environment
2. Grant minimal permissions (READ only for jobs)
3. Rotate secrets regularly
4. Document secret keys in deployment guide (values stay secret)

**Alternatives Considered**:
1. **Environment variables** - Rejected: Not the clarified requirement
2. **External vault (AWS Secrets Manager)** - Rejected: Not the clarified requirement
3. **Encrypted config files** - Rejected: More complex, not Databricks-native

**Documentation**:
- https://docs.databricks.com/security/secrets/index.html
- https://docs.databricks.com/dev-tools/bundles/settings.html#use-secret-references

---

## 5. Bundle Versioning and Rollback

**Question**: How to implement deployment rollback capability?

**Decision**: Use Git tags + bundle state tracking for version-based rollback

**Rationale**:
- Git provides immutable version history
- DAB state tracking knows what was deployed
- Rollback = redeploy previous Git tag
- Simple, auditable, no custom tooling required

**Implementation Strategy**:

**Versioning**:
1. Tag each deployment: `v0.1.0-dev`, `v0.1.0-prod`
2. Bundle config references git SHA: `bundle.git.commit`
3. Track deployed version in workspace tags

**Rollback Procedure**:
1. Identify previous working version: `git log --tags`
2. Checkout that version: `git checkout v0.0.9-prod`
3. Redeploy: `databricks bundle deploy --target prod`
4. Verify: Check job runs, app availability

**Research Findings**:
- DAB maintains state in workspace `.bundle` directory
- Each deployment is idempotent (safe to redeploy)
- Rollback preserves data (only code/config reverts)
- Can compare deployments: `databricks bundle deploy --target prod --var-file previous.yml`

**Automation Option** (future enhancement):
```yaml
# .github/workflows/rollback.yml
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Git tag to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          ref: ${{ inputs.version }}
      - uses: databricks/setup-cli@main
      - run: databricks bundle deploy --target prod
```

**Alternatives Considered**:
1. **Snapshot-based rollback** - Rejected: More complex, requires state storage
2. **Blue-green deployments** - Rejected: Resource duplication, cost increase
3. **Manual restore** - Rejected: Error-prone, slow

**Documentation**:
- https://docs.databricks.com/dev-tools/bundles/deployment.html
- Best practices from Databricks field engineering

---

## Summary of Decisions

| Area | Decision | Status |
|------|----------|--------|
| Bundle Format | databricks.yml with targets | ✅ Adopted |
| CI/CD Platform | GitHub Actions + databricks/setup-cli | ✅ Adopted |
| Auth Method | Service principal | ✅ Adopted |
| Safeguards | 3-layer (approval + mode + flag) | ✅ Adopted |
| Secrets | Databricks secret scopes (dev/prod) | ✅ Adopted |
| Versioning | Git tags + workspace tracking | ✅ Adopted |

All research complete. No remaining NEEDS CLARIFICATION items.

---

**Next Phase**: Design & Contracts (data-model.md, contracts/, quickstart.md)
