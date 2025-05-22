// Migration: Create Quiz Answers Table
import { query } from "@/db/database.ts";

export async function up() {
  // Create quiz_answers table
  const sql = `
    CREATE TABLE IF NOT EXISTS quiz_answers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question_id UUID NOT NULL,
      answer_text TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL DEFAULT false,
      explanation TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
    );

    -- Create index on question_id for faster lookups
    CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);
    
    -- Create index on is_correct for filtering correct answers
    CREATE INDEX IF NOT EXISTS idx_quiz_answers_is_correct ON quiz_answers(is_correct);
  `;

  await query(sql);
}

export async function down() {
  // Drop quiz_answers table
  const sql = `
    DROP TABLE IF EXISTS quiz_answers;
  `;

  await query(sql);
}