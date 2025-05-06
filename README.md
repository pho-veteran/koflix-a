# Koflix-A: Movie Streaming Admin & API Backend

<div align="center">
  <img src="public/favicon.png" alt="Koflix Admin Logo" width="150" height="150" />
  <h3>Manage your movie streaming platform with ease</h3>
</div>

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 📋 Overview

Koflix-A is a powerful admin dashboard and API backend for the Koflix movie streaming platform. It provides comprehensive tools for managing movies, episodes, streaming servers, and user content. With features like bulk importing from external APIs, advanced search capabilities, and robust server management, Koflix-A offers a complete solution for movie content administration. The platform includes an integrated crawler for KKPhim, allowing automated import of movies with metadata, episodes, and streaming links.

## ✨ Features

- **Movie Management**
  - Create, read, update, and delete movies
  - Bulk update capabilities
  - Advanced filtering and search
  - Organize by genres, countries, and movie types

- **Episode & Server Management**
  - Create and manage episodes for series and TV shows
  - Configure multiple streaming servers per episode
  - Support for both HLS (m3u8) and MP4 streaming

- **Content Import System**
  - Integration with external APIs to import movies
  - Intelligent movie metadata matching
  - Bulk import with validation
  - **KKPhim Crawler** for automated movie content import

- **Search & Discovery**
  - Full-text search
  - Vector search for content similarity
  - Intelligent movie recommendations

## 🛠️ Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js (App Router), React, TypeScript, TailwindCSS |
| **UI Components** | Shadcn/UI, Lucide Icons, React Hook Form |
| **Backend** | Next.js API Routes, tRPC |
| **Database** | MongoDB, Prisma ORM |
| **Authentication** | Firebase Auth |
| **State Management** | React Query, Context API |
| **Utilities** | Axios, Zod validation, date-fns |
| **Dev Tools** | ESLint, TypeScript, Prettier |
| **Deployment** | Vercel |

## 🚀 Getting Started

Follow these steps to set up the project:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Start development server
npm run dev

# OR for production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

> **Note:** For environment variables, refer to `.env.example` file in the project root and create your own `.env` file based on it.

## 📚 API Documentation

### Authentication

Most API routes under `/api` (excluding those under `/api/public` and specific auth routes) require authentication via Firebase Auth session cookies, typically managed by the frontend after login. Public API routes under `/api/public` often require a Firebase ID token passed in the request body or Authorization header (`Bearer <token>`).

### Key API Endpoints

#### Admin API (`/api`)

These routes are generally protected and require admin privileges or a valid user session.

**Authentication (`/api/auth`)**
*   `POST /api/auth/create-session`: Creates a session cookie after successful Firebase ID token verification.
*   `POST /api/auth/logout`: Clears the session cookie.
*   `POST /api/auth/refresh-session`: Verifies and potentially refreshes the session cookie.

**Movies (`/api/movies`)**
*   `GET /api/movies`: List all movies (admin view, pagination, basic filters).
*   `POST /api/movies`: Create a new movie.
*   `GET /api/movies/{movieId}`: Get details for a specific movie (admin view).
*   `PATCH /api/movies/{movieId}`: Update a specific movie.
*   `DELETE /api/movies/{movieId}`: Delete a specific movie.
*   `POST /api/movies/bulk-deletion`: Delete multiple movies by ID.
*   `POST /api/movies/check-import`: Check which movies (by slug) already exist in the database.
*   `POST /api/movies/filter`: Advanced filtering and searching for movies (admin view).
*   `POST /api/movies/import`: Bulk import movies, episodes, and servers from external data (e.g., KKPhim).
*   `POST /api/movies/update-movies`: Update existing movies based on external data (used by import process).

**Episodes (`/api/movies/episodes`)**
*   `GET /api/movies/{movieId}/episodes`: Get all episodes for a specific movie.
*   `POST /api/movies/{movieId}/episodes`: Add a new episode to a movie.
*   `PATCH /api/movies/episodes/{movieId}/{episodeId}`: Update an episode's details (e.g., name, slug).
*   `DELETE /api/movies/episodes/{movieId}/{episodeId}`: Delete an episode.
*   `POST /api/movies/episodes/{movieId}/{episodeId}`: Add a new streaming server to an episode. *(Note: Path seems unusual, might intend to be POST on `/.../servers`)*
*   `PATCH /api/movies/episodes/{movieId}/{episodeId}/{episodeServerId}`: Update an episode's streaming server.
*   `DELETE /api/movies/episodes/{movieId}/{episodeId}/{episodeServerId}`: Delete an episode's streaming server.

