// Migration: Create Courses Table
import { query } from "../database.ts";

export async function up() {
  // Create courses table
  const sql = `
    CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      thumbnail_url VARCHAR(255),
      difficulty_level VARCHAR(50) NOT NULL, -- 'beginner', 'intermediate', 'advanced'
      category_id UUID NOT NULL,
      created_by UUID NOT NULL,
      is_published BOOLEAN DEFAULT false,
      is_featured BOOLEAN DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      estimated_duration INTEGER, -- in minutes
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    -- Create index on slug for faster lookups and URL routing
    CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
    
    -- Create index on category_id for category filtering
    CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses(category_id);
    
    -- Create index on created_by for author filtering
    CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
    
    -- Create index on is_published and is_featured for common queries
    CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
    CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(is_featured);
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
