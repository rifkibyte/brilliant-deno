# Learning Platform Backend

A Deno-based backend API for a learning platform with PostgreSQL, Redis, and JWT authentication.

## Features

- User management with JWT authentication and Google SSO
- Course and content management
- Learning progress tracking
- Leaderboards and gamification
- Notification system
- Analytics and reporting
- Security features including rate limiting and RBAC
- Performance optimization with Redis caching

## Tech Stack

- **Runtime**: Deno
- **Database**: PostgreSQL
- **Caching**: Redis
- **ORM**: Deno Postgres (pg)
- **Authentication**: JWT, OAuth2
- **Task Queue**: Redis-based
- **API Style**: REST

## Getting Started

1. Install Deno: https://deno.land/#installation
2. Clone this repository
3. Set up environment variables in `.env`
4. Run `deno task start`

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

## API Documentation

API documentation is available at `/api/docs` when the server is running.