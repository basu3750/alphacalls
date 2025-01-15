/*
  # Create whale alerts table

  1. New Tables
    - `whale_alerts`
      - `id` (uuid, primary key)
      - `coin_name` (text)
      - `wallet_address` (text)
      - `amount` (numeric)
      - `transaction_type` (text)
      - `timestamp` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `whale_alerts` table
    - Add policy for public read access
    - Add policy for authenticated users to insert alerts
*/

CREATE TABLE IF NOT EXISTS whale_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_name text NOT NULL,
  wallet_address text NOT NULL,
  amount numeric NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE whale_alerts ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on whale alerts"
  ON whale_alerts
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert alerts
CREATE POLICY "Allow authenticated users to insert whale alerts"
  ON whale_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);