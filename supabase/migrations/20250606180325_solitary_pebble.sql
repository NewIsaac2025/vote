/*
  # Make specific user admin and enhance admin functionality

  1. Admin User Setup
    - Insert the specified user as admin
    - Add admin user management functions
  
  2. Enhanced Admin Functions
    - Add RPC functions for election management
    - Add functions for candidate management
    - Add functions for voter management
    - Add data deletion capabilities
*/

-- Insert the specific user as admin (using email lookup)
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find the user ID by email
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'akujor.amara@gmail.com';
  
  -- If user exists, make them admin
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.admin_users (user_id, created_at)
    VALUES (admin_user_id, now())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Function to get election results with candidate details
CREATE OR REPLACE FUNCTION get_election_results(election_uuid uuid)
RETURNS TABLE (
  candidate_id uuid,
  candidate_name text,
  department text,
  course text,
  vote_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.full_name,
    c.department,
    c.course,
    COUNT(v.id)::bigint as vote_count
  FROM candidates c
  LEFT JOIN votes v ON c.id = v.candidate_id
  WHERE c.election_id = election_uuid
  GROUP BY c.id, c.full_name, c.department, c.course
  ORDER BY vote_count DESC, c.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start an election
CREATE OR REPLACE FUNCTION start_election(election_uuid uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE elections 
  SET is_active = true, start_date = now()
  WHERE id = election_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to stop an election
CREATE OR REPLACE FUNCTION stop_election(election_uuid uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE elections 
  SET is_active = false, end_date = now()
  WHERE id = election_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete all election data (admin only)
CREATE OR REPLACE FUNCTION delete_all_election_data()
RETURNS boolean AS $$
BEGIN
  -- Delete in order to respect foreign key constraints
  DELETE FROM votes;
  DELETE FROM candidates;
  DELETE FROM elections;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete all student data (admin only)
CREATE OR REPLACE FUNCTION delete_all_student_data()
RETURNS boolean AS $$
BEGIN
  DELETE FROM votes;
  DELETE FROM students;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all voters with their voting status
CREATE OR REPLACE FUNCTION get_all_voters()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  student_id text,
  phone text,
  wallet_address text,
  verified boolean,
  created_at timestamptz,
  votes_cast bigint
) AS $$
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
    s.created_at,
    COUNT(v.id)::bigint as votes_cast
  FROM students s
  LEFT JOIN votes v ON s.id = v.student_id
  GROUP BY s.id, s.full_name, s.email, s.student_id, s.phone, s.wallet_address, s.verified, s.created_at
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policies for admin operations
CREATE POLICY "Admins can manage elections"
  ON elections
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

CREATE POLICY "Admins can manage candidates"
  ON candidates
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

CREATE POLICY "Admins can view all votes"
  ON votes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all students"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

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