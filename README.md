# Pharmacy Laboratory Management System

A full-stack Pharmacy Laboratory Management System built for B.Pharm practical laboratory operations.

## Tech Stack

- Frontend: React.js, Vite, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: JWT
- Charts: Recharts
- PDF Reports: PDFKit
- QR Codes: qrcode

## Features

### Roles
- Admin
- Lab Instructor
- Student

### Modules
- Authentication and role-based access
- Semester, subject, and lab management
- Experiment management
- Chemical solutions and stock tracking
- Equipment inventory with QR codes
- Attendance management
- Student practical records and evaluation
- Notifications
- Analytics and PDF reporting

## Project Structure

- backend/ - Express API, MongoDB models, routes, middleware
- frontend/ - React application

## Prerequisites

Install the following before running the project:

- Node.js 18+
- npm 9+
- MongoDB Community Server or MongoDB Atlas

## Environment Setup

Backend environment file:

Create or update [backend/.env](backend/.env) with:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/pharma_lab_db
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d
```

## Installation

### Backend

1. Open the backend folder
2. Install dependencies
3. Start the development server

### Frontend

1. Open the frontend folder
2. Install dependencies
3. Start the development server

## Development Commands

### Backend
- `npm install`
- `npm run dev`
- `npm run seed`

### Frontend
- `npm install`
- `npm run dev`
- `npm run build`

## Database Seeding

Seed example data from the backend folder:

- `npm run seed`

This creates demo users, semesters, subjects, labs, experiments, solutions, and equipment.

## Demo Credentials

- Admin: `admin@pharmalab.com` / `admin123`
- Instructor: `ravi@pharmalab.com` / `instructor123`
- Instructor: `priya@pharmalab.com` / `instructor123`
- Student: `ananya@pharmalab.com` / `student123`
- Student: `rohan@pharmalab.com` / `student123`

## Running the App

1. Ensure MongoDB is running
2. Start backend on port 5000
3. Start frontend on port 3000
4. Open `http://localhost:3000`

## API Overview

Main API groups:

- `/api/auth`
- `/api/users`
- `/api/semesters`
- `/api/subjects`
- `/api/labs`
- `/api/experiments`
- `/api/solutions`
- `/api/equipment`
- `/api/attendance`
- `/api/records`
- `/api/reports`
- `/api/notifications`

## Deployment Notes

### Backend
- Set production environment variables
- Use a managed MongoDB instance in production
- Serve uploads from persistent storage
- Run behind a reverse proxy if needed

### Frontend
- Build using `npm run build`
- Deploy the `dist/` folder to any static hosting platform
- Update API proxy/base URL for production

## Notes

- Uploaded files are stored in the backend uploads directory
- JWT tokens are stored on the client side
- QR codes are generated for equipment entries
- PDF student reports are generated from backend report routes
