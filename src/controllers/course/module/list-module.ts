// Controller for module operations
import { Context, z } from "~/deps.ts";
import { query } from "../../db/database.ts";
import { sendError, sendNotFound, sendSuccess } from "../../utils/response.util.ts";

// List modules for a course
export async function listModules(ctx: Context) {
  try {
    const courseId = ctx.params.courseId;

    // Check if course exists
    const courseCheck = await query("SELECT id FROM courses WHERE id = $1", [
      courseId,
    ]);

    if (courseCheck.rowCount === 0) {
      return sendNotFound(ctx, "Course not found");
    }

    // Get modules for this course
    const modulesResult = await query(
      `SELECT * FROM modules 
       WHERE course_id = $1
       ORDER BY position ASC`,
      [courseId],
    );

    return sendSuccess(
      ctx,
      modulesResult.rows,
      "Modules retrieved successfully",
    );
  } catch (error) {
    console.error("Error listing modules:", error);
    return sendError(ctx, "Failed to list modules");
  }
}
