-- Add new onboarding fields to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS biological_sex VARCHAR(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS body_weight INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS primary_focus VARCHAR(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS session_duration INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sleep_quality VARCHAR(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stress_level VARCHAR(50);

-- Create user_programs table for storing generated programs
CREATE TABLE IF NOT EXISTS user_programs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  program_name VARCHAR(255),
  program_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for active programs
CREATE INDEX IF NOT EXISTS idx_user_programs_active ON user_programs(user_id, is_active) WHERE is_active = TRUE;
