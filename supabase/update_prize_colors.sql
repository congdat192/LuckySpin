-- Update prize colors for Christmas theme
-- Pattern: Red, Cream, Green, Gold (alternating)
-- Run this in Supabase SQL Editor

-- Get the active event prizes ordered by display_order
-- Then update each with the Christmas color scheme

WITH ordered_prizes AS (
  SELECT 
    ep.id,
    ep.name,
    ROW_NUMBER() OVER (ORDER BY ep.display_order) as rn
  FROM event_prizes ep
  JOIN events e ON ep.event_id = e.id
  WHERE e.status = 'active'
)
UPDATE event_prizes 
SET 
  color = CASE 
    WHEN (SELECT rn FROM ordered_prizes WHERE ordered_prizes.id = event_prizes.id) % 4 = 1 THEN '#B91C1C'  -- Red
    WHEN (SELECT rn FROM ordered_prizes WHERE ordered_prizes.id = event_prizes.id) % 4 = 2 THEN '#FDF6E3'  -- Cream
    WHEN (SELECT rn FROM ordered_prizes WHERE ordered_prizes.id = event_prizes.id) % 4 = 3 THEN '#166534'  -- Green
    WHEN (SELECT rn FROM ordered_prizes WHERE ordered_prizes.id = event_prizes.id) % 4 = 0 THEN '#D4A847'  -- Gold
  END,
  text_color = CASE 
    WHEN (SELECT rn FROM ordered_prizes WHERE ordered_prizes.id = event_prizes.id) % 4 IN (1, 3) THEN '#FFFFFF'  -- White for Red/Green
    ELSE '#333333'  -- Dark for Cream/Gold
  END,
  text_effect = CASE 
    WHEN (SELECT rn FROM ordered_prizes WHERE ordered_prizes.id = event_prizes.id) % 4 IN (1, 3) THEN 'shadow'  -- Shadow for dark bg
    ELSE 'none'  -- None for light bg
  END
WHERE id IN (SELECT id FROM ordered_prizes);
