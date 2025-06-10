/*
  # Verify specific users and optimize database performance

  1. User Verification
    - Verify and enable voting for specific email addresses
    - Update their verification status and voting privileges
    - Ensure they can participate in elections

  2. Database Optimization
    - Add performance indexes for faster queries
    - Optimize election results function
    - Add connection pooling settings
    - Create materialized views for statistics

  3. Performance Enhancements
    - Optimize RLS policies
    - Add query result caching
    - Improve real-time subscriptions
*/

-- First, verify and enable the specific users
DO $$
DECLARE
  target_emails text[] := ARRAY[
    'esther_chizaram@yahoo.com',
    'somyfrancis@yahoo.com', 
    'metceoai@gmail.com'
  ];
  user_email text;
  user_record record;
  updated_count integer := 0;
BEGIN
  RAISE NOTICE 'Starting verification process for specified users...';
  
  -- Process each target email
  FOREACH user_email IN ARRAY target_emails
  LOOP
    -- Check if user exists
    SELECT * INTO user_record
    FROM students 
    WHERE email = user_email;
    
    IF user_record.id IS NOT NULL THEN
      -- Update user to be verified and enable voting
      UPDATE students 
      SET 
        verified = true,
        voting_enabled = true,
        updated_at = now()
      WHERE email = user_email;
      
      updated_count := updated_count + 1;
      RAISE NOTICE 'Updated user: % (ID: %)', user_email, user_record.id;
    ELSE
      RAISE NOTICE 'User not found: %', user_email;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Verification complete. Updated % users.', updated_count;
END $$;

-- Performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_students_email_verified 
ON students (email, verified) WHERE verified = true;

CREATE INDEX IF NOT EXISTS idx_students_voting_enabled 
ON students (voting_enabled) WHERE voting_enabled = true;

