import { Pool, log } from "../../deps.ts";
import { config } from "../config/config.ts";

// Create a connection pool to PostgreSQL
const POOL_CONNECTIONS = config.DB.POOL_SIZE;
const logger = log.getLogger();

let pool: Pool | null = null;

export async function initDb(): Promise<void> {
  try {
    pool = new Pool({
      hostname: config.DB.HOST,
      port: config.DB.PORT,
      user: config.DB.USER,
      password: config.DB.PASSWORD,
      database: config.DB.DATABASE,
    }, POOL_CONNECTIONS);
    
    // Test the connection
    const client = await pool.connect();
    const result = await client.queryObject`SELECT 1 as connected`;
    client.release();
    
    if (result.rows[0].connected === 1) {
      logger.info("Successfully connected to PostgreSQL database");
    }
  } catch (error) {
    logger.error(`Failed to connect to PostgreSQL: ${error.message}`);
    throw error;
  }
}

export async function getPool(): Promise<Pool> {
  if (!pool) {
    await initDb();
  }
  return pool!;
}

export async function query(sql: string, params: any[] = []): Promise<any> {
  const client = await (await getPool()).connect();
  try {
    const result = await client.queryObject(sql, params);
    return result;
  } catch (error) {
    logger.error(`Database query error: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await (await getPool()).connect();
  try {
    await client.queryObject("BEGIN");
    const result = await callback(client);
    await client.queryObject("COMMIT");
    return result;
  } catch (error) {
    await client.queryObject("ROLLBACK");
    logger.error(`Transaction error: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}