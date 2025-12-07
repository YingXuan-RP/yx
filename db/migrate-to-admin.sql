-- Add missing columns to existing tables for admin portal compatibility
-- Run this in MySQL Workbench on the yx database

USE yx;

-- Drop and recreate tables to ensure clean structure
-- Save existing data first
CREATE TABLE IF NOT EXISTS `categories_backup` AS SELECT * FROM `categories`;
CREATE TABLE IF NOT EXISTS `products_backup` AS SELECT * FROM `products`;
CREATE TABLE IF NOT EXISTS `orders_backup` AS SELECT * FROM `orders`;

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(10) DEFAULT '📦',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Restore category data
INSERT INTO `categories` (`id`, `name`, `description`, `icon`, `is_active`)
SELECT `id`, `name`, 
  COALESCE(`description`, ''), 
  COALESCE(`icon`, '📦'), 
  COALESCE(`is_active`, 1)
FROM `categories_backup`;

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) NOT NULL,
  `quantity` int DEFAULT 1,
  `stock` int DEFAULT 0,
  `is_available` tinyint(1) DEFAULT 1,
  `category_id` int DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Restore product data and set stock = quantity
INSERT INTO `products` (`id`, `name`, `price`, `description`, `image_url`, `quantity`, `stock`, `is_available`, `category_id`)
SELECT `id`, `name`, `price`,
  COALESCE(`description`, ''),
  `image_url`,
  COALESCE(`quantity`, 1),
  COALESCE(`quantity`, 1),
  COALESCE(`is_available`, 1),
  `category_id`
FROM `products_backup`;

-- Drop and recreate orders table with required columns
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0,
  `order_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `card_details` varchar(255) DEFAULT NULL,
  `card_code` varchar(50) DEFAULT NULL,
  `card_number` varchar(50) DEFAULT NULL,
  `card_cvv` varchar(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Restore order data
INSERT INTO `orders` (`id`, `full_name`, `email`, `address`, `phone_number`, `payment_method`, `status`, `total_amount`, `order_date`, `created_at`, `card_details`, `card_code`, `card_number`, `card_cvv`)
SELECT `id`, `full_name`, `email`, `address`, `phone_number`, `payment_method`,
  'delivered',
  0,
  `order_date`,
  COALESCE(`order_date`, CURRENT_TIMESTAMP),
  `card_details`,
  `card_code`,
  `card_number`,
  `card_cvv`
FROM `orders_backup`;

-- Clean up backup tables
DROP TABLE IF EXISTS `categories_backup`;
DROP TABLE IF EXISTS `products_backup`;
DROP TABLE IF EXISTS `orders_backup`;

-- Create new tables needed by admin portal

-- Discounts table
CREATE TABLE IF NOT EXISTS `discounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `type` varchar(20) NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `usage_limit` int NOT NULL DEFAULT 0,
  `used` int NOT NULL DEFAULT 0,
  `category` varchar(50) DEFAULT NULL,
  `description` text,
  `minimum_purchase` decimal(10,2) NOT NULL DEFAULT 0,
  `valid_until` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Order items table
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `product_name` varchar(150) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Purchase orders table
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `po_number` varchar(50) NOT NULL,
  `supplier_name` varchar(150) DEFAULT NULL,
  `destination` varchar(150) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'draft',
  `expected_arrival` date DEFAULT NULL,
  `payment_terms` varchar(100) DEFAULT NULL,
  `supplier_currency` varchar(50) DEFAULT NULL,
  `shipping_carrier` varchar(100) DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `po_number` (`po_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Purchase order items table
CREATE TABLE IF NOT EXISTS `purchase_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchase_order_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `product_name` varchar(150) NOT NULL,
  `supplier_sku` varchar(100) DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT 1,
  `cost` decimal(10,2) NOT NULL DEFAULT 0,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 0,
  `total` decimal(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_po_items_po` (`purchase_order_id`),
  CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Inventory adjustments table
CREATE TABLE IF NOT EXISTS `inventory_adjustments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `change_amount` int NOT NULL,
  `reason` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `inventory_adjustments_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Add telegram bot columns to users table
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `telegram_id` BIGINT DEFAULT NULL UNIQUE,
ADD COLUMN IF NOT EXISTS `phone_number` VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `address` TEXT DEFAULT NULL;

-- Update existing data to have proper stock values
UPDATE `products` SET `stock` = `quantity` WHERE `stock` IS NULL OR `stock` = 0;
UPDATE `products` SET `is_available` = 1 WHERE `is_available` IS NULL;

-- Insert sample discounts
INSERT IGNORE INTO `discounts` (`code`, `type`, `value`, `usage_limit`, `used`, `category`, `description`, `minimum_purchase`, `valid_until`, `is_active`) VALUES
('WELCOME10', 'percentage', 10.00, 100, 0, 'new_users', 'Welcome discount for new customers', 0.00, '2025-12-31', 1),
('SUMMER20', 'percentage', 20.00, 0, 0, 'seasonal', 'Summer sale 20% off', 50.00, '2025-08-31', 1),
('BULK5OFF', 'fixed', 5.00, 200, 0, 'bulk', 'SGD 5 off on bulk orders', 100.00, '2025-06-30', 1);

SELECT 'Migration completed successfully!' AS status;
