// Migration: Create Modules Table
import { query } from "../database.ts";

export async function up() {
  // Create modules table
  const sql = `
    CREATE TABLE IF NOT EXISTS modules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      position INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    -- Create index on course_id for faster lookups
    CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
    
    -- Create index on position for ordering
    CREATE INDEX IF NOT EXISTS idx_modules_position ON modules(position);
  `;

  await query(sql);
}

export async function down() {
  // Drop modules table
  const sql = `
    DROP TABLE IF EXISTS modules;
  `;

  await query(sql);
}