**Genres (`/api/genres`)**
*   `GET /api/genres`: List all genres.
*   `POST /api/genres`: Create a new genre.
*   `GET /api/genres/{genreId}`: Get details for a specific genre.
*   `PATCH /api/genres/{genreId}`: Update a specific genre.
*   `DELETE /api/genres/{genreId}`: Delete a specific genre.

**Countries (`/api/countries`)**
*   `GET /api/countries`: List all countries.
*   `POST /api/countries`: Create a new country.
*   `GET /api/countries/{countryId}`: Get details for a specific country.
*   `PATCH /api/countries/{countryId}`: Update a specific country.
*   `DELETE /api/countries/{countryId}`: Delete a specific country.

**Movie Types (`/api/movie-types`)**
*   `GET /api/movie-types`: List all movie types.
*   `POST /api/movie-types`: Create a new movie type.
*   `GET /api/movie-types/{movieTypeId}`: Get details for a specific movie type.
*   `PATCH /api/movie-types/{movieTypeId}`: Update a specific movie type.
*   `DELETE /api/movie-types/{movieTypeId}`: Delete a specific movie type.

**Users (`/api/users`)**
*   `GET /api/users`: Get the current authenticated user's details (admin/dashboard context).
*   `POST /api/users`: Create or update a user (likely intended for admin actions or specific scenarios).

**Uploads (`/api/uploads`)**

#### Public API (`/api/public`)

These routes are accessible by client applications (like Koflix-C) and may require ID token authentication for user-specific actions.

**Movies & Content**
*   `GET /api/public/movies/{movieId}`: Get public details for a specific movie, including episodes and servers. Optionally includes user interaction data if authenticated.
*   `POST /api/public/filter`: Filter and search movies for the public client (supports text search, vector search, genre, type, country, year filters).
*   `GET /api/public/genres`: Get a list of all genres for public display.
*   `GET /api/public/countries`: Get a list of all countries for public display.
*   `GET /api/public/types`: Get a list of all movie types for public display.

**Recommendations**
*   `POST /api/public/recommendations/recently-added`: Get recently added movies (optional limit).
*   `GET /api/public/recommendations/recently-added/type/{typeId}`: Get recently added movies filtered by type (optional limit).
*   `POST /api/public/recommendations/personalized/hybrid-for-you`: Get personalized movie recommendations for the authenticated user.
*   `POST /api/public/recommendations/personalized/recently-liked`: Get recommendations based on the authenticated user's recently liked movies.

**User Actions (`/api/public/user-movie`)**
*   `POST /api/public/user-movie/comments`: Create a new comment on a movie (requires ID token).
*   `GET /api/public/user-movie/comments`: Get comments for a movie with pagination.
*   `POST /api/public/user-movie/replies`: Create a reply to a comment (requires ID token).
*   `GET /api/public/user-movie/replies`: Get replies for a comment with pagination.
*   `POST /api/public/user-movie/interaction`: Record user interactions like LIKE, DISLIKE, RATE (requires ID token).
*   `POST /api/public/user-movie/view`: Record a movie view (increments view count, requires ID token).
*   `POST /api/public/user-movie/watch-history`: Create or update a watch history entry for an episode server (requires ID token).
*   `GET /api/public/user-movie/watch-history`: Get the authenticated user's watch history with pagination (requires ID token).
*   `POST /api/public/user-movie/watch-history/episode`: Get watch history details for a specific episode (requires ID token).

**User Profile (`/api/public/user`)**
*   `POST /api/public/user/create-user`: Create or update a user profile in the database based on Firebase authentication (requires ID token).
*   `POST /api/public/user/get-user`: Get the authenticated user's profile details from the database (requires ID token).
*   `POST /api/public/user/profile`: Update the authenticated user's profile (e.g., name, avatar) (requires ID token, handles image upload).

## 📁 Folder Structure Overview

```
koflix-a/
├── actions/              # Server actions for data fetching
├── app/                  # Next.js App Router
│   ├── (dashboard)/      # Dashboard routes and components
│   ├── api/              # API routes
│   └── layout.tsx        # Root layout
├── components/           # Shared UI components
│   ├── forms/            # Form components
│   ├── ui/               # UI components from shadcn
│   └── [...]             # Other components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configs
│   ├── api/              # API client setup
│   ├── utils/            # Helper functions
│   └── validations/      # Zod schemas
├── prisma/               # Prisma schema and migrations
│   ├── schema.prisma     # Database schema
│   └── [...]             # Generated files
├── providers/            # React context providers
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## 🔗 Related Projects

- [Koflix-C](https://github.com/pho-veteran/koflix-c) - Mobile client app for Android using React Native Expo
