import { log, dotenvConfig } from "./deps.ts";
import { app } from "./src/app.ts";
import { config } from "./src/config/config.ts";

// Load environment variables
await dotenvConfig({ export: true, path: "./.env" });

// Configure logging
log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG"),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});

const logger = log.getLogger();

// Start the server
const port = config.PORT;
logger.info(`Server starting on port ${port}...`);

try {
  await app.listen({ port });
} catch (error) {
  logger.error(`Error starting server: ${error.message}`);
  Deno.exit(1);
}