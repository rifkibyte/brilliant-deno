import { Context, z } from "~/deps.ts";
import { query } from "../../db/database.ts";
import { sendError, sendNotFound, sendSuccess } from "../../utils/response.util.ts";

// Get module details
export async function getModuleById(ctx: Context) {
  try {
    const moduleId = ctx.params.id;

    // Get module details
    const moduleResult = await query("SELECT * FROM modules WHERE id = $1", [
      moduleId,
    ]);

    if (moduleResult.rowCount === 0) {
      return sendNotFound(ctx, "Module not found");
    }

    // Get lessons for this module
    const lessonsResult = await query(
      `SELECT * FROM lessons 
       WHERE module_id = $1
       ORDER BY position ASC`,
      [moduleId],
    );

    // Add lessons to module data
    const moduleData = {
      ...moduleResult.rows[0],
      lessons: lessonsResult.rows,
    };

    return sendSuccess(
      ctx,
      moduleData,
      "Module details retrieved successfully",
    );
  } catch (error) {
    console.error("Error getting module details:", error);
    return sendError(ctx, "Failed to get module details");
  }
}
