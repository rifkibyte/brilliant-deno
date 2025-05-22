// Migration: Create Courses Table
import { query } from "../database.ts";

export async function up() {
  // Create courses table
  const sql = `
    CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      thumbnail VARCHAR(255),
      creator_id UUID NOT NULL REFERENCES users(id),
      is_published BOOLEAN NOT NULL DEFAULT false,
      difficulty VARCHAR(20) NOT NULL DEFAULT 'BEGINNER',
      estimated_hours INTEGER,
      category VARCHAR(100) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      published_at TIMESTAMP,
      version INTEGER NOT NULL DEFAULT 1
    );

    -- Create index on creator_id for faster lookups
    CREATE INDEX IF NOT EXISTS idx_courses_creator_id ON courses(creator_id);
    
    -- Create index on category
    CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
    
    -- Create index on is_published for filtering published courses
    CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
  `;

  await query(sql);
}

export async function down() {
  // Drop courses table
  const sql = `
    DROP TABLE IF EXISTS courses;
  `;

  await query(sql);
}