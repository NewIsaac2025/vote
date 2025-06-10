/*
  # Fix Database Function and Materialized View Errors

  1. Database Function Fixes
    - Fix ambiguous column reference in `get_active_elections_with_stats` function
    - Properly qualify the `is_active` column with table alias

  2. Materialized View Fixes
    - Add unique index to `dashboard_stats` materialized view to enable concurrent refresh
    - Use `id` column as the unique identifier

  3. Function Updates
    - Recreate the `get_active_elections_with_stats` function with proper column qualification
    - Ensure all column references are unambiguous
*/

-- Drop the existing function to recreate it with fixes
DROP FUNCTION IF EXISTS get_active_elections_with_stats();

-- Recreate the function with proper column qualification
CREATE OR REPLACE FUNCTION get_active_elections_with_stats()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  candidate_count bigint,
  total_votes bigint,
  unique_voters bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.start_date,
    e.end_date,
    e.is_active,
    e.created_by,
    e.created_at,
    e.updated_at,
    COALESCE(c.candidate_count, 0) as candidate_count,
    COALESCE(v.total_votes, 0) as total_votes,
    COALESCE(v.unique_voters, 0) as unique_voters
  FROM elections e
  LEFT JOIN (
    SELECT 
      election_id,
      COUNT(*) as candidate_count
    FROM candidates
    GROUP BY election_id
  ) c ON e.id = c.election_id
  LEFT JOIN (
    SELECT 
      election_id,
      COUNT(*) as total_votes,
      COUNT(DISTINCT student_id) as unique_voters
    FROM votes
    GROUP BY election_id
  ) v ON e.id = v.election_id
  WHERE e.is_active = true
  AND e.start_date <= NOW()
  AND e.end_date >= NOW()
  ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique index to dashboard_stats materialized view to enable concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS dashboard_stats_unique_id 
ON dashboard_stats (id);

-- Refresh the materialized view to ensure it's up to date
REFRESH MATERIALIZED VIEW dashboard_stats;

-- Update the refresh_dashboard_stats function to use concurrent refresh now that we have a unique index
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;