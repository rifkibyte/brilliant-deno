// Migration: Create Quizzes Table
import { query } from "@/db/database.ts";

export async function up() {
  // Create quizzes table
  const sql = `
    CREATE TABLE IF NOT EXISTS quizzes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lesson_id UUID NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      passing_score INTEGER NOT NULL DEFAULT 70,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    -- Create index on lesson_id for faster lookups
    CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id);
  `;

  await query(sql);
}

export async function down() {
  // Drop quizzes table
  const sql = `
    DROP TABLE IF EXISTS quizzes;
  `;

  await query(sql);
}