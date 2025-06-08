/*
  # Create election results function

  1. New Functions
    - `get_election_results` - Returns vote counts and percentages for candidates in an election
    - `get_election_stats` - Returns comprehensive election statistics
    - `check_student_vote_status` - Checks if a student has voted in a specific election

  2. Security
    - Functions are accessible to authenticated users
    - Results are publicly viewable for transparency
*/

-- Function to get election results with vote counts and percentages
CREATE OR REPLACE FUNCTION get_election_results(election_uuid UUID)
RETURNS TABLE (
  candidate_id UUID,
  candidate_name TEXT,
  department TEXT,
  course TEXT,
  year_of_study INTEGER,
  image_url TEXT,
  vote_count BIGINT,
  vote_percentage DECIMAL(5,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_votes BIGINT;
BEGIN
  -- Get total votes for the election
  SELECT COUNT(*) INTO total_votes
  FROM votes v
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
        ROUND((COALESCE(vote_counts.vote_count, 0)::DECIMAL / total_votes::DECIMAL) * 100, 2)
      ELSE 0
    END as vote_percentage
  FROM candidates c
  LEFT JOIN (
    SELECT 
      v.candidate_id,
      COUNT(*) as vote_count
    FROM votes v
    WHERE v.election_id = election_uuid
    GROUP BY v.candidate_id
  ) vote_counts ON c.id = vote_counts.candidate_id
  WHERE c.election_id = election_uuid
  ORDER BY COALESCE(vote_counts.vote_count, 0) DESC, c.full_name ASC;
END;
$$;

-- Function to get comprehensive election statistics
CREATE OR REPLACE FUNCTION get_election_stats(election_uuid UUID)
RETURNS TABLE (
  total_votes BIGINT,
  total_candidates BIGINT,
  leading_candidate_name TEXT,
  leading_candidate_votes BIGINT,
  leading_candidate_percentage DECIMAL(5,2),
  voter_turnout_percentage DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_students BIGINT;
BEGIN
  -- Get total verified students (potential voters)
  SELECT COUNT(*) INTO total_students
  FROM students
  WHERE verified = true;

  RETURN QUERY
  WITH election_data AS (
    SELECT 
      COUNT(v.id) as vote_count,
      c.full_name as candidate_name
    FROM votes v
    JOIN candidates c ON v.candidate_id = c.id
    WHERE v.election_id = election_uuid
    GROUP BY c.id, c.full_name
    ORDER BY COUNT(v.id) DESC
    LIMIT 1
  ),
  vote_totals AS (
    SELECT COUNT(*) as total_vote_count
    FROM votes
    WHERE election_id = election_uuid
  )
  SELECT 
    vt.total_vote_count as total_votes,
    (SELECT COUNT(*) FROM candidates WHERE election_id = election_uuid) as total_candidates,
    COALESCE(ed.candidate_name, 'No votes yet') as leading_candidate_name,
    COALESCE(ed.vote_count, 0) as leading_candidate_votes,
    CASE 
      WHEN vt.total_vote_count > 0 THEN 
        ROUND((COALESCE(ed.vote_count, 0)::DECIMAL / vt.total_vote_count::DECIMAL) * 100, 2)
      ELSE 0
    END as leading_candidate_percentage,
    CASE 
      WHEN total_students > 0 THEN 
        ROUND((vt.total_vote_count::DECIMAL / total_students::DECIMAL) * 100, 2)
      ELSE 0
    END as voter_turnout_percentage
  FROM vote_totals vt
  LEFT JOIN election_data ed ON true;
END;
$$;

-- Function to check if a student has voted in a specific election
CREATE OR REPLACE FUNCTION check_student_vote_status(student_uuid UUID, election_uuid UUID)
RETURNS TABLE (
  has_voted BOOLEAN,
  vote_timestamp TIMESTAMPTZ,
  candidate_name TEXT
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
  FROM votes v
  JOIN candidates c ON v.candidate_id = c.id
  WHERE v.student_id = student_uuid 
    AND v.election_id = election_uuid
  UNION ALL
  SELECT 
    false as has_voted,
    NULL::TIMESTAMPTZ as vote_timestamp,
    NULL::TEXT as candidate_name
  WHERE NOT EXISTS (
    SELECT 1 FROM votes 
    WHERE student_id = student_uuid 
      AND election_id = election_uuid
  )
  LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_election_results(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_election_stats(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_student_vote_status(UUID, UUID) TO authenticated;