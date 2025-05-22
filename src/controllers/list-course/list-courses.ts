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
      publishedAt: row.published_at
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
      publishedAt: row.published_at
    }));

    // Group courses by category for the response format
    const response = {
      title: category,
      description: getCategoryDescription(category),
      courses
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