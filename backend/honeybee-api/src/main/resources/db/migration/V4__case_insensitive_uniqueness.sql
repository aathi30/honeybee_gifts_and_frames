CREATE UNIQUE INDEX idx_category_name_ci ON categories (LOWER(name));
CREATE UNIQUE INDEX idx_admin_username_ci ON admins (LOWER(username));
CREATE UNIQUE INDEX idx_admin_email_ci ON admins (LOWER(email));
