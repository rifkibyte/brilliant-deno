// Controller for updating course details
import { Context } from "../../deps.ts";
import { query } from "../../db/database.ts";
import { generateSlug } from "../../utils/string.util.ts";
import { validateBody } from "../../utils/validation.util.ts";
import { sendNotFound, sendSuccess, sendForbidden, sendError } from "../../utils/response.util.ts";
import { z } from "../../deps.ts";

// Validation schema for course update
const courseUpdateSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(255).optional(),
  description: z.string().min(20, "Description must be at least 20 characters").optional(),
  thumbnail_url: z.string().url("Invalid thumbnail URL").optional().nullable(),
  difficulty_level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  category_id: z.string().uuid("Invalid category ID").optional(),
  estimated_duration: z.number().int().positive().optional().nullable(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
});

export async function updateCourse(ctx: Context) {
  try {
    // Validate request body
    const validatedData = await validateBody(ctx, courseUpdateSchema);
    if (!validatedData) return; // validateBody will handle the response if validation fails
    
    const courseId = ctx.params.id;
    const userId = ctx.state.user.id;
    const userRole = ctx.state.user.role;
    
    // Check if course exists and if user has permission to update it
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
      return sendForbidden(ctx, "You don't have permission to update this course");
    }
    
    // Build update query dynamically based on provided fields
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;
    
    if (validatedData.title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      queryParams.push(validatedData.title);
      paramIndex++;
      
      // Also update slug if title is changing
      const slug = generateSlug(validatedData.title);
      updateFields.push(`slug = $${paramIndex}`);
      queryParams.push(slug);
      paramIndex++;
    }
    
    if (validatedData.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      queryParams.push(validatedData.description);
      paramIndex++;
    }
    
    if (validatedData.thumbnail_url !== undefined) {
      updateFields.push(`thumbnail_url = $${paramIndex}`);
      queryParams.push(validatedData.thumbnail_url);
      paramIndex++;
    }
    
    if (validatedData.difficulty_level !== undefined) {
      updateFields.push(`difficulty_level = $${paramIndex}`);
      queryParams.push(validatedData.difficulty_level);
      paramIndex++;
    }
    
    if (validatedData.category_id !== undefined) {
      updateFields.push(`category_id = $${paramIndex}`);
      queryParams.push(validatedData.category_id);
      paramIndex++;
    }
    
    if (validatedData.estimated_duration !== undefined) {
      updateFields.push(`estimated_duration = $${paramIndex}`);
      queryParams.push(validatedData.estimated_duration);
      paramIndex++;
    }
    
    if (validatedData.is_published !== undefined) {
      updateFields.push(`is_published = $${paramIndex}`);
      queryParams.push(validatedData.is_published);
      paramIndex++;
    }
    
    if (validatedData.is_featured !== undefined) {
      // Only admins can set featured status
      if (!isAdmin && validatedData.is_featured) {
        return sendForbidden(ctx, "Only administrators can feature courses");
      }
      
      updateFields.push(`is_featured = $${paramIndex}`);
      queryParams.push(validatedData.is_featured);
      paramIndex++;
    }
    
    // If no fields to update, return the current course
    if (updateFields.length === 0) {
      const currentCourse = await query("SELECT * FROM courses WHERE id = $1", [courseId]);
      return sendSuccess(ctx, currentCourse.rows[0], "No changes to update");
    }
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add courseId as the last parameter
    queryParams.push(courseId);
    
    // Execute update query
    const result = await query(
      `UPDATE courses SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      queryParams
    );
    
    return sendSuccess(ctx, result.rows[0], "Course updated successfully");
  } catch (error) {
    console.error("Error updating course:", error);
    return sendError(ctx, "Failed to update course");
  }
}