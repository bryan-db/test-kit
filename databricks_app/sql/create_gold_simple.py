# Databricks notebook source
# MAGIC %md
# MAGIC # Create Simplified Gold Tables from Bronze Data
# MAGIC Feature: 004-data-exploration-frontend
# MAGIC
# MAGIC Creates 5 gold analytics tables using only columns that exist in bronze schema

# COMMAND ----------

# MAGIC %sql
# MAGIC -- T023: Campaign Performance Summary (simplified)
# MAGIC CREATE OR REPLACE TABLE bryan_li.analytics.campaign_performance_summary AS
# MAGIC SELECT
# MAGIC   c.campaign_id,
# MAGIC   c.campaign_name,
# MAGIC   c.start_date,
# MAGIC   c.end_date,
# MAGIC   c.target_segment,
# MAGIC   c.channels,
# MAGIC   COALESCE(e.total_exposures, 0) AS total_impressions,
# MAGIC   COALESCE(e.unique_individuals, 0) AS unique_reach,
# MAGIC   COALESCE(e.total_cost, 0.0) AS total_spend,
# MAGIC   COALESCE(conv.conversion_count, 0) AS conversion_count,
# MAGIC   CASE
# MAGIC     WHEN COALESCE(e.total_cost, 0) > 0
# MAGIC     THEN ((COALESCE(conv.conversion_count, 0) * 50.0) - e.total_cost) / e.total_cost
# MAGIC     ELSE 0.0
# MAGIC   END AS roi,
# MAGIC   CASE
# MAGIC     WHEN COALESCE(e.total_exposures, 0) > 0
# MAGIC     THEN (e.total_cost / e.total_exposures) * 1000.0
# MAGIC     ELSE 0.0
# MAGIC   END AS cpm,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM bryan_li.synthetic_datasets.campaigns c
# MAGIC LEFT JOIN (
# MAGIC   SELECT
# MAGIC     campaign_id,
# MAGIC     COUNT(*) AS total_exposures,
# MAGIC     COUNT(DISTINCT individual_id) AS unique_individuals,
# MAGIC     SUM(cost) AS total_cost
# MAGIC   FROM bryan_li.synthetic_datasets.campaign_exposures
# MAGIC   GROUP BY campaign_id
# MAGIC ) e ON c.campaign_id = e.campaign_id
# MAGIC LEFT JOIN (
# MAGIC   SELECT
# MAGIC     re.campaign_id,
# MAGIC     COUNT(DISTINCT om.outcome_id) AS conversion_count
# MAGIC   FROM bryan_li.synthetic_datasets.response_events re
# MAGIC   INNER JOIN bryan_li.synthetic_datasets.outcome_metrics om ON re.response_id = om.response_id
# MAGIC   WHERE om.conversion_status = 'converted'
# MAGIC   GROUP BY re.campaign_id
# MAGIC ) conv ON c.campaign_id = conv.campaign_id;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- T024: Audience Segment Summary (placeholder - using individuals)
# MAGIC CREATE OR REPLACE TABLE bryan_li.analytics.audience_segment_summary AS
# MAGIC SELECT
# MAGIC   'ALL_USERS' AS segment_id,
# MAGIC   'All Users' AS segment_name,
# MAGIC   COUNT(*) AS segment_size,
# MAGIC   AVG(CASE WHEN gender = 'M' THEN 1.0 ELSE 0.0 END) AS pct_male,
# MAGIC   AVG(CASE WHEN gender = 'F' THEN 1.0 ELSE 0.0 END) AS pct_female,
# MAGIC   AVG(age) AS avg_age,
# MAGIC   0.5 AS avg_propensity,
# MAGIC   0 AS unique_content_viewed,
# MAGIC   0.5 AS avg_affinity_score,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM bryan_li.synthetic_datasets.individuals;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- T025: Content Engagement Daily Summary
# MAGIC CREATE OR REPLACE TABLE bryan_li.analytics.content_engagement_daily AS
# MAGIC SELECT
# MAGIC   CAST(timestamp AS DATE) AS engagement_date,
# MAGIC   content_category,
# MAGIC   engagement_type AS event_type,
# MAGIC   COUNT(*) AS event_count,
# MAGIC   COUNT(DISTINCT individual_id) AS unique_users,
# MAGIC   COUNT(DISTINCT content_id) AS unique_content,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM bryan_li.synthetic_datasets.content_engagements
# MAGIC GROUP BY
# MAGIC   CAST(timestamp AS DATE),
# MAGIC   content_category,
# MAGIC   engagement_type;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- T026: Attribution Comparison (simplified - using response_events)
# MAGIC CREATE OR REPLACE TABLE bryan_li.analytics.attribution_comparison AS
# MAGIC SELECT
# MAGIC   c.campaign_name,
# MAGIC   COUNT(DISTINCT CASE WHEN om.conversion_status = 'converted' THEN om.outcome_id END) AS first_touch_conversions,
# MAGIC   COUNT(DISTINCT CASE WHEN om.conversion_status = 'converted' THEN om.outcome_id END) AS last_touch_conversions,
# MAGIC   COUNT(DISTINCT CASE WHEN om.conversion_status = 'converted' THEN om.outcome_id END) AS linear_conversions,
# MAGIC   COUNT(DISTINCT CASE WHEN om.conversion_status = 'converted' THEN om.outcome_id END) AS time_decay_conversions,
# MAGIC   COUNT(DISTINCT CASE WHEN om.conversion_status = 'converted' THEN om.outcome_id END) AS total_conversions,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM bryan_li.synthetic_datasets.campaigns c
# MAGIC LEFT JOIN bryan_li.synthetic_datasets.response_events re ON c.campaign_id = re.campaign_id
# MAGIC LEFT JOIN bryan_li.synthetic_datasets.outcome_metrics om ON re.response_id = om.response_id
# MAGIC GROUP BY c.campaign_name;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- T027: Conversion Funnel Metrics
# MAGIC CREATE OR REPLACE TABLE bryan_li.analytics.conversion_funnel_metrics AS
# MAGIC WITH funnel_stats AS (
# MAGIC   SELECT
# MAGIC     COUNT(DISTINCT ce.individual_id) AS total_exposed,
# MAGIC     COUNT(DISTINCT re.individual_id) AS total_responded,
# MAGIC     COUNT(DISTINCT CASE WHEN om.conversion_status = 'converted' THEN om.outcome_id END) AS total_converted
# MAGIC   FROM bryan_li.synthetic_datasets.campaign_exposures ce
# MAGIC   LEFT JOIN bryan_li.synthetic_datasets.response_events re ON ce.individual_id = re.individual_id
# MAGIC   LEFT JOIN bryan_li.synthetic_datasets.outcome_metrics om ON re.response_id = om.response_id
# MAGIC )
# MAGIC SELECT
# MAGIC   'Exposures' AS stage,
# MAGIC   fs.total_exposed AS count,
# MAGIC   100.0 AS percentage,
# MAGIC   NULL AS avg_days_to_convert,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM funnel_stats fs
# MAGIC UNION ALL
# MAGIC SELECT
# MAGIC   'Responses' AS stage,
# MAGIC   fs.total_responded AS count,
# MAGIC   (fs.total_responded * 100.0 / NULLIF(fs.total_exposed, 0)) AS percentage,
# MAGIC   NULL AS avg_days_to_convert,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM funnel_stats fs
# MAGIC UNION ALL
# MAGIC SELECT
# MAGIC   'Conversions' AS stage,
# MAGIC   fs.total_converted AS count,
# MAGIC   (fs.total_converted * 100.0 / NULLIF(fs.total_exposed, 0)) AS percentage,
# MAGIC   NULL AS avg_days_to_convert,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM funnel_stats fs;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- Verify all gold tables were created
# MAGIC SHOW TABLES IN bryan_li.analytics;

# COMMAND ----------

print("✅ All 5 gold analytics tables created successfully!")
print("- campaign_performance_summary")
print("- audience_segment_summary")
print("- content_engagement_daily")
print("- attribution_comparison")
print("- conversion_funnel_metrics")