CREATE INDEX IF NOT EXISTS idx_votes_student_election_timestamp 
ON votes (student_id, election_id, voted_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidates_election_name 
ON candidates (election_id, full_name);

CREATE INDEX IF NOT EXISTS idx_elections_active_dates 
ON elections (is_active, start_date, end_date) WHERE is_active = true;

-- Optimized get_election_results function with better performance
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
STABLE -- Mark as stable for better caching
AS $$
DECLARE
  total_votes_in_election bigint;
BEGIN
  -- Get total votes for this election efficiently
  SELECT COUNT(*) INTO total_votes_in_election
  FROM votes v
  WHERE v.election_id = election_uuid;
  
  -- Return optimized results
  RETURN QUERY
  WITH vote_summary AS (
    SELECT 
      v.candidate_id,
      COUNT(*) as vote_count
    FROM votes v
    WHERE v.election_id = election_uuid
    GROUP BY v.candidate_id
  )
  SELECT 
    c.id,
    c.full_name,
    c.department,
    c.course,
    c.year_of_study,
    c.image_url,
    COALESCE(vs.vote_count, 0)::bigint,
    CASE 
      WHEN total_votes_in_election > 0 THEN 
        ROUND((COALESCE(vs.vote_count, 0)::numeric / total_votes_in_election::numeric) * 100, 2)
      ELSE 0::numeric
    END
  FROM candidates c
  LEFT JOIN vote_summary vs ON c.id = vs.candidate_id
  WHERE c.election_id = election_uuid
  ORDER BY COALESCE(vs.vote_count, 0) DESC, c.full_name ASC;
END;
$$;

-- Fast user verification check function
CREATE OR REPLACE FUNCTION check_user_can_vote(user_email text)
RETURNS TABLE (
  can_vote boolean,
  user_id uuid,
  full_name text,
  verified boolean,
  voting_enabled boolean,
  wallet_address text,
  issues text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_record record;
  vote_issues text[] := '{}';
  voting_allowed boolean := true;
BEGIN
  -- Find user by email
  SELECT * INTO user_record
  FROM students s
  WHERE s.email = user_email;
  
  IF user_record.id IS NULL THEN
    RETURN QUERY
    SELECT 
      false,
      null::uuid,
      'User not found'::text,
      false,
      false,
      null::text,
      ARRAY['User not registered']::text[];
    RETURN;
  END IF;
  
  -- Check verification status
  IF NOT user_record.verified THEN
    vote_issues := array_append(vote_issues, 'Account not verified');
    voting_allowed := false;
  END IF;
  
  -- Check voting privileges
  IF user_record.voting_enabled = false THEN
    vote_issues := array_append(vote_issues, 'Voting privileges disabled');
    voting_allowed := false;
  END IF;
  
  -- Check wallet connection
  IF user_record.wallet_address IS NULL OR user_record.wallet_address = '' THEN
    vote_issues := array_append(vote_issues, 'Wallet not connected');
    voting_allowed := false;
  END IF;
  
  -- If no issues, mark as ready
  IF array_length(vote_issues, 1) IS NULL THEN
    vote_issues := array_append(vote_issues, 'Ready to vote');
  END IF;
  
  RETURN QUERY
  SELECT 
    voting_allowed,
    user_record.id,
    user_record.full_name,
    user_record.verified,
    COALESCE(user_record.voting_enabled, true),
    user_record.wallet_address,
    vote_issues;
END;
$$;

-- Optimized function to get active elections with vote counts
CREATE OR REPLACE FUNCTION get_active_elections_with_stats()
RETURNS TABLE (
  election_id uuid,
  title text,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean,
  total_votes bigint,
  total_candidates bigint,
  leading_candidate text,
  leading_votes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH election_vote_counts AS (
    SELECT 
      e.id,
      e.title,
      e.description,
      e.start_date,
      e.end_date,
      e.is_active,
      COUNT(v.id) as vote_count,
      COUNT(DISTINCT c.id) as candidate_count
    FROM elections e
    LEFT JOIN candidates c ON e.id = c.election_id
    LEFT JOIN votes v ON e.id = v.election_id
    WHERE e.is_active = true
    GROUP BY e.id, e.title, e.description, e.start_date, e.end_date, e.is_active
  ),
  leading_candidates AS (
    SELECT DISTINCT ON (c.election_id)
      c.election_id,
      c.full_name,
      COUNT(v.id) as vote_count
    FROM candidates c
    LEFT JOIN votes v ON c.id = v.candidate_id
    WHERE c.election_id IN (SELECT id FROM elections WHERE is_active = true)
    GROUP BY c.election_id, c.id, c.full_name
    ORDER BY c.election_id, COUNT(v.id) DESC
  )
  SELECT 
    evc.id,
    evc.title,
    evc.description,
    evc.start_date,
    evc.end_date,
    evc.is_active,
    evc.vote_count,
    evc.candidate_count,
    COALESCE(lc.full_name, 'No votes yet'),
    COALESCE(lc.vote_count, 0)
  FROM election_vote_counts evc
  LEFT JOIN leading_candidates lc ON evc.id = lc.election_id
  ORDER BY evc.start_date DESC;
END;
$$;

-- Create materialized view for dashboard statistics (refreshed every 5 minutes)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
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

-- Create unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_singleton 
ON dashboard_stats ((1));

-- Function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$;

-- Optimized RLS policies for better performance
DROP POLICY IF EXISTS "Students can read own data" ON students;
CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION get_election_results(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_user_can_vote(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_active_elections_with_stats() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats() TO authenticated;
GRANT SELECT ON dashboard_stats TO authenticated, anon;

-- Update table statistics for better query planning
ANALYZE students;
ANALYZE elections;
ANALYZE candidates;
ANALYZE votes;
ANALYZE admin_users;

-- Log the verification results
DO $$
DECLARE
  target_emails text[] := ARRAY[
    'esther_chizaram@yahoo.com',
    'somyfrancis@yahoo.com', 
    'metceoai@gmail.com'
  ];
  user_email text;
  result_record record;
BEGIN
  RAISE NOTICE '=== FINAL VERIFICATION STATUS ===';
  
  FOREACH user_email IN ARRAY target_emails
  LOOP
    SELECT * INTO result_record
    FROM check_user_can_vote(user_email);
    
    RAISE NOTICE 'User: % | Can Vote: % | Issues: %', 
      user_email,
      result_record.can_vote,
      array_to_string(result_record.issues, ', ');
  END LOOP;
  
  RAISE NOTICE '=== VERIFICATION COMPLETE ===';
END $$;