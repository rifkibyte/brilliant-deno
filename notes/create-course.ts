// Controller for creating a new course
import { Context } from "../../deps.ts";
import { query } from "../../db/database.ts";
import { generateSlug } from "../../utils/string.util.ts";
import { validateBody } from "../../utils/validation.util.ts";
import { sendCreated, sendError } from "../../utils/response.util.ts";
import { z } from "../../deps.ts";

// Validation schema for course creation
const courseCreationSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(255),
  description: z.string().min(20, "Description must be at least 20 characters"),
  thumbnail_url: z.string().url("Invalid thumbnail URL").optional(),
  difficulty_level: z.enum(["beginner", "intermediate", "advanced"]),
  category_id: z.string().uuid("Invalid category ID"),
  estimated_duration: z.number().int().positive().optional(),
});

export async function createCourse(ctx: Context) {
  try {
    // Validate request body
    const validatedData = await validateBody(ctx, courseCreationSchema);
    if (!validatedData) return; // validateBody will handle the response if validation fails
    
    // Get user ID from auth context
    const userId = ctx.state.user.id;
    
    // Generate slug from title
    const slug = generateSlug(validatedData.title);
    
    // Check if slug already exists
    const existingCourse = await query(
      "SELECT id FROM courses WHERE slug = $1",
      [slug]
    );
    
    if (existingCourse.rowCount > 0) {
      return sendError(ctx, "A course with a similar title already exists", 409);
    }
    
    // Insert the course
    const result = await query(
      `INSERT INTO courses 
        (title, slug, description, thumbnail_url, difficulty_level, category_id, created_by, estimated_duration) 
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        validatedData.title,
        slug,
        validatedData.description,
        validatedData.thumbnail_url || null,
        validatedData.difficulty_level,
        validatedData.category_id,
        userId,
        validatedData.estimated_duration || null,
      ]
    );
    
    // Return the created course
    return sendCreated(ctx, result.rows[0], "Course created successfully");
  } catch (error) {
    console.error("Error creating course:", error);
    return sendError(ctx, "Failed to create course");
  }
}