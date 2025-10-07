# Project Constitution: test-kit

## Core Platform Principles

### 1. Official Databricks Documentation
**Principle**: ALWAYS consult official Databricks documentation at https://docs.databricks.com/aws/en before implementing any feature.

**Mandates**:
- **Primary Source**: Official Databricks docs at https://docs.databricks.com/aws/en
- **Never assume**: Verify APIs, syntax, and capabilities in official docs
- **Check for updates**: Databricks releases frequently - verify current best practices
- **Reference sections**:
  - Unity Catalog: https://docs.databricks.com/aws/en/data-governance/unity-catalog/
  - SQL Warehouses: https://docs.databricks.com/aws/en/compute/sql-warehouse/
  - Asset Bundles: https://docs.databricks.com/aws/en/dev-tools/bundles/
  - Apps: https://docs.databricks.com/aws/en/dev-tools/databricks-apps/
  - Statement Execution API: https://docs.databricks.com/aws/en/api/workspace/statementexecution
- **Document references**: Include doc URLs in code comments for key implementations
- **Verify examples**: Test all examples from docs before using in production

**Rationale**: Official documentation is the source of truth. Many issues we encountered could have been prevented by consulting docs first (e.g., correct API endpoints, parameter formats, schema naming conventions).

---

### 2. Databricks Platform Requirements
**Principle**: All features MUST be built specifically for the Databricks platform with Unity Catalog integration.

**Mandates**:
- Use Databricks Serverless Compute for all data processing (no self-managed clusters)
- Use Databricks SQL Warehouses for analytics queries
- Store all data in Unity Catalog with proper catalog.schema.table naming
- Use Databricks Asset Bundles (DAB) for deployment and configuration management
- Leverage Databricks Apps for frontend applications
- Reference docs: https://docs.databricks.com/aws/en/compute/serverless.html

**Rationale**: Databricks provides managed infrastructure. Never assume we need to provision Spark clusters - they already exist. Use serverless for cost efficiency and auto-scaling.

---

### 3. Unity Catalog Data Architecture
**Principle**: All data MUST follow Unity Catalog three-level namespace and medallion architecture.

**Mandates**:
- **Naming convention**: `<catalog>.<schema>.<table>` (e.g., `bryan_li.synthetic_datasets.households`)
- **Medallion layers**:
  - Bronze: Raw ingested data in `synthetic_datasets` schema
  - Silver: Cleaned/validated data in `silver` schema
  - Gold: Aggregated analytics tables in `analytics` schema
- Never use `raw_data` or other non-standard schema names
- Always verify actual table names and schemas before writing queries
- Document catalog structure in data-model.md
- **Documentation**: https://docs.databricks.com/aws/en/data-governance/unity-catalog/
- **Best practices**: https://docs.databricks.com/aws/en/lakehouse-architecture/medallion.html

**Rationale**: Unity Catalog enforces governance and our queries failed multiple times due to incorrect schema/table assumptions.

---

### 4. Schema Validation & Column Names
**Principle**: ALWAYS verify actual table schemas before implementing queries or transformations.

**Mandates**:
- Use `DESCRIBE <catalog>.<schema>.<table>` to verify column names
- Use `SHOW TABLES IN <catalog>.<schema>` to verify table existence
- Never assume column names - query the actual schema first
- Document schema contracts in contracts/ directory
- Add schema validation tests

---

### 5. Databricks SQL Warehouse Configuration
**Principle**: Use validated, running SQL Warehouses for all analytics queries.

**Mandates**:
- Verify warehouse exists and is RUNNING before configuring
- Use API to list warehouses: `GET /api/2.0/sql/warehouses`
- Store warehouse ID in environment variables (e.g., `VITE_DATABRICKS_WAREHOUSE_ID`)
- Check warehouse status before deployment
- Document warehouse requirements in deployment docs
- **Documentation**: https://docs.databricks.com/aws/en/compute/sql-warehouse/
- **API Reference**: https://docs.databricks.com/aws/en/api/workspace/warehouses

**Rationale**: Initial warehouse ID didn't exist, causing all queries to fail. Always validate warehouse ID before use.

---

### 6. API Integration & CORS Handling
**Principle**: Frontend applications MUST use proper proxy configuration for Databricks API access.

**Mandates**:
- **Development**: Use Vite/webpack proxy to avoid CORS issues
  ```javascript
  // vite.config.js
  server: {
    proxy: {
      '/api/2.0': {
        target: 'https://<workspace>.cloud.databricks.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
  ```
