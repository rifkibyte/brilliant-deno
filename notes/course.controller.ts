// Course controller implementation
// This file contains the implementation for the course controller

// Import necessary dependencies
import { Context } from "../deps.ts";
import { query } from "@/db/database.ts";
import { sendSuccess } from "@/utils/response.util.ts";

/**
 * List all courses grouped by category
 * This function returns courses grouped by their categories
 * @param ctx Context
 */
export async function listCoursesByCategory(ctx: Context) {
  try {
    // Query to get all categories with their courses
    const categoriesQuery = `
      SELECT DISTINCT category 
      FROM courses 
      WHERE is_published = true
      ORDER BY category
    `;
    
    const categoriesResult = await query(categoriesQuery);
    const categories = categoriesResult.rows.map(row => row.category);
    
    // For each category, get the courses
    const result = [];
    
    for (const category of categories) {
      const coursesQuery = `
        SELECT 
          c.id, 
          c.title, 
          c.description,
          c.category,
          (
            SELECT json_agg(
              json_build_object(
                'id', m.id,
                'title', m.title,
                'lessons', (
                  SELECT json_agg(
                    json_build_object(
                      'id', l.id,
                      'title', l.title
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
        WHERE 
          c.is_published = true AND
          c.category = $1
        ORDER BY 
          c.title
      `;
      
      const coursesResult = await query(coursesQuery, [category]);
      
      // Get the description for this category
      const description = getCategoryDescription(category);
      
      // Format the modules and lessons
      const courses = coursesResult.rows.map(course => {
        const modules = course.modules || [];
        const lessons = modules.flatMap(module => module.lessons || []);
        
        return {
          title: course.title,
          lessons: lessons.map(lesson => lesson.title)
        };
      });
      
      result.push({
        title: category,
        description,
        list: courses.flatMap(course => course.lessons)
      });
    }
    
    return sendSuccess(ctx, result, "Courses retrieved successfully");
  } catch (error) {
    console.error("Error listing courses by category:", error);
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

/**
 * Example response format:
 * [
 *   {
 *     title: "Programming & CS",
 *     description: "Speak the language of computers",
 *     list: [
 *       "Thinking in Code",
 *       "Programming with Variables",
 *       "Programming with Python",
 *       "Programming with Functions",
 *       "Computer Science Fundamentals"
 *     ]
 *   },
 *   {
 *     title: "Data Analysis",
 *     description: "Know your stuff in probability and data analysis",
 *     list: [
 *       "Exploring Data Visually",
 *       "Introduction to Probability",
 *       "Predicting with Probability",
 *       "Regression and Classification"
 *     ]
 *   },
 *   {
 *     title: "Foundational Math",
 *     description: "Master problem solving essentials in math",
 *     list: [
 *       "Solving Equations",
 *       "Visual Algebra",
 *       "Real-World Algebra",
 *       "Geometry",
 *       "Functions"
 *     ]
 *   }
 * ]
 */