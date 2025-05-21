// Migration: Create Course Enrollments Table
import { query } from "../database.ts";

export async function up() {
  // Create course_enrollments table
  const sql = `
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      course_id UUID NOT NULL,
      enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      last_accessed_at TIMESTAMP,
      progress_percentage DECIMAL(5,2) DEFAULT 0.00,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(user_id, course_id)
    );

    -- Create index on user_id for user's enrollments
    CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON course_enrollments(user_id);
    
    -- Create index on course_id for course's enrollments
    CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON course_enrollments(course_id);
    
    -- Create composite index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON course_enrollments(user_id, course_id);
  `;

  await query(sql);
}

export async function down() {
  // Drop course_enrollments table
  const sql = `
    DROP TABLE IF EXISTS course_enrollments;
  `;

  await query(sql);
}