- **dbsqlClient**: Use relative URLs in dev (`/api/2.0`), full URLs in production
- **Authentication**: Use PAT tokens in `Authorization: Bearer <token>` headers
- Never make direct browser requests to Databricks API (CORS blocked)

**Rationale**: Initial implementation tried direct API calls from browser, all blocked by CORS. Vite proxy solved this.

---

### 7. Databricks Asset Bundles (DAB)
**Principle**: All Databricks resources MUST be managed via Asset Bundles for reproducible deployments.

**Mandates**:
- Define all resources in `databricks.yml`:
  - Jobs (ETL pipelines, data generation)
  - SQL Warehouses (analytics queries)
  - Apps (frontend deployments)
  - Notebooks (data processing logic)
- Use bundle variables for environment-specific config
- Deploy with `databricks bundle deploy -t <environment>`
- Version control all bundle configurations
- **Documentation**: https://docs.databricks.com/aws/en/dev-tools/bundles/
- **Reference**: https://docs.databricks.com/aws/en/dev-tools/bundles/settings.html

**Rationale**: Asset Bundles provide infrastructure-as-code for Databricks, ensuring consistent deployments across environments.

---

### 8. Databricks Apps Deployment
**Principle**: Frontend applications MUST be deployed as Databricks Apps for integrated authentication and hosting.

**Mandates**:
- Include `app.yaml` in app root with proper configuration
- Use Databricks SDK for backend API integration
- Configure OAuth or PAT authentication
- Set correct base paths for production (`/apps/<app-name>`)
- Test locally before deploying to workspace
- **Documentation**: https://docs.databricks.com/aws/en/dev-tools/databricks-apps/
- **App Configuration**: https://docs.databricks.com/aws/en/dev-tools/databricks-apps/app-configuration.html

**Rationale**: Databricks Apps provide secure, integrated hosting with built-in authentication and Databricks API access.

---

### 9. Environment Configuration
**Principle**: Environment-specific configuration MUST be externalized and validated.

**Mandates**:
- Store all config in `.env` files (not hardcoded)
- Required variables:
  - `DATABRICKS_HOST` - Workspace URL
  - `DATABRICKS_TOKEN` - PAT or OAuth token
  - `DATABRICKS_WAREHOUSE_ID` - SQL Warehouse ID
  - `DATABRICKS_CATALOG` - Target Unity Catalog
- Validate all env vars on startup
- Provide clear error messages for missing config
- Document all env vars in README

**Rationale**: Missing or incorrect environment variables caused multiple deployment failures.

---

### 10. Data Processing with Serverless
**Principle**: All data transformations MUST use Databricks Serverless Compute.

**Mandates**:
- Use `serverless_compute: true` in job definitions
- Never provision dedicated clusters for batch jobs
- Use SQL warehouses for SQL-based transformations
- Use Databricks Jobs API for orchestration
- Configure appropriate timeout and retry policies

**Rationale**: Serverless provides automatic scaling, faster startup, and lower costs. No need to manage cluster configurations.

---

### 11. Testing Against Real Infrastructure
**Principle**: All tests MUST validate against actual Databricks resources, not mocks.

**Mandates**:
- Contract tests verify real table schemas
- Integration tests query actual SQL warehouses
- Validate API responses match expected format
- Test both sync tables and Delta fallbacks

**Rationale**: Mocked tests passed but real queries failed due to schema mismatches. Real infrastructure testing catches these issues.

---

### 12. Error Handling & Debugging
**Principle**: Provide detailed error messages with Databricks-specific context.

**Mandates**:
- Include full error messages from Databricks API responses
- Log SQL queries with actual table names and filters
- Show warehouse ID and catalog in error context
- Provide suggestions for common errors (e.g., "Table not found - verify catalog.schema.table")
- Add debug logging for query execution flow

**Rationale**: Generic errors made debugging difficult. Detailed context helped identify schema and config issues quickly.

---

### 13. Frontend Data Fetching
**Principle**: React dashboards MUST use React Query with proper caching and error handling.

**Mandates**:
- Use TanStack React Query for all data fetching
- Implement retry logic (exponential backoff)
- Cache queries appropriately (5-10 min stale time)
- Show loading and error states
- Support both sync tables and Delta fallbacks
- Use `useAnalyticsAuth()` for role-based access

**Rationale**: React Query provides built-in caching, retries, and state management, reducing boilerplate and improving UX.

---

### 14. Development Workflow
**Principle**: Support local development with production-like environment.

**Mandates**:
- Provide dev mode with mock authentication
- Use Vite proxy for local API access
- Support hot module reload (HMR)
- Validate environment on startup
- Document local setup in README
- Provide sample `.env` file

