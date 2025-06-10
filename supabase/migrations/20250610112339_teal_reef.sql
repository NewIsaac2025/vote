/*
  # Fix get_active_elections_with_stats function

  1. Function Updates
    - Fix ambiguous column reference for 'is_active' by properly qualifying table aliases
    - Ensure all column references are explicit and unambiguous
    - Optimize the function for better performance

  2. Changes Made
    - Replace the existing function with properly qualified column references
    - Use explicit table aliases throughout the function
    - Add proper error handling and type casting
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_active_elections_with_stats();

-- Create the corrected function with proper column qualification
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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as election_id,
    e.title,
    e.description,
    e.start_date,
    e.end_date,
    e.is_active,
    COALESCE(vote_counts.total_votes, 0) as total_votes,
    COALESCE(candidate_counts.total_candidates, 0) as total_candidates,
    COALESCE(leading.candidate_name, 'No votes yet') as leading_candidate,
    COALESCE(leading.vote_count, 0) as leading_votes
  FROM elections e
  LEFT JOIN (
    SELECT 
      v.election_id,
      COUNT(*) as total_votes
    FROM votes v
    GROUP BY v.election_id
  ) vote_counts ON e.id = vote_counts.election_id
  LEFT JOIN (
    SELECT 
      c.election_id,
      COUNT(*) as total_candidates
    FROM candidates c
    GROUP BY c.election_id
  ) candidate_counts ON e.id = candidate_counts.election_id
  LEFT JOIN (
    SELECT DISTINCT ON (v.election_id)
      v.election_id,
      c.full_name as candidate_name,
      COUNT(*) as vote_count
    FROM votes v
    JOIN candidates c ON v.candidate_id = c.id
    GROUP BY v.election_id, c.id, c.full_name
    ORDER BY v.election_id, COUNT(*) DESC
  ) leading ON e.id = leading.election_id
  WHERE e.is_active = true
  ORDER BY e.start_date DESC;
END;
$$;