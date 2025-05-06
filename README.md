# Koflix-A: Movie Streaming Admin & API Backend

<div align="center">
  <img src="https://github.com/pho-veteran/koflix-a/public/favicon.png" alt="Koflix Admin Logo" width="150" height="150" />
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

All API routes except public ones require authentication via Firebase Auth.

### Key API Endpoints

#### Movies
- `GET /api/movies` - List all movies with pagination and filters
- `GET /api/movies/{id}` - Get movie details
- `POST /api/movies` - Create a new movie
- `PATCH /api/movies/{id}` - Update movie
- `DELETE /api/movies/{id}` - Delete movie
- `POST /api/movies/import` - Import movies from external source

#### Episodes
- `GET /api/episodes` - List all episodes
- `GET /api/movies/{movieId}/episodes` - Get episodes for a movie
- `POST /api/movies/{movieId}/episodes` - Add episode to a movie
- `PATCH /api/episodes/{id}` - Update episode
- `DELETE /api/episodes/{id}` - Delete episode

#### Genres
- `GET /api/genres` - List all genres
- `POST /api/genres` - Create a new genre
- `PATCH /api/genres/{id}` - Update genre
- `DELETE /api/genres/{id}` - Delete genre

#### KKPhim Crawler
- `POST /api/crawl/kkphim` - Start crawling movies from KKPhim
- `GET /api/crawl/kkphim/status` - Check crawler status

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

- [Koflix-C](../koflix-c) - Mobile client app for Android using React Native Expo