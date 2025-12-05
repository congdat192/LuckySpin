-- Add text styling columns to event_prizes table
ALTER TABLE event_prizes 
  ADD COLUMN IF NOT EXISTS text_color VARCHAR(20) DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS text_effect VARCHAR(20) DEFAULT 'none';

-- text_effect options: 'none', 'shadow', 'outline', 'glow', 'gold'
