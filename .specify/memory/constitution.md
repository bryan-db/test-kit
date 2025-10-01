<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- Modified principles:
  * Lakehouse-First Architecture: Added deployment environment specifications
- Added sections:
  * Environment Configuration (new section specifying Databricks workspace and catalog)
- Removed sections: N/A
- Templates requiring updates:
  ✅ plan-template.md: Constitution Check section references this version
  ✅ spec-template.md: No changes needed (implementation-agnostic)
  ✅ tasks-template.md: No changes needed (follows plan structure)
  ✅ Command files: No changes needed (generic references maintained)
- Follow-up TODOs:
  * TODO(RATIFICATION_DATE): Confirm initial ratification date
-->

# Test Kit Constitution

## Core Principles

### I. Lakehouse-First Architecture

**Principle**: Databricks is the best lakehouse platform for unified data processing, analytics, and AI workloads. All data architecture decisions must prioritize lakehouse patterns over traditional data warehouse or data lake approaches.

**Requirements**:
- MUST use Delta Lake format for all structured data storage
- MUST leverage lakehouse capabilities for unified batch and streaming workloads
- MUST design for schema evolution and time travel capabilities inherent to lakehouse architectures
- MUST prioritize open formats and standards compatible with lakehouse ecosystems
- MUST NOT introduce separate data warehouse or data lake silos without explicit constitutional justification

**Rationale**: Lakehouse architecture combines the benefits of data lakes (flexibility, scalability, cost) with data warehouses (ACID transactions, performance, governance). Databricks provides the most mature lakehouse implementation, enabling unified data engineering, analytics, and machine learning workflows on a single platform. This eliminates data silos, reduces data movement, and simplifies the data stack.

**Applicability**: This principle applies to all features involving data storage, data processing, analytics pipelines, or machine learning workflows.

## Environment Configuration

**Databricks Workspace**:
- Host: `e2-demo-field-eng.cloud.databricks.com`
- Default Catalog: `bryan_li`
- All data assets MUST be created within the `bryan_li` catalog unless explicitly justified
- Cross-catalog references require documentation of access patterns and governance considerations

**Connection Standards**:
- Workspace URL: `https://e2-demo-field-eng.cloud.databricks.com`
- Authentication: Use Databricks personal access tokens or OAuth as per security policy
- API endpoint base: `https://e2-demo-field-eng.cloud.databricks.com/api/2.0`

**Catalog Hierarchy**:
- Catalog: `bryan_li` (three-level namespace: catalog.schema.table)
- Schema naming: Use descriptive, purpose-driven schema names (e.g., `analytics`, `ml_features`, `raw_data`)
- Table naming: Follow snake_case convention with domain prefixes where applicable

## Technical Standards

**Data Format Standards**:
- Primary format: Delta Lake with ACID guarantees
- Metadata: Unity Catalog for unified governance
- Query interface: SQL-first with DataFrame API support
- Streaming: Delta Live Tables for incremental processing

**Integration Requirements**:
- APIs MUST expose lakehouse-native interfaces (Delta Sharing, REST)
- External tools MUST integrate via open protocols (ODBC/JDBC, Arrow)
- Data ingestion MUST support both batch and streaming modes
- All transformations MUST be idempotent and reproducible

## Development Workflow

**Design Phase**:
1. Data modeling MUST consider Delta Lake schema evolution
2. Architecture reviews MUST validate lakehouse pattern compliance
3. Performance requirements MUST leverage lakehouse optimization features (Z-ordering, liquid clustering)
4. All designs MUST specify target schemas within the `bryan_li` catalog

**Implementation Phase**:
1. Code MUST use Databricks SDK or compatible open-source libraries
2. Tests MUST validate Delta Lake ACID properties where applicable
3. Documentation MUST reference lakehouse terminology and patterns
4. Connection strings MUST reference `e2-demo-field-eng.cloud.databricks.com`

**Review Phase**:
1. PRs MUST demonstrate lakehouse-first approach or justify exceptions
2. Performance benchmarks MUST compare against lakehouse baselines
3. Security reviews MUST verify Unity Catalog integration
4. Deployment artifacts MUST specify catalog and workspace configuration

## Governance

**Constitutional Authority**: This constitution supersedes all other technical practices and guidelines. Any conflict between this document and other documentation must be resolved in favor of the constitution.

**Amendment Process**:
- Amendments require documented justification and stakeholder approval
- Breaking changes to core principles require MAJOR version increment
- New principles or expanded guidance require MINOR version increment
- Clarifications and refinements require PATCH version increment

**Compliance Review**:
- All feature specifications MUST undergo constitutional compliance check
- Implementation plans MUST document any constitutional deviations with explicit justification
- Complexity that violates principles MUST be challenged and simplified unless justified
- Regular audits MUST verify adherence to lakehouse-first architecture
- All deployments MUST validate correct catalog and workspace configuration

**Runtime Development Guidance**: Teams should consult agent-specific guidance files (e.g., `CLAUDE.md`, `.github/copilot-instructions.md`) for tool-specific development practices that implement these constitutional principles.

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2025-10-01
