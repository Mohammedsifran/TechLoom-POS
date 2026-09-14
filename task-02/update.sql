USE `techloom_pos`;
ALTER TABLE `orders` ADD COLUMN `card_number` VARCHAR(16) NULL AFTER `status`;
