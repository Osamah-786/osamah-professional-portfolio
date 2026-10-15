-- Apply once to an existing portfolio_db after reviewing the target database.
-- Creates the section registry and inserts missing built-in references only.
-- This does not update or delete existing portfolio content.

USE `portfolio_db`;

CREATE TABLE IF NOT EXISTS `portfolio_sections` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `section_key` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `section_type` VARCHAR(20) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT 1,
  `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
  `display_order` INTEGER NOT NULL DEFAULT 0,
  `show_on_homepage` BOOLEAN NOT NULL DEFAULT 1,
  `show_on_full_page` BOOLEAN NOT NULL DEFAULT 1,
  `short_description` VARCHAR(500) NULL,
  `long_description` TEXT NULL,
  `read_more_enabled` BOOLEAN NOT NULL DEFAULT 0,
  `layout_variant` VARCHAR(24) NOT NULL DEFAULT 'standard',
  `cover_image` VARCHAR(2048) NULL,
  `cover_image_alt` VARCHAR(500) NULL,
  `seo_title` VARCHAR(200) NULL,
  `meta_description` VARCHAR(320) NULL,
  `canonical_slug` VARCHAR(150) NULL,
  `social_image` VARCHAR(2048) NULL,
  `content_blocks` JSON NOT NULL,
  `custom_fields` JSON NOT NULL,
  `custom_field_values` JSON NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_portfolio_sections_key` (`section_key`),
  UNIQUE KEY `uq_portfolio_sections_slug` (`slug`),
  UNIQUE KEY `uq_portfolio_sections_title` (`title`),
  CONSTRAINT `ck_portfolio_sections_type` CHECK (`section_type` IN ('built_in', 'custom')),
  CONSTRAINT `ck_portfolio_sections_status` CHECK (`status` IN ('draft', 'published', 'archived')),
  CONSTRAINT `ck_portfolio_sections_layout` CHECK (`layout_variant` IN ('standard', 'cards', 'split', 'editorial', 'full_width')),
  KEY `ix_portfolio_sections_home` (`status`, `enabled`, `show_on_homepage`, `display_order`),
  KEY `ix_portfolio_sections_full` (`status`, `enabled`, `show_on_full_page`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `portfolio_sections`
  (`section_key`, `slug`, `section_type`, `title`, `enabled`, `status`, `display_order`,
   `show_on_homepage`, `show_on_full_page`, `read_more_enabled`, `layout_variant`,
   `content_blocks`, `custom_fields`, `custom_field_values`)
SELECT 'profile', 'about', 'built_in', 'Profile', 1, 'published', 0, 1, 1, 1, 'standard',
       JSON_ARRAY(), JSON_ARRAY(), JSON_OBJECT()
WHERE NOT EXISTS (SELECT 1 FROM `portfolio_sections` WHERE `section_key` = 'profile' OR `slug` = 'about');

INSERT INTO `portfolio_sections`
  (`section_key`, `slug`, `section_type`, `title`, `enabled`, `status`, `display_order`,
   `show_on_homepage`, `show_on_full_page`, `read_more_enabled`, `layout_variant`,
   `content_blocks`, `custom_fields`, `custom_field_values`)
SELECT 'experience', 'experience', 'built_in', 'Experience', 1, 'published', 1, 1, 1, 0, 'standard',
       JSON_ARRAY(), JSON_ARRAY(), JSON_OBJECT()
WHERE NOT EXISTS (SELECT 1 FROM `portfolio_sections` WHERE `section_key` = 'experience' OR `slug` = 'experience');

INSERT INTO `portfolio_sections`
  (`section_key`, `slug`, `section_type`, `title`, `enabled`, `status`, `display_order`,
   `show_on_homepage`, `show_on_full_page`, `read_more_enabled`, `layout_variant`,
   `content_blocks`, `custom_fields`, `custom_field_values`)
SELECT 'projects', 'projects', 'built_in', 'Projects', 1, 'published', 2, 1, 1, 0, 'cards',
       JSON_ARRAY(), JSON_ARRAY(), JSON_OBJECT()
WHERE NOT EXISTS (SELECT 1 FROM `portfolio_sections` WHERE `section_key` = 'projects' OR `slug` = 'projects');

INSERT INTO `portfolio_sections`
  (`section_key`, `slug`, `section_type`, `title`, `enabled`, `status`, `display_order`,
   `show_on_homepage`, `show_on_full_page`, `read_more_enabled`, `layout_variant`,
   `content_blocks`, `custom_fields`, `custom_field_values`)
SELECT 'skills', 'skills', 'built_in', 'Skills', 1, 'published', 3, 1, 1, 0, 'standard',
       JSON_ARRAY(), JSON_ARRAY(), JSON_OBJECT()
WHERE NOT EXISTS (SELECT 1 FROM `portfolio_sections` WHERE `section_key` = 'skills' OR `slug` = 'skills');

INSERT INTO `portfolio_sections`
  (`section_key`, `slug`, `section_type`, `title`, `enabled`, `status`, `display_order`,
   `show_on_homepage`, `show_on_full_page`, `read_more_enabled`, `layout_variant`,
   `content_blocks`, `custom_fields`, `custom_field_values`)
SELECT 'certificates', 'certificates', 'built_in', 'Certificates', 1, 'published', 4, 1, 1, 0, 'cards',
       JSON_ARRAY(), JSON_ARRAY(), JSON_OBJECT()
WHERE NOT EXISTS (SELECT 1 FROM `portfolio_sections` WHERE `section_key` = 'certificates' OR `slug` = 'certificates');

INSERT INTO `portfolio_sections`
  (`section_key`, `slug`, `section_type`, `title`, `enabled`, `status`, `display_order`,
   `show_on_homepage`, `show_on_full_page`, `read_more_enabled`, `layout_variant`,
   `content_blocks`, `custom_fields`, `custom_field_values`)
SELECT 'achievements', 'achievements', 'built_in', 'Achievements', 1, 'published', 5, 1, 1, 0, 'cards',
       JSON_ARRAY(), JSON_ARRAY(), JSON_OBJECT()
WHERE NOT EXISTS (SELECT 1 FROM `portfolio_sections` WHERE `section_key` = 'achievements' OR `slug` = 'achievements');

INSERT INTO `portfolio_sections`
  (`section_key`, `slug`, `section_type`, `title`, `enabled`, `status`, `display_order`,
   `show_on_homepage`, `show_on_full_page`, `read_more_enabled`, `layout_variant`,
   `content_blocks`, `custom_fields`, `custom_field_values`)
SELECT 'social_links', 'social-links', 'built_in', 'Social links', 1, 'published', 6, 1, 1, 0, 'standard',
       JSON_ARRAY(), JSON_ARRAY(), JSON_OBJECT()
WHERE NOT EXISTS (SELECT 1 FROM `portfolio_sections` WHERE `section_key` = 'social_links' OR `slug` = 'social-links');

INSERT INTO `portfolio_sections`
  (`section_key`, `slug`, `section_type`, `title`, `enabled`, `status`, `display_order`,
   `show_on_homepage`, `show_on_full_page`, `read_more_enabled`, `layout_variant`,
   `content_blocks`, `custom_fields`, `custom_field_values`)
SELECT 'contact', 'contact', 'built_in', 'Contact', 1, 'published', 7, 1, 1, 0, 'standard',
       JSON_ARRAY(), JSON_ARRAY(), JSON_OBJECT()
WHERE NOT EXISTS (SELECT 1 FROM `portfolio_sections` WHERE `section_key` = 'contact' OR `slug` = 'contact');
