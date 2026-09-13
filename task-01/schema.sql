-- Create the database if it doesn't exist
DROP DATABASE IF EXISTS `techloom_pos`;
CREATE DATABASE IF NOT EXISTS `techloom_pos`;
USE `techloom_pos`;

-- 1. Create `products` table
CREATE TABLE IF NOT EXISTS `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `stock` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Create `orders` table
CREATE TABLE IF NOT EXISTS `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('Pending', 'Reserved', 'Paid', 'Cancelled', 'Expired', 'Failed') NOT NULL DEFAULT 'Pending',
    `card_number` VARCHAR(16) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Create `order_items` table
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `quantity` INT NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
);

-- 4. Insert sample products
INSERT INTO `products` (`name`, `price`, `stock`) VALUES
('Wireless Mouse', 3500.00, 10),
('Mechanical Keyboard', 12500.00, 5),
('HD Monitor 24"', 45000.00, 3),
('USB-C Hub', 6500.00, 15),
('Noise Cancelling Headphones', 18000.00, 8);
