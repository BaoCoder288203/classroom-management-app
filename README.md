# Classroom Management App

Real-time classroom tool for instructors and students: student management, lesson assignment, and Socket.io chat (text + image/file/emoji/sticker/GIF).

**Stack:** React (Vite) · Node.js / Express · Firebase (Firestore) · Socket.io · Infobip (SMS) · Nodemailer (email)

## Project structure

```
classroom-management-app/
├── backend/          # Express API + Socket.io + local chat uploads
│   ├── server.js
│   ├── uploads/      # chat files (gitignored)
│   └── src/
├── frontend/         # React + Vite SPA
│   └── src/
└── README.md
```

## Features

### Auth
- **Instructor:** phone number + 6-digit SMS OTP (`POST /api/auth/createAccessCode`, `validateAccessCode`)
- **Student day-to-day login:** email OTP (`POST /api/student/loginEmail`, `validateAccessCode`) — matches the challenge student API list
- **Account setup:** when instructor adds a student, email contains a setup link; student sets **username + password** (bcrypt hash). Username/password are stored for credentials/setup flow; daily login uses **email OTP** as in the spec routes (not a separate password-login API).
- JWT for protected API routes; `role` (`instructor` | `student`) in token + localStorage

### Instructor
- Manage students (add / edit / delete) with **Role** (always `student` for new learners)
- Student table shows **account status** and **lesson status** (pending/done summary)
- **Message** shortcut per student → opens chat focused on that student
- Assign lessons to one or more students
- 1-1 real-time chat (Socket.io + Firestore); media: text, image, file, emoji, sticker, GIF URL

### Student
- View assigned lessons and mark as done
- Edit profile (**name, username, phone**)
- Chat with instructors (same media types)

### Why student email is read-only on profile

Student **email is the login identity** for email OTP and is stored on messages as a **room participant** (`participants` / room id with instructor phone). Allowing email changes from profile would:

1. Break login until the code in Firebase and JWT identifier are migrated consistently  
2. Orphan past chat history under the previous email / room id  

To keep sessions and chat history stable, profile update **does not allow changing email**. Instructors can still update a student's email via **Edit Student** if operationally required (with care).

## Setup

### Prerequisites
- Node.js 18+ recommended  
- Firebase project + `serviceAccountKey.json`  
- Infobip (or SMS provider) + SMTP for email  

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
# Optional absolute URL for uploaded files (production)
# API_PUBLIC_URL=https://your-api.example.com
# Firebase + Infobip + email vars...
```

```bash
npm run dev
```

API: `http://localhost:3001`  
Static uploads: `http://localhost:3001/uploads/chat/...`

### Frontend

```bash
cd frontend
npm install
```

```env
VITE_API_URL=http://localhost:3001
```

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
| POST | `/api/chat/upload` | any JWT (multipart file) |

Socket: `join_room`, `join_user`, `send_message` (`type`, `text`, `fileUrl`, …), `chat_history`, `receive_message`.

## Screenshots

Screenshots for submission are **not stored in this repo**. They will be shared with HR via a Google Drive link when submitting the public GitHub URL.
