// Controller for listing courses with filtering and pagination
import { Context } from "../../deps.ts";
import { query } from "../../db/database.ts";
import { sendSuccess } from "../../utils/response.util.ts";
import { validateQuery } from "../../utils/validation.util.ts";
import { z } from "../../deps.ts";

// Validation schema for query parameters
const listCoursesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  category: z.string().uuid("Invalid category ID").optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  creator: z.string().uuid("Invalid creator ID").optional(),
  published: z.enum(["true", "false"]).transform(val => val === "true").optional(),
  featured: z.enum(["true", "false"]).transform(val => val === "true").optional(),
});

export async function listCourses(ctx: Context) {
  try {
    // Validate query parameters
    const validatedQuery = await validateQuery(ctx, listCoursesSchema);
    if (!validatedQuery) return; // validateQuery will handle the response if validation fails
    
    const {
      page,
      limit,
      search,
      category,
      difficulty,
      creator,
      published,
      featured,
    } = validatedQuery;
    
    const offset = (page - 1) * limit;
    const queryParams: any[] = [];
    const whereConditions: string[] = [];
    let paramIndex = 1;
    
    // Add filtering conditions
    if (search) {
      whereConditions.push(`(c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    if (category) {
      whereConditions.push(`c.category_id = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }
    
    if (difficulty) {
      whereConditions.push(`c.difficulty_level = $${paramIndex}`);
      queryParams.push(difficulty);
      paramIndex++;
    }
    
    if (creator) {
      whereConditions.push(`c.created_by = $${paramIndex}`);
      queryParams.push(creator);
      paramIndex++;
    }
    
    if (published !== undefined) {
      whereConditions.push(`c.is_published = $${paramIndex}`);
      queryParams.push(published);
      paramIndex++;
    }
    
    if (featured !== undefined) {
      whereConditions.push(`c.is_featured = $${paramIndex}`);
      queryParams.push(featured);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Count total results
    const countQuery = `SELECT COUNT(*) as total FROM courses c ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);
    
    // Add pagination parameters
    queryParams.push(limit);
    queryParams.push(offset);
    
    // Get paginated results
    const coursesQuery = `
      SELECT c.*, 
             u.first_name || ' ' || u.last_name as creator_name,
             cat.name as category_name
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const coursesResult = await query(coursesQuery, queryParams);
    
    // Return the results with pagination metadata
    return sendSuccess(ctx, coursesResult.rows, "Courses retrieved successfully", 200, {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error("Error listing courses:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Failed to list courses",
      data: null
    };
  }
}