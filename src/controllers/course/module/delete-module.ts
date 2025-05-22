// Controller for module operations
import { Context, z } from "~/deps.ts";
import { query } from "../../db/database.ts";
import { sendError, sendForbidden, sendNotFound, sendSuccess } from "../../utils/response.util.ts";

// Delete module
export async function deleteModule(ctx: Context) {
  try {
    const moduleId = ctx.params.id;
    const userId = ctx.state.user.id;

    // Check if module exists and user has permission
    const moduleCheck = await query(
      `SELECT m.id, m.title, c.created_by 
       FROM modules m
       JOIN courses c ON m.course_id = c.id
       WHERE m.id = $1`,
      [moduleId],
    );

    if (moduleCheck.rowCount === 0) {
      return sendNotFound(ctx, "Module not found");
    }

    // Check if user is the course creator
    if (moduleCheck.rows[0].created_by !== userId) {
      return sendForbidden(
        ctx,
        "You don't have permission to delete this module",
      );
    }

    // Delete the module (cascade will handle lessons)
    const result = await query(
      "DELETE FROM modules WHERE id = $1 RETURNING id",
      [moduleId],
    );

    if (result.rowCount === 0) {
      return sendError(ctx, "Failed to delete module", 500);
    }

    return sendSuccess(
      ctx,
      { id: moduleId },
      `Module "${moduleCheck.rows[0].title}" deleted successfully`,
    );
  } catch (error) {
    console.error("Error deleting module:", error);
    return sendError(ctx, "Failed to delete module");
  }
}
