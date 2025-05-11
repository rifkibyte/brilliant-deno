import { redisConnect, Redis, log } from "../../deps.ts";
import { config } from "../config/config.ts";

let redisClient: Redis | null = null;
const logger = log.getLogger();

export async function initRedis(): Promise<void> {
  try {
    redisClient = await redisConnect({
      hostname: config.REDIS.HOST,
      port: config.REDIS.PORT,
      password: config.REDIS.PASSWORD || undefined,
    });
    
    // Test the connection
    await redisClient.ping();
    logger.info("Successfully connected to Redis");
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${error.message}`);
    throw error;
  }
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error("Redis client not initialized");
  }
  return redisClient;
}

// Helper functions for common Redis operations

export async function setCache(key: string, value: string, expireSeconds?: number): Promise<void> {
  const redis = getRedisClient();
  if (expireSeconds) {
    await redis.set(key, value, { ex: expireSeconds });
  } else {
    await redis.set(key, value);
  }
}

export async function getCache(key: string): Promise<string | null> {
  const redis = getRedisClient();
  return await redis.get(key);
}

export async function deleteCache(key: string): Promise<number> {
  const redis = getRedisClient();
  return await redis.del(key);
}

export async function setHashCache(key: string, field: string, value: string): Promise<number> {
  const redis = getRedisClient();
  return await redis.hset(key, field, value);
}

export async function getHashCache(key: string, field: string): Promise<string | null> {
  const redis = getRedisClient();
  return await redis.hget(key, field);
}

export async function incrementCounter(key: string, increment = 1): Promise<number> {
  const redis = getRedisClient();
  return await redis.incrby(key, increment);
}

export async function setExpiry(key: string, seconds: number): Promise<boolean> {
  const redis = getRedisClient();
  return await redis.expire(key, seconds) === 1;
}