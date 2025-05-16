// Migration: Create Users Table
import { query } from "../database.ts";

export async function up() {
  // Create users table
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'USER',
      profile_picture VARCHAR(255),
      google_id VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP,
      is_active BOOLEAN NOT NULL DEFAULT true,
      is_email_verified BOOLEAN NOT NULL DEFAULT false,
      verification_token VARCHAR(255),
      verification_expires TIMESTAMP,
      password_reset_token VARCHAR(255),
      password_reset_expires TIMESTAMP
    );

    -- Create index on email for faster lookups
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    
    -- Create index on google_id
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    
    -- Create index on role for role-based queries
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `;

  await query(sql);
}

export async function down() {
  // Drop users table
  const sql = `
    DROP TABLE IF EXISTS users;
  `;

  await query(sql);
}
