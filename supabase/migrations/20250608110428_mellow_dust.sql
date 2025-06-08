-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.get_election_results(uuid);
DROP FUNCTION IF EXISTS public.check_student_vote_status(uuid, uuid);

-- Function to check if a student has voted in a specific election
CREATE FUNCTION public.check_student_vote_status(
    student_uuid uuid,
    election_uuid uuid
)
RETURNS TABLE (
    has_voted BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT EXISTS (
        SELECT 1
        FROM public.votes
        WHERE votes.student_id = student_uuid
          AND votes.election_id = election_uuid
    ) AS has_voted;
END;
$$;

-- Function to get election results with vote counts and percentages
CREATE FUNCTION public.get_election_results(
    election_uuid uuid
)
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
    -- Get total votes for this election
    SELECT COUNT(*) INTO total_votes
    FROM public.votes
    WHERE votes.election_id = election_uuid;
    
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
    ORDER BY vote_counts.vote_count DESC NULLS LAST, c.full_name;
END;
$$;

-- Set ownership and permissions
ALTER FUNCTION public.check_student_vote_status(uuid, uuid) OWNER TO postgres;
ALTER FUNCTION public.get_election_results(uuid) OWNER TO postgres;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_student_vote_status(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_student_vote_status(uuid, uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.get_election_results(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_election_results(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_election_results(uuid) TO anon;