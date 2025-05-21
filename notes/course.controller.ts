// Controller for module operations
import { Context, z } from "~/deps.ts";
import { query } from "../../db/database.ts";
import { validateBody } from "../../utils/validation.util.ts";
import {
  sendCreated,
  sendError,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from "../../utils/response.util.ts";

// Validation schema for module creation
const moduleCreationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().optional(),
  position: z.number().int().nonnegative().optional(),
});

// Validation schema for module update
const moduleUpdateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255).optional(),
  description: z.string().optional().nullable(),
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

// Get module details
export async function getModuleById(ctx: Context) {
  try {
    const moduleId = ctx.params.id;

    // Get module details
    const moduleResult = await query(
      "SELECT * FROM modules WHERE id = $1",
      [moduleId],
    );

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

    return sendSuccess(ctx, moduleData, "Module details retrieved successfully");
  } catch (error) {
    console.error("Error getting module details:", error);
    return sendError(ctx, "Failed to get module details");
  }
}

// Update module
export async function updateModule(ctx: Context) {
  try {
    const moduleId = ctx.params.id;
    const userId = ctx.state.user.id;

    // Validate request body
    const validatedData = await validateBody(ctx, moduleUpdateSchema);
    if (!validatedData) return; // validateBody will handle the response if validation fails

    // Check if module exists and user has permission
    const moduleCheck = await query(
      `SELECT m.id, c.created_by 
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
      return sendForbidden(ctx, "You don't have permission to update this module");
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (validatedData.title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      queryParams.push(validatedData.title);
      paramIndex++;
    }

    if (validatedData.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      queryParams.push(validatedData.description);
      paramIndex++;
    }

    if (validatedData.position !== undefined) {
      updateFields.push(`position = $${paramIndex}`);
      queryParams.push(validatedData.position);
      paramIndex++;
    }

    // If no fields to update, return the current module
    if (updateFields.length === 0) {
      const currentModule = await query("SELECT * FROM modules WHERE id = $1", [moduleId]);
      return sendSuccess(ctx, currentModule.rows[0], "No changes to update");
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add moduleId as the last parameter
    queryParams.push(moduleId);

    // Execute update query
    const result = await query(
      `UPDATE modules SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      queryParams,
    );

    return sendSuccess(ctx, result.rows[0], "Module updated successfully");
  } catch (error) {
    console.error("Error updating module:", error);
    return sendError(ctx, "Failed to update module");
  }
}

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
      return sendForbidden(ctx, "You don't have permission to delete this module");
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

// List modules for a course
export async function listModules(ctx: Context) {
  try {
    const courseId = ctx.params.courseId;

    // Check if course exists
    const courseCheck = await query(
      "SELECT id FROM courses WHERE id = $1",
      [courseId],
    );

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

    return sendSuccess(ctx, modulesResult.rows, "Modules retrieved successfully");
  } catch (error) {
    console.error("Error listing modules:", error);
    return sendError(ctx, "Failed to list modules");
  }
}
