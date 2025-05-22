// Controller for getting course details
import { Context } from "../../deps.ts";
import { query } from "../../db/database.ts";
import { sendNotFound, sendSuccess } from "../../utils/response.util.ts";

export async function getCourseById(ctx: Context) {
  try {
    const courseId = ctx.params.id;
    
    // Get course details with creator and category information
    const result = await query(
      `SELECT c.*, 
              u.first_name || ' ' || u.last_name as creator_name,
              cat.name as category_name
       FROM courses c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.id = $1`,
      [courseId]
    );
    
    if (result.rowCount === 0) {
      return sendNotFound(ctx, "Course not found");
    }
    
    // Get modules for this course
    const modulesResult = await query(
      `SELECT * FROM modules 
       WHERE course_id = $1
       ORDER BY position ASC`,
      [courseId]
    );
    
    // Add modules to course data
    const courseData = {
      ...result.rows[0],
      modules: modulesResult.rows
    };
    
    return sendSuccess(ctx, courseData, "Course details retrieved successfully");
  } catch (error) {
    console.error("Error getting course details:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Failed to get course details",
      data: null
    };
  }
}

export async function getCourseBySlug(ctx: Context) {
  try {
    const slug = ctx.params.slug;
    
    // Get course details with creator and category information
    const result = await query(
      `SELECT c.*, 
              u.first_name || ' ' || u.last_name as creator_name,
              cat.name as category_name
       FROM courses c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.slug = $1`,
      [slug]
    );
    
    if (result.rowCount === 0) {
      return sendNotFound(ctx, "Course not found");
    }
    
    // Get modules for this course
    const modulesResult = await query(
      `SELECT * FROM modules 
       WHERE course_id = $1
       ORDER BY position ASC`,
      [result.rows[0].id]
    );
    
    // Add modules to course data
    const courseData = {
      ...result.rows[0],
      modules: modulesResult.rows
    };
    
    return sendSuccess(ctx, courseData, "Course details retrieved successfully");
  } catch (error) {
    console.error("Error getting course details:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Failed to get course details",
      data: null
    };
  }
}