# Brilliant Learning Clone - Backend

A Deno TypeScript backend for a learning platform similar to Brilliant.

## Features

- User authentication (register, login)
- Course management (create, list, view)
- Lesson management (create, list, view)
- PostgreSQL database for robust data persistence
- Redis caching for improved performance
- RESTful API endpoints for Next.js frontend integration

## Tech Stack

- **Runtime**: [Deno](https://deno.land/) v1.30.0 or higher
- **Language**: TypeScript
- **Web Framework**: [Oak](https://deno.land/x/oak) - middleware framework
- **Database**: PostgreSQL 14+
- **ORM**: [Denodb](https://deno.land/x/denodb) - Deno ORM for PostgreSQL
- **Caching**: Redis 6+
- **Authentication**: JWT (JSON Web Tokens)
- **API**: RESTful API design
- **Package Manager**: [pnpm](https://pnpm.io/) v7.0.0 or higher (for frontend dependencies)

## Prerequisites

- [Deno](https://deno.land/) v1.30.0 or higher
- [PostgreSQL](https://www.postgresql.org/) v14+ 
- [Redis](https://redis.io/) v6+
- [pnpm](https://pnpm.io/) v7.0.0 or higher (for frontend)

## Installation

1. Clone the repository
2. Set up PostgreSQL database
3. Set up Redis server
4. Configure environment variables:

```bash
# Create a .env file in the root directory
cp .env.example .env
# Edit the .env file with your database and Redis credentials
```

## Project Structure

```
/
├── src/                    # Source code
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── db/                 # Database setup and models
│   ├── middleware/         # Custom middleware
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── deps.ts                 # External dependencies
├── mod.ts                  # Main entry point
├── deno.json               # Deno configuration
└── .env.example            # Example environment variables
```

## Database Setup

Initialize the PostgreSQL database with schema and sample data:

```bash
deno run --allow-net --allow-read --allow-write --allow-env src/utils/initDb.ts
```

## Running the Application

Start the development server:

```bash
deno run --watch --allow-net --allow-read --allow-write --allow-env --allow-sys src/app.ts
```

For production:

```bash
deno run --allow-net --allow-read --allow-write --allow-env --allow-sys src/app.ts
```

The server will run on http://localhost:8000 by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/users/me` - Get current user info (requires authentication)
- `PUT /api/users/me` - Update user profile

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get a specific course
- `GET /api/courses/category/:category` - Get courses by category
- `POST /api/courses` - Create a new course (requires admin)
- `PUT /api/courses/:id` - Update a course (requires admin)
- `DELETE /api/courses/:id` - Delete a course (requires admin)

### Lessons
- `GET /api/lessons/:id` - Get a specific lesson
- `GET /api/lessons/course/:courseId` - Get lessons for a course
- `POST /api/lessons` - Create a new lesson (requires admin)
- `PUT /api/lessons/:id` - Update a lesson (requires admin)
- `DELETE /api/lessons/:id` - Delete a lesson (requires admin)

### Progress Tracking
- `GET /api/progress` - Get user's learning progress
- `POST /api/progress/:lessonId` - Update lesson completion status

## Performance Features

- **Redis Caching**: Frequently accessed data like course listings and popular lessons are cached
- **Connection Pooling**: Efficient database connection management
- **Rate Limiting**: API rate limiting to prevent abuse
- **Response Compression**: Gzip/Brotli compression for API responses

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin and user role separation
- **Input Validation**: Thorough request validation
- **CORS Protection**: Configurable CORS settings
- **Rate Limiting**: Protection against brute force attacks

## Frontend Integration

This backend is designed to work with a Next.js frontend. To connect your Next.js application:

1. Make API requests to the backend endpoints
2. Handle authentication using JWT tokens
3. Store tokens securely in your frontend application

## License

MIT