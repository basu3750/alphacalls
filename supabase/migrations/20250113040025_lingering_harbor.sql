-- Add user_id column to tables
ALTER TABLE whale_alerts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE coin_launches ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Update RLS policies for whale_alerts
DROP POLICY IF EXISTS "Allow public read access on whale alerts" ON whale_alerts;
DROP POLICY IF EXISTS "Allow authenticated users to insert whale alerts" ON whale_alerts;

CREATE POLICY "Enable read access for all users"
  ON whale_alerts FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON whale_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update RLS policies for coin_launches
DROP POLICY IF EXISTS "Allow public read access" ON coin_launches;
DROP POLICY IF EXISTS "Allow authenticated users to create launches" ON coin_launches;
DROP POLICY IF EXISTS "Allow authenticated users to update launches" ON coin_launches;

CREATE POLICY "Enable read access for all users"
  ON coin_launches FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON coin_launches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users"
  ON coin_launches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);