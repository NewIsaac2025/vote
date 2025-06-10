/*
  # Fix dashboard_stats materialized view

  1. Materialized View Updates
    - Add unique index to enable concurrent refreshing
    - Recreate the materialized view with proper structure
    - Add refresh function that works with concurrent updates

  2. Changes Made
    - Drop and recreate dashboard_stats materialized view
    - Add unique index on a synthetic row identifier
    - Update refresh_dashboard_stats function to handle concurrent refreshes
*/

-- Drop existing materialized view and related objects
DROP MATERIALIZED VIEW IF EXISTS dashboard_stats CASCADE;

-- Recreate the materialized view with a unique identifier
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT 
  1 as id, -- Synthetic unique identifier for the single row
  (SELECT COUNT(*) FROM students) as total_students,
  (SELECT COUNT(*) FROM students WHERE verified = true) as verified_students,
  (SELECT COUNT(*) FROM students WHERE voting_enabled = true) as voting_enabled_students,
  (SELECT COUNT(*) FROM students WHERE wallet_address IS NOT NULL) as students_with_wallets,
  (SELECT COUNT(*) FROM elections) as total_elections,
  (SELECT COUNT(*) FROM elections WHERE is_active = true) as active_elections,
  (SELECT COUNT(*) FROM candidates) as total_candidates,
  (SELECT COUNT(*) FROM votes) as total_votes,
  (SELECT COUNT(DISTINCT student_id) FROM votes) as unique_voters,
  now() as last_updated;

-- Create unique index to enable concurrent refresh
CREATE UNIQUE INDEX dashboard_stats_unique_idx ON dashboard_stats (id);

-- Drop and recreate the refresh function
DROP FUNCTION IF EXISTS refresh_dashboard_stats();

CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use concurrent refresh now that we have a unique index
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to non-concurrent refresh if concurrent fails
    REFRESH MATERIALIZED VIEW dashboard_stats;
END;
$$;