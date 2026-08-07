# Classroom Management App

Real-time classroom tool for instructors and students: student management, lesson assignment, and Socket.io chat.

**Stack:** React (Vite) · Node.js / Express · Firebase (Firestore) · Socket.io · Infobip (SMS) · Nodemailer (email)

## Project structure

```
classroom-management-app/
├── backend/          # Express API + Socket.io
│   ├── server.js
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       ├── services/
│       ├── socket/
│       └── config/
├── frontend/         # React + Vite SPA
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/
│       └── styles/
└── docs/
    └── screenshots/  # App screenshots for submission
```

## Features

### Auth
- **Instructor:** phone number + 6-digit SMS OTP (`POST /api/auth/createAccessCode`, `validateAccessCode`)
- **Student:** email OTP (`POST /api/student/loginEmail`, `validateAccessCode`)
- Account setup via emailed link (`/setup-account?token=...`) with username + hashed password
- JWT for protected API routes

### Instructor
- Manage students (add / edit / delete)
- Assign lessons to one or more students
- View assigned lessons and statuses
- 1-1 real-time chat with students (Socket.io + Firestore history)

### Student
- View assigned lessons and mark as done
- Edit profile (name, username, phone; email is read-only)
- Chat with instructor

## Setup

### Prerequisites
- Node.js 18+
- Firebase project + service account JSON
- Infobip (or compatible) SMS credentials
- SMTP / Gmail App Password for email

### Backend

```bash
cd backend
npm install
```

Create `backend/.env` (do not commit):

```env
PORT=3001
JWT_SECRET=your-secret
FRONTEND_URL=http://localhost:5173
# Firebase + Infobip + email vars as in your existing .env
```

Place Firebase `serviceAccountKey.json` (gitignored) as required by the backend config.

```bash
npm run dev
# or: node server.js
```

API default: `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_INSTRUCTOR_PHONE=+84xxxxxxxxx
```

`VITE_INSTRUCTOR_PHONE` must match the instructor phone used at login (same format as JWT identifier) so students join the correct chat room.

```bash
npm run dev
```

App: `http://localhost:5173`

## Main API routes

| Method | Path | Role |
|--------|------|------|
| POST | `/api/auth/createAccessCode` | public |
| POST | `/api/auth/validateAccessCode` | public |
| POST | `/api/student/loginEmail` | public |
| POST | `/api/student/validateAccessCode` | public |
| POST | `/api/student/setupAccount` | setup token |
| GET | `/api/student/myLessons` | student JWT |
| POST | `/api/student/markLessonDone` | student JWT |
| GET | `/api/student/profile` | student JWT |
| PUT | `/api/student/editProfile` | student JWT |
| POST | `/api/instructor/addStudent` | instructor JWT |
| GET | `/api/instructor/students` | instructor JWT |
| GET | `/api/instructor/lessons` | instructor JWT |
| POST | `/api/instructor/assignLesson` | instructor JWT |
| GET/PUT/DELETE | `/api/instructor/student/:phone` | instructor JWT |

Socket events: `join_room`, `leave_room`, `send_message`, `chat_history`, `receive_message`.  
Room id = sorted pair of instructor phone + student email.

## Screenshots

Add captures under `docs/screenshots/` and link them here after you run the app:

| Screen | File |
|--------|------|
| Login | `docs/screenshots/login.png` |
| Manage students | `docs/screenshots/students.png` |
| Assign lessons | `docs/screenshots/lessons.png` |
| Student lessons | `docs/screenshots/my-lessons.png` |
| Chat | `docs/screenshots/chat.png` |
| Setup account | `docs/screenshots/setup-account.png` |

Example:

```md
![Login](docs/screenshots/login.png)
```
