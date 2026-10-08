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
