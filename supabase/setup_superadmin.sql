-- =====================================================
-- TABLE: profiles (Handle User Roles)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'admin');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- CREATE SUPER ADMIN USER
-- =====================================================
-- Note: Replace 'your-password' if you want to set a specific password
-- This script creates the user if they don't exist and sets their role to superadmin

DO $$
DECLARE
  uid UUID := '2a60328c-15a1-4ac9-a6cb-56919320cd6d'; -- The ID you provided
  u_email TEXT := 'adminshp@gmail.com';
BEGIN
  -- Insert into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = u_email) THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, confirmation_token, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      uid,
      u_email,
      crypt('2a60328c-15a1-4ac9-a6cb-56919320cd6d', gen_salt('bf')), -- Using the ID as temporary password as it was provided
      now(),
      'authenticated',
      '',
      '{"provider":"email","providers":["email"]}',
      '{"role":"superadmin"}',
      now(),
      now()
    );
  END IF;

  -- Ensure profile exists and is superadmin
  INSERT INTO public.profiles (id, email, role)
  VALUES (uid, u_email, 'superadmin')
  ON CONFLICT (id) DO UPDATE SET role = 'superadmin';

END $$;
