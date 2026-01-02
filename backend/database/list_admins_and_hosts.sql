-- =====================================================
-- LIST ADMINS AND HOSTS
-- =====================================================
-- Use this script to find out who the admins and hosts are
-- Useful for understanding who can approve experiences and who owns them
-- =====================================================

-- =====================================================
-- 1. LIST ALL ADMINS
-- =====================================================
-- Admins are users who can approve/reject experiences and access the /moderator dashboard

SELECT 
    id,
    email,
    full_name,
    role,
    auth_provider,
    created_at,
    updated_at
FROM public.users 
WHERE role = 'admin'
ORDER BY created_at DESC;


-- =====================================================
-- 2. LIST ALL HOSTS
-- =====================================================
-- Hosts are users who can create experiences and event runs

SELECT 
    id,
    email,
    full_name,
    role,
    auth_provider,
    created_at,
    updated_at
FROM public.users 
WHERE role = 'host'
ORDER BY created_at DESC;


-- =====================================================
-- 3. COUNT USERS BY ROLE
-- =====================================================
-- Get a summary of how many users are in each role

SELECT 
    role,
    COUNT(*) as user_count
FROM public.users 
GROUP BY role
ORDER BY user_count DESC;


-- =====================================================
-- 4. WHICH ADMIN APPROVED WHICH EXPERIENCES
-- =====================================================
-- See which admin approved each experience (for approved experiences only)

SELECT 
    e.id as experience_id,
    e.title,
    e.status,
    e.approved_at,
    admin.id as admin_id,
    admin.email as admin_email,
    admin.full_name as admin_name,
    host.id as host_id,
    host.email as host_email,
    host.full_name as host_name
FROM public.experiences e
LEFT JOIN public.users admin ON e.approved_by = admin.id
LEFT JOIN public.users host ON e.host_id = host.id
WHERE e.status = 'approved'
ORDER BY e.approved_at DESC;


-- =====================================================
-- 5. ADMINS WITH THEIR APPROVAL COUNT
-- =====================================================
-- See how many experiences each admin has approved

SELECT 
    admin.id as admin_id,
    admin.email as admin_email,
    admin.full_name as admin_name,
    COUNT(e.id) as experiences_approved,
    MIN(e.approved_at) as first_approval,
    MAX(e.approved_at) as latest_approval
FROM public.users admin
LEFT JOIN public.experiences e ON e.approved_by = admin.id AND e.status = 'approved'
WHERE admin.role = 'admin'
GROUP BY admin.id, admin.email, admin.full_name
ORDER BY experiences_approved DESC;


-- =====================================================
-- 6. HOSTS WITH THEIR EXPERIENCE COUNT
-- =====================================================
-- See how many experiences each host has created and their status breakdown

SELECT 
    host.id as host_id,
    host.email as host_email,
    host.full_name as host_name,
    COUNT(e.id) as total_experiences,
    COUNT(CASE WHEN e.status = 'draft' THEN 1 END) as draft_count,
    COUNT(CASE WHEN e.status = 'submitted' THEN 1 END) as submitted_count,
    COUNT(CASE WHEN e.status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN e.status = 'rejected' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN e.status = 'archived' THEN 1 END) as archived_count,
    MIN(e.created_at) as first_experience_created,
    MAX(e.created_at) as latest_experience_created
FROM public.users host
LEFT JOIN public.experiences e ON e.host_id = host.id
WHERE host.role = 'host'
GROUP BY host.id, host.email, host.full_name
ORDER BY total_experiences DESC, host.full_name;


-- =====================================================
-- 7. FIND ADMIN BY EMAIL
-- =====================================================
-- Replace 'admin@example.com' with the actual email you're looking for

-- SELECT 
--     id,
--     email,
--     full_name,
--     role,
--     auth_provider,
--     created_at,
--     updated_at
-- FROM public.users 
-- WHERE email = 'admin@example.com';  -- Replace with actual email


-- =====================================================
-- 8. FIND HOST BY EMAIL
-- =====================================================
-- Replace 'host@example.com' with the actual email you're looking for

-- SELECT 
--     id,
--     email,
--     full_name,
--     role,
--     auth_provider,
--     created_at,
--     updated_at
-- FROM public.users 
-- WHERE email = 'host@example.com';  -- Replace with actual email

