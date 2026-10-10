# Task Management System (Level 2 – Intermediate)

A full-stack MERN task manager with JWT authentication, bcrypt password hashing, task CRUD, filtering, status updates, deadlines, and a React dashboard.

## Tech stack
- MongoDB + Mongoose
- Express + Node.js
- React + Vite
- JWT + bcryptjs
- Axios + React Router

## Requirements
- Node.js 18+
- MongoDB local installation or MongoDB Atlas account

## 1. Configure and run the backend
```bash
cd server
copy .env.example .env
npm install
```
Edit `server/.env` and set `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL`. Then:
```bash
npm run dev
```
Backend runs at `http://localhost:5000`.

## 2. Configure and run the frontend
Open a second terminal:
```bash
cd client
npm install
copy .env.example .env
npm run dev
```
Open the Vite URL printed in the terminal (normally `http://localhost:5173`).

## Windows note
In PowerShell, `copy .env.example .env` works. On macOS/Linux use `cp .env.example .env`.

## Main features
- Register and log in
- Passwords hashed using bcrypt
- JWT-protected API endpoints
- Create, read, update, and delete personal tasks
- Search by title/description
- Filter by status and priority
- Add due dates and update task status
- Responsive dashboard with overdue indicators

## API documentation
Base URL: `http://localhost:5000/api`

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| GET | `/health` | No | Server health check |
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Log in |
| GET | `/auth/me` | Yes | Current user |
| GET | `/tasks` | Yes | List current user's tasks; supports `status`, `priority`, `search` |
| POST | `/tasks` | Yes | Create task |
| GET | `/tasks/:id` | Yes | Get one owned task |
| PUT | `/tasks/:id` | Yes | Update owned task |
| DELETE | `/tasks/:id` | Yes | Delete owned task |

Send protected requests with:
`Authorization: Bearer YOUR_JWT_TOKEN`

### Example create-task body
```json
{
  "title": "Finish project report",
  "description": "Complete the documentation",
  "priority": "High",
  "status": "In Progress",
  "dueDate": "2026-11-01"
}
```

## MongoDB schema
### User
- `name`: String, required
- `email`: String, required, unique, normalized to lowercase
- `password`: String, required, bcrypt hash
- timestamps

### Task
- `user`: ObjectId reference to User, required
- `title`: String, required, max 120 characters
- `description`: String, optional, max 2000 characters
- `status`: `Pending | In Progress | Completed`
- `priority`: `Low | Medium | High`
- `dueDate`: Date, optional
- timestamps

## Deployment checklist
1. Create a MongoDB Atlas cluster and database user.
2. Deploy `server` to Render or another Node hosting provider. Add environment variables from `.env.example`.
3. Set `CLIENT_URL` to your deployed frontend URL.
4. Deploy `client` to Vercel or Netlify. Set `VITE_API_URL` to `https://YOUR-BACKEND-DOMAIN/api`.
5. In MongoDB Atlas Network Access, allow the backend host to connect. For a quick learning test, temporary `0.0.0.0/0` access is possible, but restrict it for production.
6. Test register, login, task CRUD, filters, and deadlines on the deployed URL.

## GitHub
Create a repository, then from this project folder:
```bash
git init
git add .
git commit -m "Build MERN Task Management System"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/task-management-system.git
git push -u origin main
```
Never commit `.env` or real secrets.

## Important
This is a learning-ready starter project. Before production use, add rate limiting, email verification, password reset, stronger monitoring, and a dedicated security review.
