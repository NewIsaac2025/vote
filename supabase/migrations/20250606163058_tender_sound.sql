/*
  # Complete University Voting System Database Schema

  1. New Tables
    - `students` - Student registration data with wallet addresses
    - `elections` - Election management with start/end dates
    - `candidates` - Candidate profiles linked to elections
    - `votes` - Secure voting records with blockchain integration

  2. Security
    - Enable RLS on all tables
    - Policies for student data access
    - Public read access for elections and candidates
    - Secure voting with student verification

  3. Performance
    - Indexes on frequently queried columns
    - Function for real-time election results
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  student_id text UNIQUE NOT NULL,
  wallet_address text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create elections table
CREATE TABLE IF NOT EXISTS elections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  department text NOT NULL,
  course text NOT NULL,
  year_of_study integer,
  manifesto text,
  image_url text,
  video_url text,
  election_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  election_id uuid NOT NULL,
  wallet_address text NOT NULL,
  vote_hash text,
  voted_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'candidates_election_id_fkey'
  ) THEN
    ALTER TABLE candidates ADD CONSTRAINT candidates_election_id_fkey 
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'votes_student_id_fkey'
  ) THEN
    ALTER TABLE votes ADD CONSTRAINT votes_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'votes_candidate_id_fkey'
  ) THEN
    ALTER TABLE votes ADD CONSTRAINT votes_candidate_id_fkey 
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'votes_election_id_fkey'
  ) THEN
    ALTER TABLE votes ADD CONSTRAINT votes_election_id_fkey 
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unique constraint for one vote per student per election
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'votes_student_id_election_id_key'
  ) THEN
    ALTER TABLE votes ADD CONSTRAINT votes_student_id_election_id_key 
    UNIQUE (student_id, election_id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students (email);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students (student_id);
CREATE INDEX IF NOT EXISTS idx_elections_active ON elections (is_active);
CREATE INDEX IF NOT EXISTS idx_elections_dates ON elections (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_candidates_election ON candidates (election_id);
CREATE INDEX IF NOT EXISTS idx_votes_election ON votes (election_id);
CREATE INDEX IF NOT EXISTS idx_votes_student_election ON votes (student_id, election_id);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Students policies
  DROP POLICY IF EXISTS "Anyone can insert students" ON students;
  CREATE POLICY "Anyone can insert students"
    ON students
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Students can read own data" ON students;
  CREATE POLICY "Students can read own data"
    ON students
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = id::text);

  DROP POLICY IF EXISTS "Students can update own data" ON students;
  CREATE POLICY "Students can update own data"
    ON students
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = id::text);

  -- Elections policies
  DROP POLICY IF EXISTS "Anyone can read elections" ON elections;
  CREATE POLICY "Anyone can read elections"
    ON elections
    FOR SELECT
    TO anon, authenticated
    USING (true);

  DROP POLICY IF EXISTS "Authenticated users can create elections" ON elections;
  CREATE POLICY "Authenticated users can create elections"
    ON elections
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Creators can update their elections" ON elections;
  CREATE POLICY "Creators can update their elections"
    ON elections
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = created_by::text);

  -- Candidates policies
  DROP POLICY IF EXISTS "Anyone can read candidates" ON candidates;
  CREATE POLICY "Anyone can read candidates"
    ON candidates
    FOR SELECT
    TO anon, authenticated
    USING (true);

  DROP POLICY IF EXISTS "Authenticated users can create candidates" ON candidates;
  CREATE POLICY "Authenticated users can create candidates"
    ON candidates
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Authenticated users can update candidates" ON candidates;
  CREATE POLICY "Authenticated users can update candidates"
    ON candidates
    FOR UPDATE
    TO authenticated
    USING (true);

  -- Votes policies
  DROP POLICY IF EXISTS "Students can insert votes" ON votes;
  CREATE POLICY "Students can insert votes"
    ON votes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = student_id::text);

  DROP POLICY IF EXISTS "Students can read own votes" ON votes;
  CREATE POLICY "Students can read own votes"
    ON votes
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = student_id::text);
END $$;

-- Create function to get election results
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
    c.id as candidate_id,
    c.full_name as candidate_name,
    c.department,
    c.course,
    COUNT(v.id) as vote_count
  FROM candidates c
  LEFT JOIN votes v ON c.id = v.candidate_id
  WHERE c.election_id = election_uuid
  GROUP BY c.id, c.full_name, c.department, c.course
  ORDER BY vote_count DESC, c.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_election_results(uuid) TO anon, authenticated;