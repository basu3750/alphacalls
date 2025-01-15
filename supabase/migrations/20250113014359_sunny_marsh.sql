/*
  # Create coin launches table

  1. New Tables
    - `coin_launches`
      - `id` (uuid, primary key)
      - `name` (text)
      - `launch_time` (timestamp with time zone)
      - `potential_gain` (numeric)
      - `platform` (text)
      - `description` (text)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `coin_launches` table
    - Add policies for public read access
    - Add policies for authenticated users to create and update launches
*/

CREATE TABLE IF NOT EXISTS coin_launches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  launch_time timestamptz NOT NULL,
  potential_gain numeric NOT NULL,
  platform text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coin_launches ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
  ON coin_launches
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to create launches
CREATE POLICY "Allow authenticated users to create launches"
  ON coin_launches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update their launches
CREATE POLICY "Allow authenticated users to update launches"
  ON coin_launches
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);