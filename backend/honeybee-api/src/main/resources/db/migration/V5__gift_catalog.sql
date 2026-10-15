CREATE TABLE gift_categories (
 id BIGSERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL UNIQUE, slug VARCHAR(180) NOT NULL UNIQUE,
 description TEXT NOT NULL DEFAULT '', image_url TEXT, image_public_id VARCHAR(255),
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE UNIQUE INDEX idx_gift_category_name_ci ON gift_categories (LOWER(name));

CREATE TABLE gifts (
 id BIGSERIAL PRIMARY KEY, name VARCHAR(180) NOT NULL, slug VARCHAR(240) NOT NULL UNIQUE,
 description TEXT NOT NULL DEFAULT '', price NUMERIC(12,2) NOT NULL CHECK (price > 0),
 category_id BIGINT NOT NULL REFERENCES gift_categories(id) ON DELETE RESTRICT,
 available BOOLEAN NOT NULL DEFAULT TRUE, featured BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_gifts_category ON gifts(category_id);
CREATE INDEX idx_gifts_created ON gifts(created_at DESC);
CREATE INDEX idx_gifts_price ON gifts(price);
CREATE INDEX idx_gifts_featured ON gifts(featured);
CREATE INDEX idx_gifts_name ON gifts(LOWER(name));

CREATE TABLE gift_images (
 id BIGSERIAL PRIMARY KEY, gift_id BIGINT NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
 image_url TEXT NOT NULL, cloudinary_public_id VARCHAR(255) NOT NULL UNIQUE,
 display_order INTEGER NOT NULL CHECK (display_order >= 0)
);
CREATE INDEX idx_gift_images_gift ON gift_images(gift_id);

-- Keep customized shop names and all existing frame records unchanged.
UPDATE shop_settings SET shop_name = 'Honeybee Frames & Gifts'
WHERE id = 1 AND shop_name = 'Honeybee Frame Shop';
