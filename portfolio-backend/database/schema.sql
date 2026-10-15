-- Explicit one-time schema provisioning for the FastAPI portfolio backend.
-- Derived from app/models SQLAlchemy metadata using the MySQL dialect.
-- Safe for an empty database; CREATE TABLE IF NOT EXISTS does not migrate
-- tables that already exist. Review existing databases before applying.

CREATE DATABASE IF NOT EXISTS `portfolio_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `portfolio_db`;

CREATE TABLE IF NOT EXISTS `achievements` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `short_description` VARCHAR(500) NULL,
  `description` TEXT NULL,
  `image` VARCHAR(2048) NULL,
  `link` VARCHAR(2048) NULL,
  `date` DATE NULL,
  `featured` BOOLEAN NOT NULL DEFAULT 0,
  `display_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT now(),
  `updated_at` DATETIME NOT NULL DEFAULT now(),
  PRIMARY KEY (`id`),
  INDEX `ix_achievements_featured_display_order` (`featured`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `certificates` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `issuer` VARCHAR(255) NULL,
  `issue_date` DATE NULL,
  `credential_url` VARCHAR(2048) NULL,
  `certificate_image` VARCHAR(2048) NULL,
  `certificate_file` VARCHAR(2048) NULL,
  `description` TEXT NULL,
  `featured` BOOLEAN NOT NULL DEFAULT 0,
  `display_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT now(),
  `updated_at` DATETIME NOT NULL DEFAULT now(),
  PRIMARY KEY (`id`),
  INDEX `ix_certificates_featured_display_order` (`featured`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `experiences` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `company` VARCHAR(255) NOT NULL,
  `role` VARCHAR(255) NOT NULL,
  `company_logo` VARCHAR(2048) NULL,
  `location` VARCHAR(255) NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `currently_working` BOOLEAN NOT NULL DEFAULT 0,
  `short_description` VARCHAR(500) NULL,
  `description` TEXT NULL,
  `featured` BOOLEAN NOT NULL DEFAULT 0,
  `display_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT now(),
  `updated_at` DATETIME NOT NULL DEFAULT now(),
  PRIMARY KEY (`id`),
  INDEX `ix_experiences_featured_display_order` (`featured`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `media` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `file_url` VARCHAR(2048) NOT NULL,
  `public_id` VARCHAR(255) NULL,
  `file_type` VARCHAR(50) NOT NULL,
  `alt_text` VARCHAR(500) NULL,
  `created_at` DATETIME NOT NULL DEFAULT now(),
  `updated_at` DATETIME NOT NULL DEFAULT now(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `profiles` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `headline` VARCHAR(255) NULL,
  `short_bio` VARCHAR(500) NULL,
  `full_bio` TEXT NULL,
  `profile_image` VARCHAR(2048) NULL,
  `location` VARCHAR(255) NULL,
  `email` VARCHAR(320) NULL,
  `resume_url` VARCHAR(2048) NULL,
  `created_at` DATETIME NOT NULL DEFAULT now(),
  `updated_at` DATETIME NOT NULL DEFAULT now(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `short_description` VARCHAR(500) NULL,
  `description` TEXT NULL,
  `cover_image` VARCHAR(2048) NULL,
  `github_url` VARCHAR(2048) NULL,
  `live_url` VARCHAR(2048) NULL,
  `featured` BOOLEAN NOT NULL DEFAULT 0,
  `display_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT now(),
  `updated_at` DATETIME NOT NULL DEFAULT now(),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ix_projects_slug` (`slug`),
  INDEX `ix_projects_featured_display_order` (`featured`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `skill_categories` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `display_order` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `social_links` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `platform` VARCHAR(100) NOT NULL,
  `url` VARCHAR(2048) NOT NULL,
  `icon` VARCHAR(2048) NULL,
  `display_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT now(),
  `updated_at` DATETIME NOT NULL DEFAULT now(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT now(),
  `updated_at` DATETIME NOT NULL DEFAULT now(),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ix_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `skills` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `category_id` INTEGER NOT NULL,
  `icon` VARCHAR(2048) NULL,
  `display_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT now(),
  `updated_at` DATETIME NOT NULL DEFAULT now(),
  PRIMARY KEY (`id`),
  CONSTRAINT `uq_skills_category_name` UNIQUE (`category_id`, `name`),
  INDEX `ix_skills_category_display_order` (`category_id`, `display_order`),
  FOREIGN KEY (`category_id`) REFERENCES `skill_categories` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Section registry for the dynamic portfolio section builder.
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
  UNIQUE INDEX `uq_portfolio_sections_key` (`section_key`),
  UNIQUE INDEX `uq_portfolio_sections_slug` (`slug`),
  UNIQUE INDEX `uq_portfolio_sections_title` (`title`),
  INDEX `ix_portfolio_sections_home` (`status`, `enabled`, `show_on_homepage`, `display_order`),
  INDEX `ix_portfolio_sections_full` (`status`, `enabled`, `show_on_full_page`, `display_order`),
  CONSTRAINT `ck_portfolio_sections_type` CHECK (`section_type` IN ('built_in', 'custom')),
  CONSTRAINT `ck_portfolio_sections_status` CHECK (`status` IN ('draft', 'published', 'archived')),
  CONSTRAINT `ck_portfolio_sections_layout` CHECK (`layout_variant` IN ('standard', 'cards', 'split', 'editorial', 'full_width'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Idempotent built-in registry entries reference existing content; they do not copy or delete it.
INSERT INTO `portfolio_sections` (`section_key`, `slug`, `section_type`, `title`, `enabled`, `status`, `display_order`, `show_on_homepage`, `show_on_full_page`, `read_more_enabled`, `layout_variant`, `content_blocks`, `custom_fields`, `custom_field_values`)
SELECT seed.section_key, seed.slug, 'built_in', seed.title, 1, 'published', seed.display_order, 1, 1, seed.read_more_enabled, 'standard', JSON_ARRAY(), JSON_ARRAY(), JSON_OBJECT()
FROM (
  SELECT 'profile' section_key, 'about' slug, 'About' title, 0 display_order, 1 read_more_enabled UNION ALL
  SELECT 'experience', 'experience', 'Experience', 1, 0 UNION ALL
  SELECT 'projects', 'projects', 'Projects', 2, 0 UNION ALL
  SELECT 'skills', 'skills', 'Skills', 3, 0 UNION ALL
  SELECT 'certificates', 'certificates', 'Certificates', 4, 0 UNION ALL
  SELECT 'achievements', 'achievements', 'Achievements', 5, 0 UNION ALL
  SELECT 'social_links', 'social-links', 'Social Links', 6, 0 UNION ALL
  SELECT 'contact', 'contact', 'Contact', 7, 0
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM `portfolio_sections` existing WHERE existing.section_key = seed.section_key);
