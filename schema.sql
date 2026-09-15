-- ============================================================
-- ClearSync database schema
-- Run this whole file in MySQL Workbench (File > Open SQL Script,
-- then the lightning-bolt "Execute" button), or paste it into a
-- new query tab against your local server and execute it.
--
-- Safe to re-run: every statement below checks for existence
-- first, so running this script again on a database that
-- already has these tables/columns/indexes will NOT throw errors.
-- ============================================================

CREATE DATABASE IF NOT EXISTS clearsync
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE clearsync;

-- One row per registered student.
CREATE TABLE IF NOT EXISTS students (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      VARCHAR(20)  NOT NULL UNIQUE,   -- what they type at login
    first_name      VARCHAR(100) NOT NULL,
    middle_name     VARCHAR(100) NULL,
    last_name       VARCHAR(100) NOT NULL,
    department      VARCHAR(10)  NOT NULL,          -- CETE / CTE / CBMA / CCJE
    year_level      VARCHAR(20)  NOT NULL DEFAULT '1st Year', -- 1st Year .. 5th Year
    region          VARCHAR(150) NULL,
    province        VARCHAR(150) NULL,
    city            VARCHAR(150) NULL,
    barangay        VARCHAR(150) NULL,
    zip             VARCHAR(4)   NULL,
    contact         VARCHAR(11)  NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,          -- bcrypt hash, never plain text
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- One row per (student, clearance office) pair. Created automatically
-- for all 10 offices the moment a student registers.
CREATE TABLE IF NOT EXISTS clearance (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    student_id   VARCHAR(20) NOT NULL,
    office       VARCHAR(150) NOT NULL,
    status       ENUM('Pending','Approved') NOT NULL DEFAULT 'Pending',
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_student_office (student_id, office),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- If "students" already existed from before this update (i.e.
-- it doesn't have a year_level column yet), add it now.
-- This lets you run this same script on your existing database
-- without dropping/losing any already-registered students.
-- ------------------------------------------------------------

DROP PROCEDURE IF EXISTS clearsync_add_year_level_column;

DELIMITER //
CREATE PROCEDURE clearsync_add_year_level_column()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'students'
          AND column_name = 'year_level'
    ) THEN
        ALTER TABLE students
            ADD COLUMN year_level VARCHAR(20) NOT NULL DEFAULT '1st Year' AFTER department;
    END IF;
END //
DELIMITER ;

CALL clearsync_add_year_level_column();
DROP PROCEDURE IF EXISTS clearsync_add_year_level_column;

-- ------------------------------------------------------------
-- Indexes below are wrapped in a small procedure so the script
-- can be re-run safely even on MySQL versions that don't
-- support "CREATE INDEX IF NOT EXISTS" (pre-8.0.29).
-- ------------------------------------------------------------

DROP PROCEDURE IF EXISTS clearsync_add_index_if_missing;

DELIMITER //
CREATE PROCEDURE clearsync_add_index_if_missing(
    IN idx_name   VARCHAR(64),
    IN tbl_name   VARCHAR(64),
    IN idx_sql    VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = tbl_name
          AND index_name = idx_name
    ) THEN
        SET @sql = idx_sql;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

CALL clearsync_add_index_if_missing(
    'idx_students_department', 'students',
    'CREATE INDEX idx_students_department ON students(department)'
);

CALL clearsync_add_index_if_missing(
    'idx_students_name', 'students',
    'CREATE INDEX idx_students_name ON students(last_name, first_name)'
);

DROP PROCEDURE IF EXISTS clearsync_add_index_if_missing;