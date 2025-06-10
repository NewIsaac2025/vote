/*
  # Fix ambiguous vote_count column reference in get_election_results function

  1. Drop and recreate the get_election_results function with proper column qualification
  2. Use distinct aliases and fully qualified column names to avoid ambiguity
  3. Ensure the function returns correct vote counts and percentages
*/

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_election_results(uuid);

-- Create the corrected function with proper column qualification
CREATE FUNCTION public.get_election_results(election_uuid uuid)
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
  total_votes_count bigint;
BEGIN
  -- Get total votes for this election
  SELECT COUNT(*) INTO total_votes_count
  FROM public.votes
  WHERE public.votes.election_id = election_uuid;
  
  -- Return results with properly qualified column names
  RETURN QUERY
  WITH candidate_vote_counts AS (
    SELECT 
      public.votes.candidate_id AS cand_id,
      COUNT(*) AS votes_received
    FROM public.votes
    WHERE public.votes.election_id = election_uuid
    GROUP BY public.votes.candidate_id
  )
  SELECT 
    candidates_table.id AS candidate_id,
    candidates_table.full_name AS candidate_name,
    candidates_table.department,
    candidates_table.course,
    candidates_table.year_of_study,
    candidates_table.image_url,
    COALESCE(vote_summary.votes_received, 0) AS vote_count,
    CASE 
      WHEN total_votes_count > 0 THEN 
        ROUND((COALESCE(vote_summary.votes_received, 0)::numeric / total_votes_count::numeric) * 100, 2)
      ELSE 0::numeric
    END AS vote_percentage
  FROM public.candidates AS candidates_table
  LEFT JOIN candidate_vote_counts AS vote_summary 
    ON candidates_table.id = vote_summary.cand_id
  WHERE candidates_table.election_id = election_uuid
  ORDER BY COALESCE(vote_summary.votes_received, 0) DESC, candidates_table.full_name ASC;
END;
$$;

-- Set ownership and grant permissions
ALTER FUNCTION public.get_election_results(uuid) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.get_election_results(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_election_results(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_election_results(uuid) TO anon;