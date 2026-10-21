-- ============================================================================
-- ElegAI Database Schema  (MySQL / MariaDB)
-- AI-powered e-commerce platform for a bridal & formal-wear shop
-- ============================================================================

-- Users — customers and administrators -----------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120)     NOT NULL,
  email      VARCHAR(190)     NOT NULL UNIQUE,
  password   VARCHAR(255)     NOT NULL,                -- bcrypt hash
  role       ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- CustomerProfiles — measurements & style preferences --------------
CREATE TABLE IF NOT EXISTS customer_profiles (
  profile_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL UNIQUE,
  height_cm       SMALLINT UNSIGNED NULL,
  measurements    JSON NULL,               -- e.g. {"bust":88,"waist":66,"hips":92,"shoulder":40}
  preferred_style VARCHAR(60) NULL,
  preferred_color VARCHAR(40) NULL,
  preferred_fit   VARCHAR(60) NULL,
  preferred_size  VARCHAR(20) NULL,
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Products ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  product_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(190) NOT NULL,
  description     TEXT,
  price           DECIMAL(10,2) NOT NULL,
  category        ENUM('Bridal Gowns','Evening Gowns','Formal Dresses','Suits','Barongs','Accessories') NOT NULL,
  color           VARCHAR(40) NOT NULL,
  available_sizes JSON NOT NULL,           -- e.g. ["XS","S","M","L"]
  stock           INT NOT NULL DEFAULT 0,
  image_url       VARCHAR(500) NOT NULL DEFAULT '',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_category (category),
  INDEX idx_products_color   (color),
  INDEX idx_products_price   (price)
) ENGINE=InnoDB;

-- Cart --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart (
  cart_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity   INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_cart_user_product (user_id, product_id),
  CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users(user_id)    ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Orders ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  order_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  total_amount     DECIMAL(10,2) NOT NULL,
  status           ENUM('Pending','Confirmed','Processing','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
  shipping_address JSON NOT NULL,          -- {line1,line2,city,province,postal,phone}
  payment_method   VARCHAR(60) NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_user   (user_id),
  INDEX idx_orders_status (status),
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- OrderItems — line items snapshot ----------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id      INT UNSIGNED NOT NULL,
  product_id    INT UNSIGNED NOT NULL,
  quantity      INT UNSIGNED NOT NULL,
  price         DECIMAL(10,2) NOT NULL,    -- price at time of purchase
  CONSTRAINT fk_item_order   FOREIGN KEY (order_id)   REFERENCES orders(order_id)   ON DELETE CASCADE,
  CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(product_id)
) ENGINE=InnoDB;

-- Password reset tokens --------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,            -- sha256 hex of the raw token
  expires_at DATETIME NOT NULL,
  used       TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reset_hash (token_hash),
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Look requests — an AI-generated look a customer sends to the boutique ----
CREATE TABLE IF NOT EXISTS look_requests (
  request_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  prompt       TEXT NULL,
  image_data   MEDIUMTEXT NULL,            -- data URL of the generated look
  image_source VARCHAR(120) NULL,
  sizing       VARCHAR(120) NULL,
  measurements TEXT NULL,
  notes        TEXT NULL,
  status       ENUM('New','In Review','Fulfilled','Declined') NOT NULL DEFAULT 'New',
  admin_note   TEXT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_look_requests_status (status),
  INDEX idx_look_requests_user   (user_id),
  CONSTRAINT fk_look_request_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;
