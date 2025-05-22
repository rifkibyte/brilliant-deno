// Migration: Create User Quiz Attempts Table
import { query } from "@/db/database.ts";

export async function up() {
  // Create user_quiz_attempts table
  const sql = `
    CREATE TABLE IF NOT EXISTS user_quiz_attempts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      quiz_id UUID NOT NULL,
      score INTEGER NOT NULL,
      passed BOOLEAN NOT NULL,
      started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    -- Create index on user_id for user's quiz attempts
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON user_quiz_attempts(user_id);
    
    -- Create index on quiz_id for quiz's attempts
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON user_quiz_attempts(quiz_id);
    
    -- Create composite index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON user_quiz_attempts(user_id, quiz_id);
    
    -- Create index on passed for filtering passed/failed attempts
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_passed ON user_quiz_attempts(passed);
  `;

  await query(sql);
}

export async function down() {
  // Drop user_quiz_attempts table
  const sql = `
    DROP TABLE IF EXISTS user_quiz_attempts;
  `;

  await query(sql);
}