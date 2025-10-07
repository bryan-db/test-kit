-- Feature 004: Create schemas for medallion architecture
-- Bronze: synthetic_datasets (already exists from Feature 001)
-- Silver: silver (cleansed data)
-- Gold: analytics (aggregated metrics)

-- Create silver schema for cleansed data
CREATE SCHEMA IF NOT EXISTS bryan_li.silver
COMMENT 'Silver layer: cleansed and standardized data from bronze layer';

-- Create analytics schema for gold tables
CREATE SCHEMA IF NOT EXISTS bryan_li.analytics
COMMENT 'Gold layer: aggregated metrics and analytics tables for dashboards';
