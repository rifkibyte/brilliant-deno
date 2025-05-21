// Lesson Controller
import { Context } from "../../deps.ts";
import { query, transaction } from "../../db/database.ts";
import { sendBadRequest, sendNotFound, sendSuccess } from "../../utils/response.util.ts";
import { validateBody, validateParams } from "../../utils/validation.util.ts";
import { z } from "../../deps.ts";
import { NotFoundError } from "../../utils/error.util.ts";

// Validation schema for creating a lesson
const createLessonSchema = z.object({
  module_id: z.string().uuid(),
  title: z.string().min(3).max(255),
  content: z.string(),
  position: z.number().int().positive(),
  type: z.enum(["video", "text", "quiz", "interactive"]),
  duration: z.number().int().positive().optional(),
  is_free: z.boolean().optional().default(false),
});

// Validation schema for updating a lesson
const updateLessonSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  content: z.string().optional(),
  position: z.number().int().positive().optional(),
  type: z.enum(["video", "text", "quiz", "interactive"]).optional(),
  duration: z.number().int().positive().optional(),
  is_free: z.boolean().optional(),
});

// Validation schema for lesson ID
const lessonIdSchema = z.object({
  id: z.string().uuid(),
});

// Validation schema for module ID
const moduleIdSchema = z.object({
  module_id: z.string().uuid(),
});

/**
 * Create a new lesson
 */
