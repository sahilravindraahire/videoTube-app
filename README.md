# VideoTube Backend

A RESTful backend API for a video-sharing platform built with Node.js, Express, and MongoDB.

## Tech Stack

- **Runtime** — Node.js with Express
- **Database** — MongoDB with Mongoose
- **Auth** — JWT (access + refresh tokens)
- **File Storage** — Cloudinary (videos, thumbnails, avatars)
- **File Uploads** — Multer

## Features

- User auth — register, login, logout, refresh token, change password
- Video management — upload, update, delete, publish/unpublish, view count
- Comments — add, edit, delete, paginated fetch per video
- Likes — toggle like on videos, comments, and tweets
- Playlists — create, manage, add/remove videos
- Subscriptions — subscribe/unsubscribe, fetch subscribers and subscriptions
- Tweets — create, edit, delete, fetch per user
- Dashboard — channel stats (total views, likes, subscribers, videos)
- Watch history

## Project Structure

```
src/
├── controllers/     # Route handlers
├── models/          # Mongoose schemas
├── routes/          # Express routers
├── middlewares/     # Auth (JWT) and file upload (Multer)
└── utils/           # asyncHandler, ApiError, ApiResponse, Cloudinary helpers
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Environment Variables

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:5173

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## API Endpoints

All routes are prefixed with `/api/v1`.

| Resource | Base Path |
|---|---|
| Users | `/users` |
| Videos | `/videos` |
| Comments | `/comments` |
| Likes | `/likes` |
| Playlists | `/playlist` |
| Subscriptions | `/subscriptions` |
| Tweets | `/tweets` |
| Dashboard | `/dashboard` |

Protected routes require a `Bearer` token in the `Authorization` header or an `accessToken` cookie.
