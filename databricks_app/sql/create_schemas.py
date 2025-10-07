# Databricks notebook source
# MAGIC %md
# MAGIC # Create Schemas for Medallion Architecture
# MAGIC Feature: 004-data-exploration-frontend
# MAGIC
# MAGIC Creates:
# MAGIC - `bryan_li.silver` - Cleansed data from bronze
# MAGIC - `bryan_li.analytics` - Gold layer aggregated metrics

# COMMAND ----------

# MAGIC %sql
# MAGIC CREATE SCHEMA IF NOT EXISTS bryan_li.silver
# MAGIC COMMENT 'Silver layer: cleansed and standardized data from bronze layer';

# COMMAND ----------

# MAGIC %sql
# MAGIC CREATE SCHEMA IF NOT EXISTS bryan_li.analytics
# MAGIC COMMENT 'Gold layer: aggregated metrics and analytics tables for dashboards';

# COMMAND ----------

# MAGIC %sql
# MAGIC SHOW SCHEMAS IN bryan_li;

# COMMAND ----------

print("✅ Schemas created successfully!")
print("- bryan_li.silver")
print("- bryan_li.analytics")
