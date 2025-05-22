// Controller for module operations
import { Context, z } from "~/deps.ts";
import { query } from "../../db/database.ts";
import { validateBody } from "../../utils/validation.util.ts";
import { sendError, sendForbidden, sendNotFound, sendSuccess } from "../../utils/response.util.ts";

// Validation schema for module update
const moduleUpdateSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(255)
    .optional(),
  description: z.string().optional().nullable(),
  position: z.number().int().nonnegative().optional(),
});

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
      return sendForbidden(
        ctx,
        "You don't have permission to update this module",
      );
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
      const currentModule = await query("SELECT * FROM modules WHERE id = $1", [
        moduleId,
      ]);
      return sendSuccess(ctx, currentModule.rows[0], "No changes to update");
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add moduleId as the last parameter
    queryParams.push(moduleId);

    // Execute update query
    const result = await query(
      `UPDATE modules SET ${
        updateFields.join(
          ", ",
        )
      } WHERE id = $${paramIndex} RETURNING *`,
      queryParams,
    );

    return sendSuccess(ctx, result.rows[0], "Module updated successfully");
  } catch (error) {
    console.error("Error updating module:", error);
    return sendError(ctx, "Failed to update module");
  }
}
