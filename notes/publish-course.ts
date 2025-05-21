// Controller for publishing/unpublishing a course
import { Context } from "../../deps.ts";
import { query } from "../../db/database.ts";
import { sendNotFound, sendSuccess, sendForbidden, sendError } from "../../utils/response.util.ts";

export async function publishCourse(ctx: Context) {
  try {
    const courseId = ctx.params.id;
    const userId = ctx.state.user.id;
    const userRole = ctx.state.user.role;
    
    // Check if course exists and if user has permission to publish it
    const courseCheck = await query(
      "SELECT created_by, is_published FROM courses WHERE id = $1",
      [courseId]
    );
    
    if (courseCheck.rowCount === 0) {
      return sendNotFound(ctx, "Course not found");
    }
    
    // Check if user is the creator or an admin
    const isCreator = courseCheck.rows[0].created_by === userId;
    const isAdmin = userRole === "ADMIN";
    
    if (!isCreator && !isAdmin) {
      return sendForbidden(ctx, "You don't have permission to publish this course");
    }
    
    // Check if course is already published
    if (courseCheck.rows[0].is_published) {
      return sendError(ctx, "Course is already published", 400);
    }
    
    // Update the course to published status
    const result = await query(
      `UPDATE courses SET 
        is_published = true, 
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [courseId]
    );
    
    return sendSuccess(ctx, result.rows[0], "Course published successfully");
  } catch (error) {
    console.error("Error publishing course:", error);
    return sendError(ctx, "Failed to publish course");
  }
}

export async function unpublishCourse(ctx: Context) {
  try {
    const courseId = ctx.params.id;
    const userId = ctx.state.user.id;
    const userRole = ctx.state.user.role;
    
    // Check if course exists and if user has permission to unpublish it
    const courseCheck = await query(
      "SELECT created_by, is_published FROM courses WHERE id = $1",
      [courseId]
    );
    
    if (courseCheck.rowCount === 0) {
      return sendNotFound(ctx, "Course not found");
    }
    
    // Check if user is the creator or an admin
    const isCreator = courseCheck.rows[0].created_by === userId;
    const isAdmin = userRole === "ADMIN";
    
    if (!isCreator && !isAdmin) {
      return sendForbidden(ctx, "You don't have permission to unpublish this course");
    }
    
    // Check if course is already unpublished
    if (!courseCheck.rows[0].is_published) {
      return sendError(ctx, "Course is already unpublished", 400);
    }
    
    // Update the course to unpublished status
    const result = await query(
      `UPDATE courses SET 
        is_published = false, 
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [courseId]
    );
    
    return sendSuccess(ctx, result.rows[0], "Course unpublished successfully");
  } catch (error) {
    console.error("Error unpublishing course:", error);
    return sendError(ctx, "Failed to unpublish course");
  }
}