-- Create profile and admin role for existing user if they don't exist
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Find the user with the admin email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'bart.arther@lithiaspringsmethodist.org'
    LIMIT 1;
    
    -- If the user exists, create their profile and role
    IF admin_user_id IS NOT NULL THEN
        -- Insert profile if it doesn't exist
        INSERT INTO public.profiles (user_id, email, first_name, last_name)
        SELECT admin_user_id, 'bart.arther@lithiaspringsmethodist.org', 'Bart', 'Arther'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE user_id = admin_user_id
        );
        
        -- Insert admin role if it doesn't exist
        INSERT INTO public.user_roles (user_id, role)
        SELECT admin_user_id, 'admin'::app_role
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_roles WHERE user_id = admin_user_id AND role = 'admin'
        );
    END IF;
END $$;