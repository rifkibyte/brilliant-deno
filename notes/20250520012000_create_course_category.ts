// Migration: Create User Quiz Attempts Table
import { query } from "@/db/database.ts";

export async function up() {
  // Create user_quiz_attempts table
  const sql = `
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      parent_id UUID,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
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
