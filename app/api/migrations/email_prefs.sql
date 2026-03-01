-- Add email preferences to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_coaching_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_coaching_schedule VARCHAR(50) DEFAULT 'daily';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(100);

-- Create coaching_emails table for email delivery queue
CREATE TABLE IF NOT EXISTS coaching_emails (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  scheduled_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for pending emails
CREATE INDEX IF NOT EXISTS idx_coaching_emails_pending ON coaching_emails(user_id, status) WHERE status = 'pending';
