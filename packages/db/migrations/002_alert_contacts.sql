-- Add contact channels to saved_searches
ALTER TABLE saved_searches
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(200),
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS notify_via_email BOOLEAN DEFAULT TRUE;

-- Optional: simple check to avoid whitespace-only emails
CREATE INDEX IF NOT EXISTS idx_saved_searches_contact_email ON saved_searches(contact_email);
