-- Term 5 rollover (run in Supabase → SQL Editor)
-- 1) Flip branding
UPDATE "AppSettings"
SET "termInfo" = 'Term 5 · Sep 26, 2026 onwards · TAPMI Manipal'
WHERE id = 1;

-- 2) Drop Term 4 subjects (cascades their leave rows)
DELETE FROM "Subject"
WHERE code IN (
  'MSM6430', -- Applied Marketing Strategy
  'MSM6400', -- B2B Marketing
  'MSM6904', -- Legal Aspects of Business
  'MSM6404', -- Management of Sales Force (Elective)
  'MSM6407', -- Services Marketing
  'MSM6503'  -- Supply Chain Management
);

-- Sanity check
SELECT "termInfo" FROM "AppSettings" WHERE id = 1;
SELECT code, name, credits FROM "Subject" ORDER BY name;
