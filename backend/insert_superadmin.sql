-- SQL to create Super Admin user
-- Name: koro
-- Email: admin@example.com
-- Password: password
-- Role: SUPERADMIN

-- First, delete existing user if exists
DELETE FROM users WHERE email = 'admin@example.com';

-- Insert new super admin user
INSERT INTO users (
    id,
    name,
    email,
    password,
    role,
    role_id,
    phone,
    avatar,
    google_id,
    twitter_id,
    facebook_id,
    reset_password_token,
    reset_password_token_expires_at,
    last_viewed_orders_at,
    created_at,
    updated_at
) VALUES (
    UUID(),
    'koro',
    'admin@example.com',
    '$2y$10$JevWtnVxccNbkum0riujZuwXPY3U6mctdDN2Kkojdg1ToXauMLtye',
    'SUPERADMIN',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
);

-- Verify the user was created
SELECT id, name, email, role, created_at FROM users WHERE email = 'admin@example.com';
