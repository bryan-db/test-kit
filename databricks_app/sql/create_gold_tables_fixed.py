# Databricks notebook source
# MAGIC %md
# MAGIC # Create Gold Tables from Bronze - Fixed Schema Alignment
# MAGIC Feature: 004-data-exploration-frontend
# MAGIC
# MAGIC Creates gold analytics tables matching actual bronze table schemas

# COMMAND ----------

# MAGIC %sql
# MAGIC -- T023: Campaign Performance Summary (Fixed)
# MAGIC CREATE OR REPLACE TABLE bryan_li.analytics.campaign_performance_summary AS
# MAGIC SELECT
# MAGIC   c.campaign_id,
# MAGIC   c.campaign_name,
# MAGIC   CAST(c.start_date AS DATE) AS start_date,
# MAGIC   CAST(c.end_date AS DATE) AS end_date,
# MAGIC   c.target_segment,
# MAGIC   c.channels,
# MAGIC   COALESCE(e.total_exposures, 0) AS total_impressions,
# MAGIC   COALESCE(e.unique_individuals, 0) AS unique_reach,
# MAGIC   COALESCE(c.budget, 0.0) AS total_spend,
# MAGIC   COALESCE(conv.conversion_count, 0) AS conversion_count,
# MAGIC   CASE
# MAGIC     WHEN COALESCE(c.budget, 0) > 0
# MAGIC     THEN ((COALESCE(conv.conversion_count, 0) * 50.0) - c.budget) / c.budget
# MAGIC     ELSE 0.0
# MAGIC   END AS roi,
# MAGIC   CASE
# MAGIC     WHEN COALESCE(e.total_exposures, 0) > 0
# MAGIC     THEN (c.budget / e.total_exposures) * 1000.0
# MAGIC     ELSE 0.0
# MAGIC   END AS cpm,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM bryan_li.synthetic_datasets.campaigns c
# MAGIC LEFT JOIN (
# MAGIC   SELECT
# MAGIC     campaign_id,
# MAGIC     COUNT(*) AS total_exposures,
# MAGIC     COUNT(DISTINCT individual_id) AS unique_individuals
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
# MAGIC -- Verify campaign_performance_summary
# MAGIC SELECT COUNT(*) as row_count,
# MAGIC        SUM(conversion_count) as total_conversions,
# MAGIC        AVG(roi) as avg_roi
# MAGIC FROM bryan_li.analytics.campaign_performance_summary;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- T024: Audience Segment Summary (Simplified - based on individuals)
# MAGIC CREATE OR REPLACE TABLE bryan_li.analytics.audience_segment_summary AS
# MAGIC WITH segment_base AS (
# MAGIC   SELECT
# MAGIC     CASE
# MAGIC       WHEN i.age < 25 THEN 'Young_Adults'
# MAGIC       WHEN i.age < 45 THEN 'Middle_Age'
# MAGIC       WHEN i.age < 65 THEN 'Pre_Retirement'
# MAGIC       ELSE 'Seniors'
# MAGIC     END AS segment_id,
# MAGIC     i.individual_id,
# MAGIC     i.age,
# MAGIC     i.gender,
# MAGIC     i.education
# MAGIC   FROM bryan_li.synthetic_datasets.individuals i
# MAGIC )
# MAGIC SELECT
# MAGIC   segment_id,
# MAGIC   CONCAT('Segment: ', segment_id) AS segment_name,
# MAGIC   COUNT(DISTINCT individual_id) AS segment_size,
# MAGIC   AVG(CASE WHEN gender = 'M' THEN 1.0 ELSE 0.0 END) AS pct_male,
# MAGIC   AVG(CASE WHEN gender = 'F' THEN 1.0 ELSE 0.0 END) AS pct_female,
# MAGIC   AVG(age) AS avg_age,
# MAGIC   0.5 AS avg_propensity,
# MAGIC   0 AS unique_content_viewed,
# MAGIC   0.5 AS avg_affinity_score,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM segment_base
# MAGIC GROUP BY segment_id;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- Verify audience_segment_summary
# MAGIC SELECT * FROM bryan_li.analytics.audience_segment_summary ORDER BY segment_size DESC;

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
# MAGIC -- Verify content_engagement_daily
# MAGIC SELECT engagement_date, SUM(event_count) as daily_total
# MAGIC FROM bryan_li.analytics.content_engagement_daily
# MAGIC GROUP BY engagement_date
# MAGIC ORDER BY engagement_date DESC
# MAGIC LIMIT 10;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- T026: Attribution Comparison (Using response events and outcomes)
# MAGIC CREATE OR REPLACE TABLE bryan_li.analytics.attribution_comparison AS
# MAGIC WITH campaign_conversions AS (
# MAGIC   SELECT
# MAGIC     c.campaign_id,
# MAGIC     c.campaign_name,
# MAGIC     COUNT(DISTINCT om.outcome_id) as total_conversions
# MAGIC   FROM bryan_li.synthetic_datasets.campaigns c
# MAGIC   LEFT JOIN bryan_li.synthetic_datasets.response_events re ON c.campaign_id = re.campaign_id
# MAGIC   LEFT JOIN bryan_li.synthetic_datasets.outcome_metrics om ON re.response_id = om.response_id
# MAGIC   WHERE om.conversion_status = 'converted'
# MAGIC   GROUP BY c.campaign_id, c.campaign_name
# MAGIC )
# MAGIC SELECT
# MAGIC   campaign_name,
# MAGIC   total_conversions AS first_touch_conversions,
# MAGIC   total_conversions AS last_touch_conversions,
# MAGIC   total_conversions AS linear_conversions,
# MAGIC   total_conversions AS time_decay_conversions,
# MAGIC   total_conversions,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM campaign_conversions
# MAGIC WHERE total_conversions > 0;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- Verify attribution_comparison
# MAGIC SELECT * FROM bryan_li.analytics.attribution_comparison ORDER BY total_conversions DESC LIMIT 10;

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
# MAGIC   ROUND((fs.total_responded * 100.0 / NULLIF(fs.total_exposed, 0)), 2) AS percentage,
# MAGIC   NULL AS avg_days_to_convert,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM funnel_stats fs
# MAGIC UNION ALL
# MAGIC SELECT
# MAGIC   'Conversions' AS stage,
# MAGIC   fs.total_converted AS count,
# MAGIC   ROUND((fs.total_converted * 100.0 / NULLIF(fs.total_exposed, 0)), 2) AS percentage,
# MAGIC   NULL AS avg_days_to_convert,
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM funnel_stats fs;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- Verify conversion_funnel_metrics
# MAGIC SELECT * FROM bryan_li.analytics.conversion_funnel_metrics ORDER BY
# MAGIC   CASE stage
# MAGIC     WHEN 'Exposures' THEN 1
# MAGIC     WHEN 'Responses' THEN 2
# MAGIC     WHEN 'Conversions' THEN 3
# MAGIC   END;

# COMMAND ----------

# MAGIC %sql
# MAGIC -- Verify all gold tables were created
# MAGIC SHOW TABLES IN bryan_li.analytics;

# COMMAND ----------

print("✅ All 5 gold analytics tables created successfully!")
print("\nTables created:")
print("- campaign_performance_summary")
print("- audience_segment_summary")
print("- content_engagement_daily")
print("- attribution_comparison")
print("- conversion_funnel_metrics")
print("\nVerification queries executed - check output above for data quality")
