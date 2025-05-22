// Migration: Create Modules Table
import { query } from "../database.ts";

export async function up() {
  // Create modules table
  const sql = `
    CREATE TABLE IF NOT EXISTS modules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Create index on course_id for faster lookups
    CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
    
    -- Create index on order_index for sorting
    CREATE INDEX IF NOT EXISTS idx_modules_order_index ON modules(order_index);
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