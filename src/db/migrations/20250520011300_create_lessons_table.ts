// Migration: Create Lessons Table
import { query } from "../database.ts";

export async function up() {
  // Create lessons table
  const sql = `
    CREATE TABLE IF NOT EXISTS lessons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      module_id UUID NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      position INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL, -- 'video', 'text', 'quiz', 'interactive'
      duration INTEGER, -- in minutes
      is_free BOOLEAN DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
    );

    -- Create index on module_id for faster lookups
    CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
    
    -- Create index on position for ordering
    CREATE INDEX IF NOT EXISTS idx_lessons_position ON lessons(position);
    
    -- Create index on type for filtering by lesson type
    CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(type);
    
    -- Create index on is_free for free content filtering
    CREATE INDEX IF NOT EXISTS idx_lessons_is_free ON lessons(is_free);
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