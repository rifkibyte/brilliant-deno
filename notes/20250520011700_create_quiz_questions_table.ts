// Migration: Create Quiz Questions Table
import { query } from "@/db/database.ts";

export async function up() {
  // Create quiz_questions table
  const sql = `
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quiz_id UUID NOT NULL,
      question_text TEXT NOT NULL,
      question_type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'true_false', 'fill_blank', 'interactive'
      points INTEGER NOT NULL DEFAULT 1,
      position INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    -- Create index on quiz_id for faster lookups
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
    
    -- Create index on position for ordering
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_position ON quiz_questions(position);
    
    -- Create index on question_type for filtering by question type
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_type ON quiz_questions(question_type);
  `;

  await query(sql);
}

export async function down() {
  // Drop quiz_questions table
  const sql = `
    DROP TABLE IF EXISTS quiz_questions;
  `;

  await query(sql);
}