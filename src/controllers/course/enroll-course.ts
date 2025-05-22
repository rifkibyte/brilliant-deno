// Controller for course enrollment
import { Context } from "../../deps.ts";
import { query } from "../../db/database.ts";
import { sendNotFound, sendSuccess, sendError, sendConflict } from "../../utils/response.util.ts";

export async function enrollCourse(ctx: Context) {
  try {
    const courseId = ctx.params.id;
    const userId = ctx.state.user.id;
    
    // Check if course exists and is published
    const courseCheck = await query(
      "SELECT id, title, is_published FROM courses WHERE id = $1",
      [courseId]
    );
    
    if (courseCheck.rowCount === 0) {
      return sendNotFound(ctx, "Course not found");
    }
    
    // Check if course is published
    if (!courseCheck.rows[0].is_published) {
      return sendError(ctx, "This course is not available for enrollment", 400);
    }
    
    // Check if user is already enrolled
    const enrollmentCheck = await query(
      "SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );
    
    if (enrollmentCheck.rowCount > 0) {
      return sendConflict(ctx, "You are already enrolled in this course");
    }
    
    // Create enrollment record
    const result = await query(
      `INSERT INTO course_enrollments 
        (user_id, course_id, last_accessed_at) 
       VALUES 
        ($1, $2, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [userId, courseId]
    );
    
    return sendSuccess(
      ctx, 
      result.rows[0], 
      `Successfully enrolled in "${courseCheck.rows[0].title}"`
    );
  } catch (error) {
    console.error("Error enrolling in course:", error);
    return sendError(ctx, "Failed to enroll in course");
  }
}

export async function unenrollCourse(ctx: Context) {
  try {
    const courseId = ctx.params.id;
    const userId = ctx.state.user.id;
    
    // Check if enrollment exists
    const enrollmentCheck = await query(
      `SELECT e.id, c.title 
       FROM course_enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = $1 AND e.course_id = $2`,
      [userId, courseId]
    );
    
    if (enrollmentCheck.rowCount === 0) {
      return sendNotFound(ctx, "You are not enrolled in this course");
    }
    
    // Delete enrollment record
    await query(
      "DELETE FROM course_enrollments WHERE id = $1",
      [enrollmentCheck.rows[0].id]
    );
    
    return sendSuccess(
      ctx, 
      { courseId }, 
      `Successfully unenrolled from "${enrollmentCheck.rows[0].title}"`
    );
  } catch (error) {
    console.error("Error unenrolling from course:", error);
    return sendError(ctx, "Failed to unenroll from course");
  }
}

export async function getUserEnrollments(ctx: Context) {
  try {
    const userId = ctx.state.user.id;
    const page = parseInt(ctx.request.url.searchParams.get("page") || "1");
    const limit = parseInt(ctx.request.url.searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await query(
      "SELECT COUNT(*) as total FROM course_enrollments WHERE user_id = $1",
      [userId]
    );
    const total = parseInt(countResult.rows[0].total);
    
    // Get user enrollments with course details
    const result = await query(
      `SELECT e.*, 
              c.title, c.slug, c.thumbnail_url, c.difficulty_level,
              c.estimated_duration,
              u.first_name || ' ' || u.last_name as creator_name
       FROM course_enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON c.created_by = u.id
       WHERE e.user_id = $1
       ORDER BY e.enrolled_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return sendSuccess(ctx, result.rows, "Enrollments retrieved successfully", 200, {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error("Error getting user enrollments:", error);
    return sendError(ctx, "Failed to get enrollments");
  }
}