/*
  # Add voting privileges management

  1. New Columns
    - Add `voting_enabled` column to students table
    - Add `last_login` column to students table for tracking activity

  2. Functions
    - Add function to toggle voting privileges
    - Add function to get user statistics

  3. Security
    - Add admin policies for user management
    - Ensure only admins can modify voting privileges
*/

-- Add voting_enabled column to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'voting_enabled'
  ) THEN
    ALTER TABLE students ADD COLUMN voting_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Add last_login column to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE students ADD COLUMN last_login timestamptz;
  END IF;
END $$;

-- Function to toggle voting privileges (admin only)
CREATE OR REPLACE FUNCTION toggle_voting_privileges(
  student_uuid uuid,
  enable_voting boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update the student's voting privileges
  UPDATE students 
  SET voting_enabled = enable_voting,
      updated_at = now()
  WHERE id = student_uuid;

  RETURN FOUND;
END;
$$;

-- Function to get comprehensive user statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
  total_users bigint,
  verified_users bigint,
  unverified_users bigint,
  users_with_wallets bigint,
  voting_enabled_users bigint,
  total_votes_cast bigint,
  active_voters bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE verified = true) as verified_users,
    COUNT(*) FILTER (WHERE verified = false) as unverified_users,
    COUNT(*) FILTER (WHERE wallet_address IS NOT NULL) as users_with_wallets,
    COUNT(*) FILTER (WHERE voting_enabled = true) as voting_enabled_users,
    (SELECT COUNT(*) FROM votes) as total_votes_cast,
    (SELECT COUNT(DISTINCT student_id) FROM votes) as active_voters
  FROM students;
END;
$$;

-- Function to get user activity with vote counts
CREATE OR REPLACE FUNCTION get_users_with_activity()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  student_id text,
  phone text,
  wallet_address text,
  verified boolean,
  voting_enabled boolean,
  created_at timestamptz,
  updated_at timestamptz,
  last_login timestamptz,
  votes_cast bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.full_name,
    s.email,
    s.student_id,
    s.phone,
    s.wallet_address,
    s.verified,
    COALESCE(s.voting_enabled, true) as voting_enabled,
    s.created_at,
    s.updated_at,
    s.last_login,
    COUNT(v.id) as votes_cast
  FROM students s
  LEFT JOIN votes v ON s.id = v.student_id
  GROUP BY s.id, s.full_name, s.email, s.student_id, s.phone, s.wallet_address, 
           s.verified, s.voting_enabled, s.created_at, s.updated_at, s.last_login
  ORDER BY s.created_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users (admin check is inside functions)
GRANT EXECUTE ON FUNCTION toggle_voting_privileges(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_with_activity() TO authenticated;

-- Add policy for admins to manage student voting privileges
CREATE POLICY "Admins can update student voting privileges"
  ON students
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Update existing admin policies to include voting_enabled column
DROP POLICY IF EXISTS "Admins can manage students" ON students;
CREATE POLICY "Admins can manage students"
  ON students
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );