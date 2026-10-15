CREATE TABLE admins (
 id BIGSERIAL PRIMARY KEY, username VARCHAR(100) NOT NULL UNIQUE, email VARCHAR(254) NOT NULL UNIQUE,
 password_hash VARCHAR(100) NOT NULL, role VARCHAR(30) NOT NULL CHECK (role = 'ADMIN'),
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE categories (
 id BIGSERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL UNIQUE, slug VARCHAR(180) NOT NULL UNIQUE,
 description TEXT NOT NULL DEFAULT '', image_url TEXT, image_public_id VARCHAR(255),
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE frames (
 id BIGSERIAL PRIMARY KEY, name VARCHAR(180) NOT NULL, slug VARCHAR(240) NOT NULL UNIQUE,
 description TEXT NOT NULL DEFAULT '', price NUMERIC(12,2) NOT NULL CHECK (price > 0),
 size VARCHAR(200) NOT NULL, category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
 available BOOLEAN NOT NULL DEFAULT TRUE, featured BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_frames_category ON frames(category_id);
CREATE INDEX idx_frames_created ON frames(created_at DESC);
CREATE INDEX idx_frames_price ON frames(price);
CREATE INDEX idx_frames_featured ON frames(featured);
CREATE INDEX idx_frames_name ON frames(LOWER(name));
CREATE TABLE frame_images (
 id BIGSERIAL PRIMARY KEY, frame_id BIGINT NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
 image_url TEXT NOT NULL, cloudinary_public_id VARCHAR(255) NOT NULL UNIQUE, display_order INTEGER NOT NULL CHECK(display_order >= 0)
);
CREATE INDEX idx_frame_images_frame ON frame_images(frame_id);
CREATE TABLE shop_settings (
 id BIGINT PRIMARY KEY CHECK (id = 1), shop_name VARCHAR(120) NOT NULL,
 whatsapp_number VARCHAR(20) NOT NULL DEFAULT '', phone_number VARCHAR(40) NOT NULL DEFAULT '',
 address VARCHAR(1000) NOT NULL DEFAULT '', opening_hours VARCHAR(500) NOT NULL DEFAULT '',
 facebook_url VARCHAR(500) NOT NULL DEFAULT '', instagram_url VARCHAR(500) NOT NULL DEFAULT '',
 maps_url VARCHAR(500) NOT NULL DEFAULT '', hero_title VARCHAR(200) NOT NULL,
 hero_subtitle VARCHAR(500) NOT NULL
);
INSERT INTO shop_settings(id,shop_name,hero_title,hero_subtitle) VALUES
(1,'Honeybee Frame Shop','Make memories feel at home.','A thoughtful frame turns a favourite moment into something you live with. Find the perfect home for yours.');
CREATE TABLE image_cleanup_jobs (id BIGSERIAL PRIMARY KEY, public_id VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ NOT NULL);
