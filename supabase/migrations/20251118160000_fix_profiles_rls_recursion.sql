-- Fix infinite recursion in profiles RLS policies
-- The issue is that policies checking for admin role query the profiles table,
-- which triggers the same policies, causing infinite recursion.

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Solution: Use a function that bypasses RLS by being owned by a superuser role
-- In Supabase, we'll create the function with proper permissions
CREATE OR REPLACE FUNCTION check_user_is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- This function will be called from RLS policies
  -- We need to read from profiles without triggering RLS
  -- The function owner (postgres/supabase_admin) can bypass RLS
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_user_is_admin(UUID) TO authenticated;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow admins to view all profiles (using function to avoid recursion)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (check_user_is_admin(auth.uid()));

-- CRITICAL: Allow users to insert their own profile
-- This is essential for initial profile creation
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow admins to insert any profile (using function to avoid recursion)
-- Note: This only works if the admin already has a profile
CREATE POLICY "Admins can insert any profile"
  ON profiles FOR INSERT
  WITH CHECK (check_user_is_admin(auth.uid()));

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to update all profiles (using function to avoid recursion)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (check_user_is_admin(auth.uid()))
  WITH CHECK (check_user_is_admin(auth.uid()));
