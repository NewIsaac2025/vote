/*
  # Fix database functions with proper return types

  1. Functions
    - Drop existing functions first to avoid conflicts
    - Create get_election_results function with vote counts and percentages
    - Create get_election_stats function for comprehensive statistics
    - Create check_student_vote_status function with enhanced return data

  2. Security
    - Grant execute permissions to appropriate roles
    - Use SECURITY DEFINER for controlled access
*/

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.get_election_results(uuid);
DROP FUNCTION IF EXISTS public.get_election_stats(uuid);
DROP FUNCTION IF EXISTS public.check_student_vote_status(uuid, uuid);

-- Function to get election results with vote counts and percentages
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
  total_votes bigint;
BEGIN
  -- Get total votes for the election
  SELECT COUNT(*) INTO total_votes
  FROM public.votes v
  WHERE v.election_id = election_uuid;

  -- Return results with vote counts and percentages
  RETURN QUERY
  SELECT 
    c.id as candidate_id,
    c.full_name as candidate_name,
    c.department,
    c.course,
    c.year_of_study,
    c.image_url,
    COALESCE(vote_counts.vote_count, 0) as vote_count,
    CASE 
      WHEN total_votes > 0 THEN 
        ROUND((COALESCE(vote_counts.vote_count, 0)::numeric / total_votes::numeric) * 100, 2)
      ELSE 0::numeric
    END as vote_percentage
  FROM public.candidates c
  LEFT JOIN (
    SELECT 
      v.candidate_id,
      COUNT(*) as vote_count
    FROM public.votes v
    WHERE v.election_id = election_uuid
    GROUP BY v.candidate_id
  ) vote_counts ON c.id = vote_counts.candidate_id
  WHERE c.election_id = election_uuid
  ORDER BY COALESCE(vote_counts.vote_count, 0) DESC, c.full_name ASC;
END;
$$;

-- Function to get comprehensive election statistics
CREATE FUNCTION public.get_election_stats(election_uuid uuid)
RETURNS TABLE (
  total_votes bigint,
  total_candidates bigint,
  leading_candidate_name text,
  leading_candidate_votes bigint,
  leading_candidate_percentage numeric,
  voter_turnout_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_students bigint;
BEGIN
  -- Get total verified students (potential voters)
  SELECT COUNT(*) INTO total_students
  FROM public.students
  WHERE verified = true;

  RETURN QUERY
  WITH election_data AS (
    SELECT 
      COUNT(v.id) as vote_count,
      c.full_name as candidate_name
    FROM public.votes v
    JOIN public.candidates c ON v.candidate_id = c.id
    WHERE v.election_id = election_uuid
    GROUP BY c.id, c.full_name
    ORDER BY COUNT(v.id) DESC
    LIMIT 1
  ),
  vote_totals AS (
    SELECT COUNT(*) as total_vote_count
    FROM public.votes
    WHERE election_id = election_uuid
  )
  SELECT 
    vt.total_vote_count as total_votes,
    (SELECT COUNT(*) FROM public.candidates WHERE election_id = election_uuid) as total_candidates,
    COALESCE(ed.candidate_name, 'No votes yet') as leading_candidate_name,
    COALESCE(ed.vote_count, 0) as leading_candidate_votes,
    CASE 
      WHEN vt.total_vote_count > 0 THEN 
        ROUND((COALESCE(ed.vote_count, 0)::numeric / vt.total_vote_count::numeric) * 100, 2)
      ELSE 0::numeric
    END as leading_candidate_percentage,
    CASE 
      WHEN total_students > 0 THEN 
        ROUND((vt.total_vote_count::numeric / total_students::numeric) * 100, 2)
      ELSE 0::numeric
    END as voter_turnout_percentage
  FROM vote_totals vt
  LEFT JOIN election_data ed ON true;
END;
$$;

-- Function to check if a student has voted in a specific election
CREATE FUNCTION public.check_student_vote_status(student_uuid uuid, election_uuid uuid)
RETURNS TABLE (
  has_voted boolean,
  vote_timestamp timestamptz,
  candidate_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (v.id IS NOT NULL) as has_voted,
    v.voted_at as vote_timestamp,
    c.full_name as candidate_name
  FROM public.votes v
  JOIN public.candidates c ON v.candidate_id = c.id
  WHERE v.student_id = student_uuid 
    AND v.election_id = election_uuid
  UNION ALL
  SELECT 
    false as has_voted,
    NULL::timestamptz as vote_timestamp,
    NULL::text as candidate_name
  WHERE NOT EXISTS (
    SELECT 1 FROM public.votes 
    WHERE student_id = student_uuid 
      AND election_id = election_uuid
  )
  LIMIT 1;
END;
$$;

-- Set ownership and permissions
ALTER FUNCTION public.get_election_results(uuid) OWNER TO postgres;
ALTER FUNCTION public.get_election_stats(uuid) OWNER TO postgres;
ALTER FUNCTION public.check_student_vote_status(uuid, uuid) OWNER TO postgres;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_election_results(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_election_results(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_election_results(uuid) TO anon;

GRANT EXECUTE ON FUNCTION public.get_election_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_election_stats(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_election_stats(uuid) TO anon;

GRANT EXECUTE ON FUNCTION public.check_student_vote_status(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_student_vote_status(uuid, uuid) TO service_role;