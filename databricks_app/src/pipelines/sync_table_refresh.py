# Databricks notebook source
# MAGIC %md
# MAGIC # Sync Table Refresh Pipeline - Publish Gold Tables to Lakebase
# MAGIC **Feature**: 004-data-exploration-frontend
# MAGIC **Task**: T028
# MAGIC
# MAGIC Creates and refreshes Lakebase sync tables for low-latency dashboard queries.
# MAGIC Sync tables provide sub-second query performance vs 3-5s for gold Delta tables.

# COMMAND ----------

from databricks.sdk import WorkspaceClient
from databricks.sdk.service.synctables import (
    SyncedTableSpec,
    SyncedTableSchedulingPolicy,
    NewPipelineSpec
)
import logging

logger = logging.getLogger(__name__)

# COMMAND ----------


class SyncTableRefreshPipeline:
    """Create and manage Lakebase sync tables for gold layer"""

    def __init__(self, catalog: str = "bryan_li", schema: str = "analytics"):
        self.workspace_client = WorkspaceClient()
        self.catalog = catalog
        self.schema = schema
        self.gold_tables = [
            "campaign_performance_summary",
            "audience_segment_summary",
            "content_engagement_daily",
            "attribution_comparison",
            "conversion_funnel_metrics"
        ]
        self.primary_keys = {
            "campaign_performance_summary": ["campaign_id"],
            "audience_segment_summary": ["segment_id"],
            "content_engagement_daily": ["engagement_date", "content_category", "event_type"],
            "attribution_comparison": ["campaign_id"],
            "conversion_funnel_metrics": ["campaign_id"]
        }

    def create_all_sync_tables(self):
        """Create sync tables for all gold tables"""
        logger.info("Creating Lakebase sync tables for all gold tables")

        for table_name in self.gold_tables:
            try:
                self.create_sync_table(table_name)
            except Exception as e:
                logger.error(f"Failed to create sync table for {table_name}: {e}")
                # Continue with other tables
                continue

        logger.info("Sync table creation complete")

    def create_sync_table(self, table_name: str):
        """
        Create a Lakebase sync table for a specific gold table

        Args:
            table_name: Name of the gold table (without catalog/schema)
        """
        source_table = f"{self.catalog}.{self.schema}.{table_name}"
        sync_table_name = f"{table_name}_sync"
        sync_table_full_name = f"{self.catalog}.{self.schema}.{sync_table_name}"

        logger.info(f"Creating sync table: {sync_table_full_name}")

        # Check if sync table already exists
        try:
            existing = self.workspace_client.synctables.get_synced_database_table(
                full_name=sync_table_full_name
            )
            logger.info(f"Sync table {sync_table_full_name} already exists, skipping creation")
            return
        except Exception:
            # Table doesn't exist, proceed with creation
            pass

        # Create sync table with TRIGGERED scheduling (hourly refresh)
        spec = SyncedTableSpec(
            source_table_full_name=source_table,
            primary_key_columns=self.primary_keys[table_name],
            scheduling_policy=SyncedTableSchedulingPolicy.TRIGGERED,
            new_pipeline_spec=NewPipelineSpec(
                storage_catalog=self.catalog,
                storage_schema=self.schema
            )
        )

        try:
            synced_table = self.workspace_client.synctables.create_synced_database_table(
                name=sync_table_full_name,
                spec=spec
            )
            logger.info(f"Sync table {sync_table_full_name} created successfully")
        except Exception as e:
            logger.error(f"Failed to create sync table {sync_table_full_name}: {e}")
            raise

    def refresh_all_sync_tables(self):
        """Trigger manual refresh for all sync tables (for hourly job)"""
        logger.info("Refreshing all Lakebase sync tables")

        for table_name in self.gold_tables:
            try:
                self.refresh_sync_table(table_name)
            except Exception as e:
                logger.error(f"Failed to refresh sync table for {table_name}: {e}")
                continue

        logger.info("Sync table refresh complete")

    def refresh_sync_table(self, table_name: str):
        """
        Trigger sync refresh for a specific table

        Args:
            table_name: Name of the gold table (without _sync suffix)
        """
        sync_table_full_name = f"{self.catalog}.{self.schema}.{table_name}_sync"

        logger.info(f"Triggering sync refresh for {sync_table_full_name}")

        try:
            self.workspace_client.synctables.sync_synced_database_table(
                full_name=sync_table_full_name
            )
            logger.info(f"Sync refresh triggered for {sync_table_full_name}")
        except Exception as e:
            logger.error(f"Failed to trigger sync for {sync_table_full_name}: {e}")
            raise

    def get_sync_status(self, table_name: str) -> dict:
        """
        Get sync table status

        Args:
            table_name: Name of the gold table (without _sync suffix)

        Returns:
            Dictionary with pipeline_state and last_sync_time
        """
        sync_table_full_name = f"{self.catalog}.{self.schema}.{table_name}_sync"

        try:
            table_info = self.workspace_client.synctables.get_synced_database_table(
                full_name=sync_table_full_name
            )
            return {
                "table_name": sync_table_full_name,
                "pipeline_state": table_info.pipeline_state,
                "last_sync_time": table_info.last_sync_time,
                "status": "AVAILABLE" if table_info.pipeline_state in ["RUNNING", "IDLE"] else "UNAVAILABLE"
            }
        except Exception as e:
            logger.warning(f"Could not get status for {sync_table_full_name}: {e}")
            return {
                "table_name": sync_table_full_name,
                "status": "UNAVAILABLE",
                "error": str(e)
            }

    def check_all_sync_status(self) -> list:
        """Check status of all sync tables"""
        status_list = []

        for table_name in self.gold_tables:
            status = self.get_sync_status(table_name)
            status_list.append(status)
            logger.info(f"Status for {table_name}_sync: {status['status']}")

        return status_list


# COMMAND ----------

# MAGIC %md
# MAGIC ## Execute Pipeline

# COMMAND ----------

# Get parameters
catalog = dbutils.widgets.get("catalog") if dbutils.widgets else "bryan_li"
action = dbutils.widgets.get("action") if dbutils.widgets else "refresh"

# Initialize pipeline
pipeline = SyncTableRefreshPipeline(catalog=catalog)

# Execute based on action
if action == "create":
    # First-time setup: Create all sync tables
    pipeline.create_all_sync_tables()
elif action == "refresh":
    # Hourly job: Refresh all sync tables
    pipeline.refresh_all_sync_tables()
elif action == "status":
    # Check status of all sync tables
    status_list = pipeline.check_all_sync_status()
    for status in status_list:
        print(f"{status['table_name']}: {status['status']}")
else:
    logger.error(f"Unknown action: {action}. Use 'create', 'refresh', or 'status'")
