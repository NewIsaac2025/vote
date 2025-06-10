/*
  # Fix get_election_results function

  1. New Functions
    - `get_election_results` - Returns election results with candidate details and vote counts
    - Fixes ambiguous column reference error by properly qualifying column names

  2. Security
    - Function is accessible to authenticated and anonymous users for public election results
*/

-- Drop the function if it exists to recreate it properly
DROP FUNCTION IF EXISTS get_election_results(uuid);

-- Create the get_election_results function with proper column qualification
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
BEGIN
  RETURN QUERY
  WITH vote_counts AS (
    SELECT 
      c.id as candidate_id,
      c.full_name as candidate_name,
      c.department,
      c.course,
      c.year_of_study,
      c.image_url,
      COALESCE(COUNT(v.id), 0) as vote_count
    FROM candidates c
    LEFT JOIN votes v ON v.candidate_id = c.id AND v.election_id = election_uuid
    WHERE c.election_id = election_uuid
    GROUP BY c.id, c.full_name, c.department, c.course, c.year_of_study, c.image_url
  ),
  total_votes AS (
    SELECT SUM(vote_count) as total
    FROM vote_counts
  )
  SELECT 
    vc.candidate_id,
    vc.candidate_name,
    vc.department,
    vc.course,
    vc.year_of_study,
    vc.image_url,
    vc.vote_count,
    CASE 
      WHEN tv.total > 0 THEN ROUND((vc.vote_count::numeric / tv.total::numeric) * 100, 2)
      ELSE 0
    END as vote_percentage
  FROM vote_counts vc
  CROSS JOIN total_votes tv
  ORDER BY vc.vote_count DESC, vc.candidate_name ASC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_election_results(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_election_results(uuid) TO anon;