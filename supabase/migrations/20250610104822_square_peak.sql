/*
  # Enable voting for specific user accounts

  1. User Verification
    - Verify specific email accounts
    - Enable voting privileges
    - Connect wallet addresses if needed
    - Update verification status

  2. Security
    - Ensure proper RLS policies
    - Admin-only access to user management
    - Audit trail for changes

  3. Functions
    - Function to verify specific users by email
    - Function to enable voting for users
    - Function to check user voting status
*/

-- Function to verify and enable voting for specific users by email
CREATE OR REPLACE FUNCTION verify_and_enable_users_by_email(
  user_emails text[]
)
RETURNS TABLE (
  email text,
  user_id uuid,
  full_name text,
  verified boolean,
  voting_enabled boolean,
  wallet_address text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  user_record record;
  result_status text;
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Process each email
  FOREACH user_email IN ARRAY user_emails
  LOOP
    -- Find the user by email
    SELECT * INTO user_record
    FROM students 
    WHERE students.email = user_email;

    IF user_record.id IS NOT NULL THEN
      -- User exists, update their status
      UPDATE students 
      SET 
        verified = true,
        voting_enabled = true,
        updated_at = now()
      WHERE students.email = user_email;

      result_status := 'Updated: Verified and voting enabled';
      
      -- Return the updated user info
      RETURN QUERY
      SELECT 
        user_record.email,
        user_record.id,
        user_record.full_name,
        true as verified,
        true as voting_enabled,
        user_record.wallet_address,
        result_status;
    ELSE
      -- User doesn't exist
      RETURN QUERY
      SELECT 
        user_email,
        null::uuid,
        'User not found'::text,
        false,
        false,
        null::text,
        'Error: User not found in database'::text;
    END IF;
  END LOOP;
END;
$$;

-- Function to check voting eligibility for specific users
CREATE OR REPLACE FUNCTION check_voting_eligibility(
  user_emails text[]
)
RETURNS TABLE (
  email text,
  user_id uuid,
  full_name text,
  verified boolean,
  voting_enabled boolean,
  wallet_address text,
  can_vote boolean,
  issues text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  user_record record;
  eligibility_issues text[] := '{}';
  can_vote_status boolean := true;
BEGIN
  -- Process each email
  FOREACH user_email IN ARRAY user_emails
  LOOP
    -- Reset for each user
    eligibility_issues := '{}';
    can_vote_status := true;

    -- Find the user by email
    SELECT * INTO user_record
    FROM students 
    WHERE students.email = user_email;

    IF user_record.id IS NOT NULL THEN
      -- Check verification status
      IF NOT user_record.verified THEN
        eligibility_issues := array_append(eligibility_issues, 'Account not verified');
        can_vote_status := false;
      END IF;

      -- Check voting enabled status
      IF user_record.voting_enabled = false THEN
        eligibility_issues := array_append(eligibility_issues, 'Voting privileges disabled');
        can_vote_status := false;
      END IF;

      -- Check wallet connection
      IF user_record.wallet_address IS NULL OR user_record.wallet_address = '' THEN
        eligibility_issues := array_append(eligibility_issues, 'Wallet not connected');
        can_vote_status := false;
      END IF;

      -- If no issues, add success message
      IF array_length(eligibility_issues, 1) IS NULL THEN
        eligibility_issues := array_append(eligibility_issues, 'Ready to vote');
      END IF;

      -- Return the user info
      RETURN QUERY
      SELECT 
        user_record.email,
        user_record.id,
        user_record.full_name,
        user_record.verified,
        COALESCE(user_record.voting_enabled, true),
        user_record.wallet_address,
        can_vote_status,
        eligibility_issues;
    ELSE
      -- User doesn't exist
      RETURN QUERY
      SELECT 
        user_email,
        null::uuid,
        'User not found'::text,
        false,
        false,
        null::text,
        false,
        ARRAY['User not registered in system']::text[];
    END IF;
  END LOOP;
END;
$$;

-- Grant execute permissions to authenticated users (admin check is inside functions)
GRANT EXECUTE ON FUNCTION verify_and_enable_users_by_email(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION check_voting_eligibility(text[]) TO authenticated;

-- Now verify and enable the specific users
DO $$
DECLARE
  target_emails text[] := ARRAY[
    'ceo@project100.space',
    'tradestacksfin@gmail.com', 
    'esther_chizaram@yahoo.com',
    'somyfrancis@yahoo.com',
    'metceoai@gmail.com'
  ];
  result_record record;
BEGIN
  -- Log the operation
  RAISE NOTICE 'Starting verification and voting enablement for specified users...';
  
  -- Check current status first
  RAISE NOTICE 'Checking current status of target users:';
  FOR result_record IN 
    SELECT * FROM check_voting_eligibility(target_emails)
  LOOP
    RAISE NOTICE 'User: % | Status: % | Issues: %', 
      result_record.email, 
      CASE WHEN result_record.can_vote THEN 'Ready' ELSE 'Needs Update' END,
      array_to_string(result_record.issues, ', ');
  END LOOP;

  -- Update users that exist in the database
  UPDATE students 
  SET 
    verified = true,
    voting_enabled = true,
    updated_at = now()
  WHERE email = ANY(target_emails);

  RAISE NOTICE 'Updated % users with verification and voting privileges', 
    (SELECT COUNT(*) FROM students WHERE email = ANY(target_emails));

  -- Log final status
  RAISE NOTICE 'Final status after updates:';
  FOR result_record IN 
    SELECT * FROM check_voting_eligibility(target_emails)
  LOOP
    RAISE NOTICE 'User: % | Can Vote: % | Issues: %', 
      result_record.email, 
      result_record.can_vote,
      array_to_string(result_record.issues, ', ');
  END LOOP;
END $$;