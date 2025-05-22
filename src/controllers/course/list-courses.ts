// Controller for listing courses with filtering and pagination
// import { Context } from "../../deps.ts";
// import { query } from "../../db/database.ts";
// import { sendSuccess } from "../../utils/response.util.ts";
// import { validateQuery } from "../../utils/validation.util.ts";
// import { z } from "../../deps.ts";

// // Validation schema for query parameters
// const listCoursesSchema = z.object({
//   page: z.coerce.number().int().positive().default(1),
//   limit: z.coerce.number().int().positive().max(100).default(10),
//   search: z.string().optional(),
//   category: z.string().uuid("Invalid category ID").optional(),
//   difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
//   creator: z.string().uuid("Invalid creator ID").optional(),
//   published: z.enum(["true", "false"]).transform(val => val === "true").optional(),
//   featured: z.enum(["true", "false"]).transform(val => val === "true").optional(),
// });

// export async function listCourses(ctx: Context) {
//   try {
//     // Validate query parameters
//     const validatedQuery = await validateQuery(ctx, listCoursesSchema);
//     if (!validatedQuery) return; // validateQuery will handle the response if validation fails

//     const {
//       page,
//       limit,
//       search,
//       category,
//       difficulty,
//       creator,
//       published,
//       featured,
//     } = validatedQuery;

//     const offset = (page - 1) * limit;
//     const queryParams: any[] = [];
//     const whereConditions: string[] = [];
//     let paramIndex = 1;

//     // Add filtering conditions
//     if (search) {
//       whereConditions.push(`(c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
//       queryParams.push(`%${search}%`);
//       paramIndex++;
//     }

//     if (category) {
//       whereConditions.push(`c.category_id = $${paramIndex}`);
//       queryParams.push(category);
//       paramIndex++;
//     }

//     if (difficulty) {
//       whereConditions.push(`c.difficulty_level = $${paramIndex}`);
//       queryParams.push(difficulty);
//       paramIndex++;
//     }

//     if (creator) {
//       whereConditions.push(`c.created_by = $${paramIndex}`);
//       queryParams.push(creator);
//       paramIndex++;
//     }

//     if (published !== undefined) {
//       whereConditions.push(`c.is_published = $${paramIndex}`);
//       queryParams.push(published);
//       paramIndex++;
//     }

//     if (featured !== undefined) {
//       whereConditions.push(`c.is_featured = $${paramIndex}`);
//       queryParams.push(featured);
//       paramIndex++;
//     }

//     const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

//     // Count total results
//     const countQuery = `SELECT COUNT(*) as total FROM courses c ${whereClause}`;
//     const countResult = await query(countQuery, queryParams);
//     const total = parseInt(countResult.rows[0].total, 10);

//     // Add pagination parameters
//     queryParams.push(limit);
//     queryParams.push(offset);

//     // Get paginated results
//     const coursesQuery = `
//       SELECT c.*,
//              u.first_name || ' ' || u.last_name as creator_name,
//              cat.name as category_name
//       FROM courses c
//       LEFT JOIN users u ON c.created_by = u.id
//       LEFT JOIN categories cat ON c.category_id = cat.id
//       ${whereClause}
//       ORDER BY c.created_at DESC
//       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
//     `;

//     const coursesResult = await query(coursesQuery, queryParams);

//     // Return the results with pagination metadata
//     return sendSuccess(ctx, coursesResult.rows, "Courses retrieved successfully", 200, {
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       }
//     });
//   } catch (error) {
//     console.error("Error listing courses:", error);
//     ctx.response.status = 500;
//     ctx.response.body = {
//       success: false,
//       message: "Failed to list courses",
//       data: null
//     };
//   }
// }

import { Context } from "../../deps.ts";
import { query } from "@/db/database.ts";
import { sendSuccess } from "@/utils/response.util.ts";

/**
 * List all published courses
 * @param ctx Context
 */
export async function listCourses(ctx: Context) {
  try {
    const sql = `
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c.thumbnail, 
        c.difficulty, 
        c.estimated_hours, 
        c.category,
        c.created_at,
        c.updated_at,
        c.published_at,
        u.first_name || ' ' || u.last_name AS creator_name,
        (
          SELECT COUNT(*) 
          FROM modules m 
          WHERE m.course_id = c.id
        ) AS modules_count,
        (
          SELECT COUNT(*) 
          FROM modules m 
          JOIN lessons l ON m.id = l.module_id 
          WHERE m.course_id = c.id
        ) AS lessons_count
      FROM 
        courses c
      JOIN 
        users u ON c.creator_id = u.id
      WHERE 
        c.is_published = true
      ORDER BY 
        c.published_at DESC
    `;

    const result = await query(sql);

    // Transform the result to match the required format
    const courses = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnail: row.thumbnail,
      difficulty: row.difficulty,
      estimatedHours: row.estimated_hours,
      category: row.category,
      creatorName: row.creator_name,
      modulesCount: parseInt(row.modules_count),
      lessonsCount: parseInt(row.lessons_count),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    }));

    return sendSuccess(ctx, courses, "Courses retrieved successfully");
  } catch (error) {
    console.error("Error listing courses:", error);
    throw error;
  }
}

/**
 * List courses by category
 * @param ctx Context
 */
export async function listCoursesByCategory(ctx: Context) {
  try {
    const { category } = ctx.params;

    if (!category) {
      return sendSuccess(ctx, [], "No category provided");
    }

    const sql = `
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c.thumbnail, 
        c.difficulty, 
        c.estimated_hours, 
        c.category,
        c.created_at,
        c.updated_at,
        c.published_at,
        u.first_name || ' ' || u.last_name AS creator_name,
        (
          SELECT json_agg(
            json_build_object(
              'id', m.id,
              'title', m.title,
              'lessons', (
                SELECT json_agg(
                  json_build_object(
                    'id', l.id,
                    'title', l.title,
                    'estimatedMinutes', l.estimated_minutes
                  )
                )
                FROM lessons l
                WHERE l.module_id = m.id
                ORDER BY l.order_index
              )
            )
          )
          FROM modules m
          WHERE m.course_id = c.id
          ORDER BY m.order_index
        ) AS modules
      FROM 
        courses c
      JOIN 
        users u ON c.creator_id = u.id
      WHERE 
        c.is_published = true AND
        c.category = $1
      ORDER BY 
        c.published_at DESC
    `;

    const result = await query(sql, [category]);

    // Transform the result to match the required format
    const courses = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnail: row.thumbnail,
      difficulty: row.difficulty,
      estimatedHours: row.estimated_hours,
      category: row.category,
      creatorName: row.creator_name,
      modules: row.modules || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    }));

    // Group courses by category for the response format
    const response = {
      title: category,
      description: getCategoryDescription(category),
      courses,
    };

    return sendSuccess(ctx, response, `Courses in ${category} retrieved successfully`);
  } catch (error) {
    console.error(`Error listing courses by category:`, error);
    throw error;
  }
}

/**
 * Get description for a category
 * @param category Category name
 * @returns Description for the category
 */
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    "Programming & CS": "Speak the language of computers",
    "Data Analysis": "Know your stuff in probability and data analysis",
    "Foundational Math": "Master problem solving essentials in math",
    // Add more categories as needed
  };

  return descriptions[category] || "";
}
