
-- 1. Get the current RLS policy situation for 'profiles'
-- We want admins to be able to see ALL profiles and edit their roles.
-- Standard users can only see/edit themselves.

-- Drop conflicting policies if created before
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Re-enable RLS just in case
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. CREATE NEW POLICIES

-- VIEW: Users see themselves OR admins see everyone
CREATE POLICY "View Policy" ON profiles FOR SELECT USING (
  (auth.uid() = id) OR 
  ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
);

-- UPDATE: Users update themselves OR admins update everyone
CREATE POLICY "Update Policy" ON profiles FOR UPDATE USING (
  (auth.uid() = id) OR 
  ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
);

-- Make sure we have at least one admin for testing
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users table if known,
-- or just update manually in the table editor.
-- Example: UPDATE profiles SET role = 'admin' WHERE id = '...';
