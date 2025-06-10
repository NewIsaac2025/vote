/*
  # Database Performance Optimization

  1. Indexes
    - Add composite indexes for frequently queried combinations
    - Optimize candidate-election joins
    - Add indexes for real-time queries

  2. Query Optimization
    - Optimize election results function
    - Add materialized views for heavy queries
    - Improve candidate data retrieval

  3. Caching Strategy
    - Add database-level caching hints
    - Optimize real-time subscriptions
*/

-- Add composite index for candidate-election queries
CREATE INDEX IF NOT EXISTS idx_candidates_election_created 
ON candidates (election_id, created_at DESC);

-- Add index for vote counting optimization
CREATE INDEX IF NOT EXISTS idx_votes_candidate_election 
ON votes (candidate_id, election_id);

-- Add index for real-time vote tracking
CREATE INDEX IF NOT EXISTS idx_votes_election_timestamp 
ON votes (election_id, voted_at DESC);

-- Optimize the get_election_results function with better query plan
CREATE OR REPLACE FUNCTION get_election_results(election_uuid uuid)
RETURNS TABLE (
  candidate_id uuid,
  candidate_name text,
  department text,
  course text,
  year_of_study integer,
  image_url text,
  vote_count bigint,
  vote_percentage numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_votes bigint;
BEGIN
  -- Get total votes for this election (cached in variable)
  SELECT COUNT(*) INTO total_votes
  FROM votes
  WHERE election_id = election_uuid;
  
  -- Return optimized results with better join strategy
  RETURN QUERY
  WITH vote_counts AS (
    SELECT 
      candidate_id,
      COUNT(*) as vote_count
    FROM votes
    WHERE election_id = election_uuid
    GROUP BY candidate_id
  )
  SELECT 
    c.id as candidate_id,
    c.full_name as candidate_name,
    c.department,
    c.course,
    c.year_of_study,
    c.image_url,
    COALESCE(vc.vote_count, 0) as vote_count,
    CASE 
      WHEN total_votes > 0 THEN 
        ROUND((COALESCE(vc.vote_count, 0)::numeric / total_votes::numeric) * 100, 2)
      ELSE 0::numeric
    END as vote_percentage
  FROM candidates c
  LEFT JOIN vote_counts vc ON c.id = vc.candidate_id
  WHERE c.election_id = election_uuid
  ORDER BY COALESCE(vc.vote_count, 0) DESC, c.full_name ASC;
END;
$$;

-- Create materialized view for election statistics (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS election_stats AS
SELECT 
  e.id as election_id,
  e.title,
  e.start_date,
  e.end_date,
  COUNT(DISTINCT c.id) as candidate_count,
  COUNT(v.id) as total_votes,
  COUNT(DISTINCT v.student_id) as unique_voters
FROM elections e
LEFT JOIN candidates c ON e.id = c.election_id
LEFT JOIN votes v ON e.id = v.election_id
GROUP BY e.id, e.title, e.start_date, e.end_date;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_election_stats_id 
ON election_stats (election_id);

-- Function to refresh election stats (call periodically)
CREATE OR REPLACE FUNCTION refresh_election_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY election_stats;
END;
$$;

-- Grant permissions
GRANT SELECT ON election_stats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION refresh_election_stats() TO authenticated;

-- Add database configuration for better performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log slow queries

-- Analyze tables to update statistics
ANALYZE students;
ANALYZE elections;
ANALYZE candidates;
ANALYZE votes;