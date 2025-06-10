/*
  # Fix check_user_can_vote function

  1. Drop existing function first to avoid return type conflicts
  2. Create function to check if user can vote with proper return type
  3. Grant appropriate permissions
*/

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS check_user_can_vote(text);

-- Create function to check if user can vote
CREATE FUNCTION check_user_can_vote(user_email text)
RETURNS TABLE (
  can_vote boolean,
  verified boolean,
  voting_enabled boolean,
  wallet_address text,
  issues text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_record students%ROWTYPE;
  issue_list text[] := '{}';
BEGIN
  -- Get student record
  SELECT * INTO student_record
  FROM students s
  WHERE s.email = user_email;
  
  -- Check if user exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false as can_vote,
      false as verified,
      false as voting_enabled,
      null::text as wallet_address,
      ARRAY['User not found'] as issues;
    RETURN;
  END IF;
  
  -- Check verification status
  IF NOT COALESCE(student_record.verified, false) THEN
    issue_list := array_append(issue_list, 'User not verified');
  END IF;
  
  -- Check voting enabled status
  IF NOT COALESCE(student_record.voting_enabled, false) THEN
    issue_list := array_append(issue_list, 'Voting not enabled');
  END IF;
  
  -- Check wallet address
  IF student_record.wallet_address IS NULL OR student_record.wallet_address = '' THEN
    issue_list := array_append(issue_list, 'No wallet address');
  END IF;
  
  -- Return results
  RETURN QUERY SELECT 
    (COALESCE(student_record.verified, false) AND 
     COALESCE(student_record.voting_enabled, false) AND 
     student_record.wallet_address IS NOT NULL AND 
     student_record.wallet_address != '') as can_vote,
    COALESCE(student_record.verified, false) as verified,
    COALESCE(student_record.voting_enabled, false) as voting_enabled,
    student_record.wallet_address,
    CASE WHEN array_length(issue_list, 1) > 0 THEN issue_list ELSE ARRAY['Ready to vote'] END as issues;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_user_can_vote(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_can_vote(text) TO anon;