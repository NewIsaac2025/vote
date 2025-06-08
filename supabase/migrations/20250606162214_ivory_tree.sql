/*
  # Complete Voting System Database Schema

  1. New Tables
    - `students` - Store student registration information
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `student_id` (text, unique)
      - `wallet_address` (text, nullable)
      - `verified` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `elections` - Store election information
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, nullable)
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `is_active` (boolean, default true)
      - `created_by` (uuid, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `candidates` - Store candidate information
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `email` (text, nullable)
      - `department` (text)
      - `course` (text)
      - `year_of_study` (integer, nullable)
      - `manifesto` (text, nullable)
      - `image_url` (text, nullable)
      - `video_url` (text, nullable)
      - `election_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `votes` - Store voting records
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `candidate_id` (uuid, foreign key)
      - `election_id` (uuid, foreign key)
      - `wallet_address` (text)
      - `vote_hash` (text, nullable)
      - `voted_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access to elections and candidates
    - Add policies for vote recording

  3. Functions
    - Create function to get election results
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
  election_id uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  election_id uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  vote_hash text,
  voted_at timestamptz DEFAULT now(),
  UNIQUE(student_id, election_id) -- Ensure one vote per student per election
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Students policies
CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Students can update own data"
  ON students
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can insert students"
  ON students
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Elections policies
CREATE POLICY "Anyone can read elections"
  ON elections
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create elections"
  ON elections
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Creators can update their elections"
  ON elections
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = created_by::text);

-- Candidates policies
CREATE POLICY "Anyone can read candidates"
  ON candidates
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create candidates"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidates"
  ON candidates
  FOR UPDATE
  TO authenticated
  USING (true);

-- Votes policies
CREATE POLICY "Students can read own votes"
  ON votes
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = student_id::text);

CREATE POLICY "Students can insert votes"
  ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = student_id::text);

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
  ORDER BY vote_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_elections_active ON elections(is_active);
CREATE INDEX IF NOT EXISTS idx_elections_dates ON elections(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_candidates_election ON candidates(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_election ON votes(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_student_election ON votes(student_id, election_id);

-- Insert sample data for testing
INSERT INTO elections (title, description, start_date, end_date, is_active) VALUES
('Student Council President 2024', 'Annual election for Student Council President position', '2024-01-15 09:00:00+00', '2024-01-20 18:00:00+00', true),
('Faculty Representative Election', 'Election for faculty representatives across all departments', '2024-02-01 08:00:00+00', '2024-02-05 20:00:00+00', true),
('Sports Committee Election', 'Choose your sports committee members for the upcoming year', '2024-02-10 10:00:00+00', '2024-02-15 17:00:00+00', true)
ON CONFLICT DO NOTHING;

-- Get the election IDs for sample candidates
DO $$
DECLARE
  president_election_id uuid;
  faculty_election_id uuid;
  sports_election_id uuid;
BEGIN
  SELECT id INTO president_election_id FROM elections WHERE title = 'Student Council President 2024' LIMIT 1;
  SELECT id INTO faculty_election_id FROM elections WHERE title = 'Faculty Representative Election' LIMIT 1;
  SELECT id INTO sports_election_id FROM elections WHERE title = 'Sports Committee Election' LIMIT 1;

  -- Insert sample candidates
  IF president_election_id IS NOT NULL THEN
    INSERT INTO candidates (full_name, email, department, course, year_of_study, manifesto, election_id) VALUES
    ('Alice Johnson', 'alice.johnson@university.edu', 'Computer Science', 'BSc Computer Science', 3, 'I will work to improve student facilities and create more opportunities for academic and social growth.', president_election_id),
    ('Bob Smith', 'bob.smith@university.edu', 'Business Administration', 'MBA', 2, 'My focus will be on enhancing career services and building stronger industry partnerships.', president_election_id),
    ('Carol Davis', 'carol.davis@university.edu', 'Engineering', 'BSc Mechanical Engineering', 4, 'I aim to bridge the gap between students and administration while promoting sustainability initiatives.', president_election_id)
    ON CONFLICT DO NOTHING;
  END IF;

  IF faculty_election_id IS NOT NULL THEN
    INSERT INTO candidates (full_name, email, department, course, year_of_study, manifesto, election_id) VALUES
    ('David Wilson', 'david.wilson@university.edu', 'Mathematics', 'BSc Mathematics', 3, 'Representing the interests of mathematics students in faculty decisions.', faculty_election_id),
    ('Emma Brown', 'emma.brown@university.edu', 'Physics', 'BSc Physics', 2, 'Advocating for better laboratory facilities and research opportunities.', faculty_election_id)
    ON CONFLICT DO NOTHING;
  END IF;

  IF sports_election_id IS NOT NULL THEN
    INSERT INTO candidates (full_name, email, department, course, year_of_study, manifesto, election_id) VALUES
    ('Frank Miller', 'frank.miller@university.edu', 'Sports Science', 'BSc Sports Science', 3, 'Promoting inclusive sports programs and improving athletic facilities.', sports_election_id),
    ('Grace Lee', 'grace.lee@university.edu', 'Health Sciences', 'BSc Health Sciences', 2, 'Focus on wellness programs and mental health support for athletes.', sports_election_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;