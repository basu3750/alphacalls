/*
  # Add unique constraint on coin launches name

  1. Changes
    - Add unique constraint on name column of coin_launches table
    
  2. Why
    - Required for upsert operations using ON CONFLICT
    - Ensures no duplicate coin names in the database
*/

ALTER TABLE coin_launches
ADD CONSTRAINT coin_launches_name_key UNIQUE (name);