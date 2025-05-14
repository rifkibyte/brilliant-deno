import { query } from "../database.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

// Ensure the migrations table exists
async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Get all applied migrations from the database
async function getAppliedMigrations(): Promise<string[]> {
  const result = await query("SELECT name FROM migrations ORDER BY id ASC");
  return result.rows.map((row) => row.name);
}

// Get all migration files from the migrations directory
async function getMigrationFiles(): Promise<string[]> {
  const migrationDir = join(Deno.cwd(), "src", "db", "migrations");
  const files: string[] = [];
  
  for await (const dirEntry of Deno.readDir(migrationDir)) {
    if (dirEntry.isFile && dirEntry.name.endsWith(".ts") && 
        !dirEntry.name.endsWith("run.ts") && dirEntry.name.match(/^\d{14}_/)) {
      files.push(dirEntry.name);
    }
  }
  
  return files.sort();
}

// Run migrations
async function runMigrations(direction: "up" | "down") {
  await ensureMigrationsTable();
  
  const appliedMigrations = await getAppliedMigrations();
  const migrationFiles = await getMigrationFiles();
  
  if (direction === "up") {
    console.log("Running pending migrations...");
    
    // Filter out already applied migrations
    const pendingMigrations = migrationFiles.filter(
      (file) => !appliedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log("No pending migrations to apply.");
      return;
    }
    
    // Apply each pending migration
    for (const migrationFile of pendingMigrations) {
      console.log(`Applying migration: ${migrationFile}`);
      
      const migrationPath = join(Deno.cwd(), "src", "db", "migrations", migrationFile);
      const migration = await import(`file://${migrationPath}`);
      
      try {
        await migration.up();
        await query("INSERT INTO migrations (name) VALUES ($1)", [migrationFile]);
        console.log(`Migration ${migrationFile} applied successfully.`);
      } catch (error) {
        console.error(`Failed to apply migration ${migrationFile}:`, error);
        throw error;
      }
    }
    
    console.log("All migrations applied successfully.");
  } else if (direction === "down") {
    console.log("Rolling back the most recent migration...");
    
    if (appliedMigrations.length === 0) {
      console.log("No migrations to roll back.");
      return;
    }
    
    // Get the most recently applied migration
    const lastMigration = appliedMigrations[appliedMigrations.length - 1];
    const migrationPath = join(Deno.cwd(), "src", "db", "migrations", lastMigration);
    
    try {
      const migration = await import(`file://${migrationPath}`);
      await migration.down();
      await query("DELETE FROM migrations WHERE name = $1", [lastMigration]);
      console.log(`Migration ${lastMigration} rolled back successfully.`);
    } catch (error) {
      console.error(`Failed to roll back migration ${lastMigration}:`, error);
      throw error;
    }
  }
}

// Create a new migration file
async function createMigration(name: string) {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
  const fileName = `${timestamp}_${name.toLowerCase().replace(/\s+/g, "_")}.ts`;
  const migrationPath = join(Deno.cwd(), "src", "db", "migrations", fileName);
  
  const template = `// Migration: ${name}

export async function up() {
  // Write your UP migration SQL here
  const sql = \`
    -- Add your SQL statements here
  \`;
  
  // Uncomment the line below and add your SQL
  // await query(sql);
}

export async function down() {
  // Write your DOWN migration SQL here (to undo the up migration)
  const sql = \`
    -- Add your rollback SQL statements here
  \`;
  
  // Uncomment the line below and add your SQL
  // await query(sql);
}
`;
  
  await Deno.writeTextFile(migrationPath, template);
  console.log(`Created new migration file: ${fileName}`);
}

// Main function
async function main() {
  const args = parse(Deno.args);
  const command = args._[0] as string;
  
  if (command === "up") {
    await runMigrations("up");
  } else if (command === "down") {
    await runMigrations("down");
  } else if (command === "create" && args._[1]) {
    await createMigration(args._[1] as string);
  } else {
    console.log(`
Usage:
  deno run --allow-net --allow-read --allow-env --allow-write src/db/migrations/run.ts up
  deno run --allow-net --allow-read --allow-env --allow-write src/db/migrations/run.ts down
  deno run --allow-net --allow-read --allow-env --allow-write src/db/migrations/run.ts create "migration name"
`);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}