**Rationale**: Seamless local development improves productivity and reduces deployment surprises.

---

### 15. Version Control & Release Management
**Principle**: All code MUST be version controlled with regular commits and tagged releases for rollback capability.

**Mandates**:
- **GitHub Repository**: Create GitHub repo if one doesn't exist
- **Commit Frequency**: Commit code at every milestone (feature complete, phase complete, bug fix)
- **Commit Messages**: Follow conventional commits format:
  ```
  feat: implement campaign performance dashboard
  fix: correct schema mismatch in query service
  docs: update constitution with Databricks principles
  ```
- **Releases**: Create GitHub releases for major milestones
  - Tag format: `v<major>.<minor>.<patch>` (e.g., `v0.1.0`)
  - Release on: feature completion, production deployment, breaking changes
- **Branches**: Use feature branches for development, `main` for production-ready code
- **Rollback Strategy**: Always maintain ability to rollback to previous release
- **CI/CD**: Integrate with Databricks Asset Bundle deployments

**Rationale**: Version control enables safe experimentation, easy rollback when issues occur, and team collaboration. Releases provide known-good checkpoints.

---

### 16. Databricks MCP Server Deployment
**Principle**: Deploy Databricks MCP (Model Context Protocol) server as part of environment configuration for AI-assisted development.

**Mandates**:
- **Prerequisites**: Verify environment has Python 3.11+, Node.js 18+, Databricks CLI, Git
- **Repository**: Clone https://github.com/PulkitXChadha/awesome-databricks-mcp
- **Check Existing Deployment**: Query Databricks Apps to check if MCP server already deployed
  ```bash
  databricks apps list --output json | grep "mcp-server"
  ```
- **Deploy if Missing**: Follow setup script to deploy MCP server
  1. Run setup script from repository
  2. Configure Databricks authentication (use workspace token)
  3. Deploy to Databricks Apps via Asset Bundle
  4. Verify deployment and capture app URL
- **Document Configuration**: Add MCP server URL to environment variables
  - `DATABRICKS_MCP_SERVER_URL` - MCP server endpoint
  - Document in README and `.env.example`
- **Integration**: Add MCP server to Claude Desktop config for seamless AI assistance
- **Security**: Ensure MCP server uses same authentication as workspace (PAT/OAuth)
- **Monitoring**: Verify MCP server is RUNNING before starting development

**What it Provides**:
- Secure bridge between AI assistants and Databricks workspace
- Dynamic prompt loading from markdown files
- Python functions exposed as MCP tools
- React TypeScript frontend for MCP discovery
- Controlled, authenticated access to Databricks resources

**Rationale**: The MCP server enables AI assistants to interact safely with Databricks workspaces, providing contextual access to workspace resources, queries, and tools. This accelerates development by giving AI assistants the ability to validate schemas, run queries, and access documentation directly from the workspace.

**Documentation**: https://github.com/PulkitXChadha/awesome-databricks-mcp

---

## Implementation Checklist

Before implementing any feature, verify:

- [ ] Unity Catalog structure is documented (catalog.schema.table)
- [ ] Actual table schemas are verified with `DESCRIBE` commands
- [ ] SQL Warehouse ID is validated and warehouse is RUNNING
- [ ] Environment variables are configured and validated
- [ ] Vite proxy is configured for local development
- [ ] Databricks Asset Bundle includes all resources
- [ ] Databricks MCP server is deployed and RUNNING
- [ ] Tests validate against real Databricks infrastructure
- [ ] Error messages include Databricks-specific context
- [ ] React Query hooks are implemented for data fetching
- [ ] Dev mode authentication is configured

---

## Lessons Learned

### Common Pitfalls to Avoid:

1. **Schema Assumptions**: Never assume table/column names. Always verify first.
2. **Direct Browser API Calls**: Always use proxy in development (CORS issues).
3. **Hardcoded Config**: Externalize all Databricks-specific config to env vars.
4. **Missing Validation**: Validate warehouse exists before using it.
5. **Mocked Tests Only**: Test against real Databricks resources to catch schema issues.
6. **Plural/Singular Confusion**: Check exact column names (e.g., `target_segment` not `target_segments`).
7. **Sync Table Assumptions**: Don't assume `_sync` tables exist - implement fallback logic.
8. **Schema Names**: Use actual schema names from Unity Catalog, not assumed ones.

---

**Last Updated**: 2025-10-07 (Added Principle #16: MCP Server Deployment)
**Contributors**: Implementation team based on Feature 004 learnings
