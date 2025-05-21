// Migration: Create Lesson Progress Table
import { query } from "@/db/database.ts";

export async function up() {
  // Create lesson_progress table
  const sql = `
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      lesson_id UUID NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
      completion_percentage DECIMAL(5,2) DEFAULT 0.00,
      last_accessed_at TIMESTAMP,
      completed_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
      UNIQUE(user_id, lesson_id)
    );

    -- Create index on user_id for user's progress
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
    
    -- Create index on lesson_id for lesson's progress
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
    
    -- Create composite index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson ON lesson_progress(user_id, lesson_id);
    
    -- Create index on status for filtering by progress status
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_status ON lesson_progress(status);
  `;

  await query(sql);
}

export async function down() {
  // Drop lesson_progress table
  const sql = `
    DROP TABLE IF EXISTS lesson_progress;
  `;

  await query(sql);
}