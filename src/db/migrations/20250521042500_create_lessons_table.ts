// Migration: Create Lessons Table
import { query } from "../database.ts";

export async function up() {
  // Create lessons table
  const sql = `
    CREATE TABLE IF NOT EXISTS lessons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      content_type VARCHAR(50) NOT NULL DEFAULT 'TEXT',
      order_index INTEGER NOT NULL DEFAULT 0,
      estimated_minutes INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Create index on module_id for faster lookups
    CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
    
    -- Create index on order_index for sorting
    CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(order_index);
  `;

  await query(sql);
}

export async function down() {
  // Drop lessons table
  const sql = `
    DROP TABLE IF EXISTS lessons;
  `;

  await query(sql);
}