import { initDb } from "../database.ts";
import { query } from "../database.ts";
import { config } from "../../config/config.ts";
import { up as createUsersTable } from "./20250514082700_create_users_table.ts";

/**
 * Database initialization script
 * This script initializes the database and runs all migrations
 */
async function initializeDatabase() {
  console.log("Initializing database...");

  try {
    // Initialize the database connection
    await initDb();
    console.log("Database connection established.");

    // Create extensions if they don't exist
    console.log("Setting up database extensions...");
    await query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    `);

    // Create the migrations table if it doesn't exist
    console.log("Setting up migrations table...");
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if users table migration has been applied
    const migrationExists = await query(
      "SELECT id FROM migrations WHERE name = $1",
      ["20250514082700_create_users_table.ts"]
    );

    if (migrationExists.rows.length === 0) {
      console.log("Creating users table...");
      // Run the users table migration
      await createUsersTable();
      
      // Record the migration as applied
      await query(
        "INSERT INTO migrations (name) VALUES ($1)",
        ["20250514082700_create_users_table.ts"]
      );
      console.log("Users table created successfully.");
    } else {
      console.log("Users table already exists.");
    }

    console.log("Database initialization completed successfully.");
    console.log("");
    console.log("To run additional migrations, use:");
    console.log("  deno task migrate:up");
    console.log("");
    console.log("Database is ready for use!");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    Deno.exit(1);
  }
}

// Run the initialization if this file is executed directly
if (import.meta.main) {
  initializeDatabase();
}