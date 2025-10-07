-- Setup Configuration Tables for Marketing Analytics Explorer
-- Feature 004: Data Exploration Frontend
-- Task T008: Create user_assignments configuration table

-- Create analytics schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS bryan_li.analytics
COMMENT 'Marketing analytics gold layer tables and configuration';

-- T008: Create user_assignments table
CREATE TABLE IF NOT EXISTS bryan_li.analytics.user_assignments (
    user_id STRING NOT NULL COMMENT 'Unique identifier for the user',
    user_email STRING NOT NULL COMMENT 'User email address for authentication',
    user_role STRING NOT NULL COMMENT 'User role: CMO, Director, Analyst',
    assigned_campaign_ids ARRAY<STRING> COMMENT 'List of campaign IDs this user can access',
    assigned_segment_ids ARRAY<STRING> COMMENT 'List of audience segment IDs this user can analyze',
    created_at TIMESTAMP COMMENT 'Timestamp when user assignment was created',
    updated_at TIMESTAMP COMMENT 'Timestamp when user assignment was last updated'
)
USING DELTA
COMMENT 'User access control and campaign/segment assignments for role-based filtering'
LOCATION '/Volumes/bryan_li/analytics/user_assignments';

-- Insert sample CMO user (full access to all campaigns and segments)
INSERT INTO bryan_li.analytics.user_assignments VALUES (
    'user_001',
    'cmo@example.com',
    'CMO',
    NULL,  -- NULL means access to ALL campaigns
    NULL,  -- NULL means access to ALL segments
    current_timestamp(),
    current_timestamp()
);

-- Insert sample Analyst user (limited access to specific campaigns and segments)
INSERT INTO bryan_li.analytics.user_assignments VALUES (
    'user_002',
    'analyst@example.com',
    'Analyst',
    array('campaign_001', 'campaign_002', 'campaign_005'),  -- Access to 3 specific campaigns
    array('segment_heavy_users', 'segment_news_readers'),   -- Access to 2 specific segments
    current_timestamp(),
    current_timestamp()
);

-- Insert sample Director user (moderate access)
INSERT INTO bryan_li.analytics.user_assignments VALUES (
    'user_003',
    'director@example.com',
    'Director',
    array('campaign_001', 'campaign_002', 'campaign_003', 'campaign_004', 'campaign_005', 'campaign_006'),
    array('segment_heavy_users', 'segment_news_readers', 'segment_sports_fans', 'segment_tech_enthusiasts'),
    current_timestamp(),
    current_timestamp()
);

-- Verify table creation and sample data
SELECT
    user_email,
    user_role,
    CASE
        WHEN assigned_campaign_ids IS NULL THEN 'ALL'
        ELSE CONCAT(SIZE(assigned_campaign_ids), ' campaigns')
    END as campaign_access,
    CASE
        WHEN assigned_segment_ids IS NULL THEN 'ALL'
        ELSE CONCAT(SIZE(assigned_segment_ids), ' segments')
    END as segment_access
FROM bryan_li.analytics.user_assignments
ORDER BY user_role;
