// Controller for module operations
import { Context, z } from "~/deps.ts";
import { query } from "../../db/database.ts";
import { validateBody } from "../../utils/validation.util.ts";
import { sendCreated, sendError, sendForbidden, sendNotFound } from "../../utils/response.util.ts";

// Validation schema for module creation
const moduleCreationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().optional(),
  position: z.number().int().nonnegative().optional(),
});

// Create a new module
export async function createModule(ctx: Context) {
  try {
    const courseId = ctx.params.courseId;
    const userId = ctx.state.user.id;

    // Validate request body
    const validatedData = await validateBody(ctx, moduleCreationSchema);
    if (!validatedData) return; // validateBody will handle the response if validation fails

    // Check if course exists and user has permission
    const courseCheck = await query(
      "SELECT created_by FROM courses WHERE id = $1",
      [courseId],
    );

    if (courseCheck.rowCount === 0) {
      return sendNotFound(ctx, "Course not found");
    }

    // Check if user is the course creator
    if (courseCheck.rows[0].created_by !== userId) {
      return sendForbidden(ctx, "You don't have permission to add modules to this course");
    }

    // If position is not provided, get the next position
    let position = validatedData.position;
    if (position === undefined) {
      const positionResult = await query(
        "SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM modules WHERE course_id = $1",
        [courseId],
      );
      position = positionResult.rows[0].next_position;
    }

    // Create the module
    const result = await query(
      `INSERT INTO modules 
        (course_id, title, description, position) 
       VALUES 
        ($1, $2, $3, $4) 
       RETURNING *`,
      [courseId, validatedData.title, validatedData.description || null, position],
    );

    return sendCreated(ctx, result.rows[0], "Module created successfully");
  } catch (error) {
    console.error("Error creating module:", error);
    return sendError(ctx, "Failed to create module");
  }
}
