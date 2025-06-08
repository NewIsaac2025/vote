/*
  # Create admin_users table

  1. New Tables
    - `admin_users`
      - `user_id` (uuid, primary key, references auth.users)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `admin_users` table
    - Add policy for authenticated users to read admin data
*/

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read admin data (for checking admin status)
CREATE POLICY "Users can read admin data"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow admins to insert new admin users (this would be managed separately)
CREATE POLICY "Only admins can create admin users"
  ON public.admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (false); -- This prevents regular users from making themselves admin