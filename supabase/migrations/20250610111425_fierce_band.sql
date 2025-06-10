/*
  # Fix ambiguous column reference in get_election_results function

  1. Function Updates
    - Drop and recreate the `get_election_results` function
    - Fix ambiguous column reference for `vote_count`
    - Ensure all column references are properly qualified with table aliases

  2. Changes Made
    - Explicitly qualify all column references with their respective table/alias names
    - Maintain the same function signature and return type
    - Ensure proper aggregation and grouping for vote counting
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_election_results(uuid);

-- Create the corrected function
CREATE OR REPLACE FUNCTION get_election_results(election_uuid uuid)
RETURNS TABLE (
  candidate_id uuid,
  candidate_name text,
  department text,
  course text,
  year_of_study integer,
  manifesto text,
  image_url text,
  video_url text,
  vote_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as candidate_id,
    c.full_name as candidate_name,
    c.department,
    c.course,
    c.year_of_study,
    c.manifesto,
    c.image_url,
    c.video_url,
    COALESCE(v.vote_count, 0) as vote_count
  FROM candidates c
  LEFT JOIN (
    SELECT 
      votes.candidate_id,
      COUNT(*) as vote_count
    FROM votes
    WHERE votes.election_id = election_uuid
    GROUP BY votes.candidate_id
  ) v ON c.id = v.candidate_id
  WHERE c.election_id = election_uuid
  ORDER BY COALESCE(v.vote_count, 0) DESC, c.full_name ASC;
END;
$$;