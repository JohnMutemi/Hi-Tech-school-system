-- Insert a sample school for testing
INSERT INTO schools (id, name, code, address, phone, email, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Meru University School',
  'mue8134',
  '123 University Road, Meru',
  '+254700000000',
  'admin@meru.edu',
  true,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Insert admin user for the sample school
INSERT INTO users (id, name, email, password, role, school_id, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'School Administrator',
  'admin@meru.edu',
  '$2a$12$LQv3c1yqBwEHXLAEpGBoLOHSiTY.rjwwwpD/kBUFujAyqcjiwm/nO', -- password: admin123
  'school_admin',
  s.id,
  true,
  NOW(),
  NOW()
FROM schools s 
WHERE s.code = 'mue8134'
ON CONFLICT (email) DO NOTHING;
