# Databricks notebook source
# MAGIC %md
# MAGIC # Create Gold Tables Directly from Bronze Data
# MAGIC Feature: 004-data-exploration-frontend
# MAGIC
# MAGIC Bypasses the silver layer and creates gold analytics tables directly from bronze synthetic_datasets

# COMMAND ----------

# MAGIC %sql
# MAGIC -- T023: Campaign Performance Summary
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
# MAGIC   COALESCE(r.conversion_count, 0) AS conversion_count,
# MAGIC   CASE
# MAGIC     WHEN COALESCE(e.total_cost, 0) > 0
# MAGIC     THEN ((COALESCE(r.conversion_count, 0) * 50.0) - e.total_cost) / e.total_cost
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
# MAGIC     om.campaign_id,
# MAGIC     COUNT(*) AS conversion_count
# MAGIC   FROM bryan_li.synthetic_datasets.outcome_metrics om
# MAGIC   WHERE om.outcome_type = 'conversion'
# MAGIC   GROUP BY om.campaign_id
# MAGIC ) r ON c.campaign_id = r.campaign_id;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- T024: Audience Segment Summary
# MAGIC CREATE OR REPLACE TABLE bryan_li.analytics.audience_segment_summary AS
# MAGIC SELECT
# MAGIC   aa.individual_id AS segment_id,
# MAGIC   CONCAT('Segment_', aa.individual_id) AS segment_name,
# MAGIC   COUNT(DISTINCT aa.individual_id) AS segment_size,
# MAGIC   AVG(CASE WHEN i.gender = 'M' THEN 1.0 ELSE 0.0 END) AS pct_male,
# MAGIC   AVG(CASE WHEN i.gender = 'F' THEN 1.0 ELSE 0.0 END) AS pct_female,
# MAGIC   AVG(i.age) AS avg_age,
# MAGIC   AVG(aa.propensity_to_convert) AS avg_propensity,
# MAGIC   COUNT(DISTINCT ce.content_id) AS unique_content_viewed,
# MAGIC   AVG(aa.affinity_score) AS avg_affinity_score,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM bryan_li.synthetic_datasets.audience_attributes aa
# MAGIC INNER JOIN bryan_li.synthetic_datasets.individuals i ON aa.individual_id = i.individual_id
# MAGIC LEFT JOIN bryan_li.synthetic_datasets.content_engagements ce ON aa.individual_id = ce.individual_id
# MAGIC GROUP BY aa.individual_id;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- T025: Content Engagement Daily Summary
# MAGIC CREATE OR REPLACE TABLE bryan_li.analytics.content_engagement_daily AS
# MAGIC SELECT
# MAGIC   CAST(engagement_timestamp AS DATE) AS engagement_date,
# MAGIC   content_category,
# MAGIC   event_type,
# MAGIC   COUNT(*) AS event_count,
# MAGIC   COUNT(DISTINCT individual_id) AS unique_users,
# MAGIC   COUNT(DISTINCT content_id) AS unique_content,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM bryan_li.synthetic_datasets.content_engagements
# MAGIC GROUP BY
# MAGIC   CAST(engagement_timestamp AS DATE),
# MAGIC   content_category,
# MAGIC   event_type;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- T026: Attribution Comparison (First-touch vs Last-touch vs Linear)
# MAGIC CREATE OR REPLACE TABLE bryan_li.analytics.attribution_comparison AS
# MAGIC WITH exposures_with_rank AS (
# MAGIC   SELECT
# MAGIC     ce.campaign_id,
# MAGIC     ce.individual_id,
# MAGIC     ce.exposure_timestamp,
# MAGIC     re.response_timestamp,
# MAGIC     ROW_NUMBER() OVER (PARTITION BY ce.campaign_id, ce.individual_id ORDER BY ce.exposure_timestamp ASC) AS first_touch_rank,
# MAGIC     ROW_NUMBER() OVER (PARTITION BY ce.campaign_id, ce.individual_id ORDER BY ce.exposure_timestamp DESC) AS last_touch_rank,
# MAGIC     COUNT(*) OVER (PARTITION BY ce.campaign_id, ce.individual_id) AS total_exposures
# MAGIC   FROM bryan_li.synthetic_datasets.campaign_exposures ce
# MAGIC   LEFT JOIN bryan_li.synthetic_datasets.response_events re
# MAGIC     ON ce.campaign_id = re.campaign_id AND ce.individual_id = re.individual_id
# MAGIC   WHERE re.response_timestamp IS NOT NULL
# MAGIC )
# MAGIC SELECT
# MAGIC   c.campaign_name,
# MAGIC   SUM(CASE WHEN first_touch_rank = 1 THEN 1 ELSE 0 END) AS first_touch_conversions,
# MAGIC   SUM(CASE WHEN last_touch_rank = 1 THEN 1 ELSE 0 END) AS last_touch_conversions,
# MAGIC   SUM(1.0 / total_exposures) AS linear_conversions,
# MAGIC   SUM(POWER(0.5, first_touch_rank - 1)) AS time_decay_conversions,
# MAGIC   COUNT(DISTINCT ewr.individual_id) AS total_conversions,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM exposures_with_rank ewr
# MAGIC INNER JOIN bryan_li.synthetic_datasets.campaigns c ON ewr.campaign_id = c.campaign_id
# MAGIC GROUP BY c.campaign_name;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- T027: Conversion Funnel Metrics
# MAGIC CREATE OR REPLACE TABLE bryan_li.analytics.conversion_funnel_metrics AS
# MAGIC WITH funnel_stats AS (
# MAGIC   SELECT
# MAGIC     COUNT(DISTINCT ce.individual_id) AS total_exposed,
# MAGIC     COUNT(DISTINCT re.individual_id) AS total_responded,
# MAGIC     COUNT(DISTINCT om.individual_id) AS total_converted
# MAGIC   FROM bryan_li.synthetic_datasets.campaign_exposures ce
# MAGIC   LEFT JOIN bryan_li.synthetic_datasets.response_events re ON ce.individual_id = re.individual_id
# MAGIC   LEFT JOIN bryan_li.synthetic_datasets.outcome_metrics om ON ce.individual_id = om.individual_id AND om.outcome_type = 'conversion'
# MAGIC ),
# MAGIC time_to_convert AS (
# MAGIC   SELECT
# MAGIC     DATEDIFF(om.created_at, ce.exposure_timestamp) AS days_to_convert
# MAGIC   FROM bryan_li.synthetic_datasets.campaign_exposures ce
# MAGIC   INNER JOIN bryan_li.synthetic_datasets.outcome_metrics om
# MAGIC     ON ce.individual_id = om.individual_id
# MAGIC     AND om.outcome_type = 'conversion'
# MAGIC     AND om.created_at >= ce.exposure_timestamp
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
# MAGIC   (SELECT AVG(days_to_convert) FROM time_to_convert) AS avg_days_to_convert,
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
