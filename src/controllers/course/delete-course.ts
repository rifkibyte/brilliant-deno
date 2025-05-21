// Controller for deleting a course
import { Context } from "../../deps.ts";
import { query } from "../../db/database.ts";
import { sendNotFound, sendSuccess, sendForbidden, sendError } from "../../utils/response.util.ts";

export async function deleteCourse(ctx: Context) {
  try {
    const courseId = ctx.params.id;
    const userId = ctx.state.user.id;
    const userRole = ctx.state.user.role;
    
    // Check if course exists and if user has permission to delete it
    const courseCheck = await query(
      "SELECT created_by FROM courses WHERE id = $1",
      [courseId]
    );
    
    if (courseCheck.rowCount === 0) {
      return sendNotFound(ctx, "Course not found");
    }
    
    // Check if user is the creator or an admin
    const isCreator = courseCheck.rows[0].created_by === userId;
    const isAdmin = userRole === "ADMIN";
    
    if (!isCreator && !isAdmin) {
      return sendForbidden(ctx, "You don't have permission to delete this course");
    }
    
    // Delete the course (cascade will handle related records)
    const result = await query(
      "DELETE FROM courses WHERE id = $1 RETURNING id, title",
      [courseId]
    );
    
    if (result.rowCount === 0) {
      return sendError(ctx, "Failed to delete course", 500);
    }
    
    return sendSuccess(ctx, { id: result.rows[0].id }, `Course "${result.rows[0].title}" deleted successfully`);
  } catch (error) {
    console.error("Error deleting course:", error);
    return sendError(ctx, "Failed to delete course");
  }
}