export async function createLesson(ctx: Context) {
  const validatedData = await validateBody(ctx, createLessonSchema);
  if (!validatedData) return;

  try {
    // Check if module exists
    const moduleCheck = await query(
      "SELECT id FROM modules WHERE id = $1",
      [validatedData.module_id],
    );

    if (moduleCheck.rows.length === 0) {
      return sendNotFound(ctx, "Module not found");
    }

    // Create the lesson
    const result = await query(
      `INSERT INTO lessons 
       (module_id, title, content, position, type, duration, is_free) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        validatedData.module_id,
        validatedData.title,
        validatedData.content,
        validatedData.position,
        validatedData.type,
        validatedData.duration || null,
        validatedData.is_free,
      ],
    );

    return sendSuccess(ctx, result.rows[0], "Lesson created successfully");
  } catch (error) {
    return sendBadRequest(ctx, `Error creating lesson: ${error.message}`);
  }
}

/**
 * Get a lesson by ID
 */
export async function getLessonById(ctx: Context) {
  const params = await validateParams(ctx, lessonIdSchema);
  if (!params) return;

  try {
    const result = await query(
      "SELECT * FROM lessons WHERE id = $1",
      [params.id],
    );

    if (result.rows.length === 0) {
      return sendNotFound(ctx, "Lesson not found");
    }

    return sendSuccess(ctx, result.rows[0], "Lesson retrieved successfully");
  } catch (error) {
    return sendBadRequest(ctx, `Error retrieving lesson: ${error.message}`);
  }
}

/**
 * List all lessons for a module
 */
export async function listLessons(ctx: Context) {
  const params = await validateParams(ctx, moduleIdSchema);
  if (!params) return;

  try {
    // Check if module exists
    const moduleCheck = await query(
      "SELECT id FROM modules WHERE id = $1",
      [params.module_id],
    );

    if (moduleCheck.rows.length === 0) {
      return sendNotFound(ctx, "Module not found");
    }

    const result = await query(
      "SELECT * FROM lessons WHERE module_id = $1 ORDER BY position ASC",
      [params.module_id],
    );

    return sendSuccess(ctx, result.rows, "Lessons retrieved successfully");
  } catch (error) {
    return sendBadRequest(ctx, `Error retrieving lessons: ${error.message}`);
  }
}

/**
 * Update a lesson
 */
export async function updateLesson(ctx: Context) {
  const params = await validateParams(ctx, lessonIdSchema);
  if (!params) return;

  const validatedData = await validateBody(ctx, updateLessonSchema);
  if (!validatedData) return;

  try {
    // Check if the lesson exists
    const lessonCheck = await query(
      "SELECT id FROM lessons WHERE id = $1",
      [params.id],
    );

    if (lessonCheck.rows.length === 0) {
      return sendNotFound(ctx, "Lesson not found");
    }

    // Build the update query dynamically
    const updates = [];
    const values = [];
    let paramCounter = 1;

    for (const [key, value] of Object.entries(validatedData)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCounter}`);
        values.push(value);
        paramCounter++;
      }
    }

    // Add updated_at field
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add the lesson ID to the values array
    values.push(params.id);

    const updateQuery = `
      UPDATE lessons 
      SET ${updates.join(", ")} 
      WHERE id = $${paramCounter} 
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    return sendSuccess(ctx, result.rows[0], "Lesson updated successfully");
  } catch (error) {
    return sendBadRequest(ctx, `Error updating lesson: ${error.message}`);
  }
}

/**
 * Delete a lesson
 */
export async function deleteLesson(ctx: Context) {
  const params = await validateParams(ctx, lessonIdSchema);
  if (!params) return;

  try {
    // Check if the lesson exists
    const lessonCheck = await query(
      "SELECT id FROM lessons WHERE id = $1",
      [params.id],
    );

    if (lessonCheck.rows.length === 0) {
      return sendNotFound(ctx, "Lesson not found");
    }

    // Delete the lesson
    await query(
      "DELETE FROM lessons WHERE id = $1",
      [params.id],
    );

    return sendSuccess(ctx, null, "Lesson deleted successfully");
  } catch (error) {
    return sendBadRequest(ctx, `Error deleting lesson: ${error.message}`);
  }
}

/**
 * Get user's progress for a lesson
 */
export async function getLessonProgress(ctx: Context) {
  const params = await validateParams(ctx, lessonIdSchema);
  if (!params) return;

  // Get user ID from authenticated user
  const userId = ctx.state.user?.id;
  if (!userId) {
    return sendBadRequest(ctx, "User not authenticated");
  }

  try {
    // Check if the lesson exists
    const lessonCheck = await query(
      "SELECT id FROM lessons WHERE id = $1",
      [params.id],
    );

    if (lessonCheck.rows.length === 0) {
      return sendNotFound(ctx, "Lesson not found");
    }

    // Get user's progress for this lesson
    const result = await query(
      "SELECT * FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2",
      [userId, params.id],
    );

    // If no progress record exists, return a default "not started" state
    if (result.rows.length === 0) {
      return sendSuccess(ctx, {
        status: "not_started",
        completion_percentage: 0.00,
        last_accessed_at: null,
        completed_at: null,
      }, "Lesson progress retrieved");
    }

    return sendSuccess(ctx, result.rows[0], "Lesson progress retrieved");
  } catch (error) {
    return sendBadRequest(ctx, `Error retrieving lesson progress: ${error.message}`);
  }
}

/**
 * Update user's progress for a lesson
 */
export async function updateLessonProgress(ctx: Context) {
  const params = await validateParams(ctx, lessonIdSchema);
  if (!params) return;

  // Validate the request body
  const progressSchema = z.object({
    status: z.enum(["not_started", "in_progress", "completed"]),
    completion_percentage: z.number().min(0).max(100).optional(),
  });

  const validatedData = await validateBody(ctx, progressSchema);
  if (!validatedData) return;

  // Get user ID from authenticated user
  const userId = ctx.state.user?.id;
  if (!userId) {
    return sendBadRequest(ctx, "User not authenticated");
  }

  try {
    // Check if the lesson exists
    const lessonCheck = await query(
      "SELECT id FROM lessons WHERE id = $1",
      [params.id],
    );

    if (lessonCheck.rows.length === 0) {
      return sendNotFound(ctx, "Lesson not found");
    }

    // Set completion_percentage to 100 if status is completed
    let completionPercentage = validatedData.completion_percentage;
    if (
      validatedData.status === "completed" && (!completionPercentage || completionPercentage < 100)
    ) {
      completionPercentage = 100;
    }

    // Set completed_at if status is completed
    const completedAt = validatedData.status === "completed" ? "CURRENT_TIMESTAMP" : null;

    // Check if a progress record already exists
    const existingProgress = await query(
      "SELECT id FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2",
      [userId, params.id],
    );

    let result;
    if (existingProgress.rows.length === 0) {
      // Insert new progress record
      result = await query(
        `INSERT INTO lesson_progress 
         (user_id, lesson_id, status, completion_percentage, last_accessed_at, completed_at) 
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, ${completedAt ? completedAt : "NULL"}) 
         RETURNING *`,
        [
          userId,
          params.id,
          validatedData.status,
          completionPercentage || 0,
        ],
      );
    } else {
      // Update existing progress record
      result = await query(
        `UPDATE lesson_progress 
         SET status = $1, 
             completion_percentage = $2, 
             last_accessed_at = CURRENT_TIMESTAMP,
             completed_at = ${completedAt ? completedAt : "NULL"}
         WHERE user_id = $3 AND lesson_id = $4 
         RETURNING *`,
        [
          validatedData.status,
          completionPercentage || 0,
          userId,
          params.id,
        ],
      );
    }

    return sendSuccess(ctx, result.rows[0], "Lesson progress updated successfully");
  } catch (error) {
    return sendBadRequest(ctx, `Error updating lesson progress: ${error.message}`);
  }
}
