# Student Club Backend

## Project overview
This is a Node.js + Express + MongoDB web app for a Student Club system.  
There are 3 fixed clubs: **sports**, **debate**, **music**.  
Users can register/login, join clubs, and create resources (**event** or **post**).  
Each user can edit/delete **only their own** resources.

## Setup and installation
1. Install dependencies:
   npm install
2. Create `.env` in the project root:
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/student_club_backend
   JWT_SECRET=super_secret_key_123
3. Run the server:
   npm start
4. Open:
   http://localhost:3000

## API documentation

### Auth (public)
- POST `/api/auth/register` (public)  
  Body: `{ "name": "Asem", "email": "a@a.com", "password": "123456" }`
- POST `/api/auth/login` (public)  
  Body: `{ "email": "a@a.com", "password": "123456" }`

### Users (private, Bearer token)
- GET `/api/users/profile` (private)
- PUT `/api/users/profile` (private)  
  Body: `{ "name": "New Name" }` or `{ "joinClubSlug": "debate" }`

### Clubs (public)
- GET `/api/clubs` (public)
- GET `/api/clubs/:slug` (public)

### Resources (private, Bearer token)
- POST `/api/resource` (private)  
  Body for post: `{ "clubSlug":"debate","type":"post","title":"Hi","description":"..." }`  
  Body for event: `{ "clubSlug":"debate","type":"event","title":"Meet","description":"...","date":"2026-02-10T10:00:00.000Z","location":"Room 101" }`
- GET `/api/resource` (private) -> only my resources
- GET `/api/resource/:id` (private) -> only if owner
- PUT `/api/resource/:id` (private) -> only if owner
- DELETE `/api/resource/:id` (private) -> only if owner
- GET `/api/resource/club/:slug` (private) -> club feed (joined users only)
