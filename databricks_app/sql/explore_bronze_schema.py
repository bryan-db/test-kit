# Databricks notebook source
# MAGIC %md
# MAGIC # Explore Bronze Schema - synthetic_datasets

# COMMAND ----------

# MAGIC %sql
# MAGIC DESCRIBE bryan_li.synthetic_datasets.campaigns;

# COMMAND ----------

# MAGIC %sql
# MAGIC DESCRIBE bryan_li.synthetic_datasets.campaign_exposures;

# COMMAND ----------

# MAGIC %sql
# MAGIC DESCRIBE bryan_li.synthetic_datasets.outcome_metrics;

# COMMAND ----------

# MAGIC %sql
# MAGIC DESCRIBE bryan_li.synthetic_datasets.response_events;

# COMMAND ----------

# MAGIC %sql
# MAGIC DESCRIBE bryan_li.synthetic_datasets.audience_attributes;

# COMMAND ----------

# MAGIC %sql
# MAGIC DESCRIBE bryan_li.synthetic_datasets.content_engagements;

# COMMAND ----------

# MAGIC %sql
# MAGIC DESCRIBE bryan_li.synthetic_datasets.individuals;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- Sample data from each table
# MAGIC SELECT 'campaigns' as table_name, COUNT(*) as row_count FROM bryan_li.synthetic_datasets.campaigns
# MAGIC UNION ALL
# MAGIC SELECT 'campaign_exposures', COUNT(*) FROM bryan_li.synthetic_datasets.campaign_exposures
# MAGIC UNION ALL
# MAGIC SELECT 'outcome_metrics', COUNT(*) FROM bryan_li.synthetic_datasets.outcome_metrics
# MAGIC UNION ALL
# MAGIC SELECT 'response_events', COUNT(*) FROM bryan_li.synthetic_datasets.response_events
# MAGIC UNION ALL
# MAGIC SELECT 'audience_attributes', COUNT(*) FROM bryan_li.synthetic_datasets.audience_attributes
# MAGIC UNION ALL
# MAGIC SELECT 'content_engagements', COUNT(*) FROM bryan_li.synthetic_datasets.content_engagements
# MAGIC UNION ALL
# MAGIC SELECT 'individuals', COUNT(*) FROM bryan_li.synthetic_datasets.individuals;
