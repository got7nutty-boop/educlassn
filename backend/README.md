# EduClassn Backend

Backend server for EduClassn - Student and Teacher Management System

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your Supabase credentials and configuration

## Running the Server

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

Server will run on `http://localhost:5000` by default

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user (requires token)

### Users
- `GET /api/users/:id` - Get user profile (requires token)
- `PUT /api/users/:id` - Update user profile (requires token)
- `DELETE /api/users/:id` - Delete user account (requires token)

### Health Check
- `GET /health` - Server health check

## Request Examples

### Register
```json
POST /api/auth/register
{
  "email": "student@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "student"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "student@example.com",
  "password": "password123"
}
```

### Get Profile
```
GET /api/users/:id
Header: Authorization: Bearer <token>
```

### Update Profile
```json
PUT /api/users/:id
Header: Authorization: Bearer <token>
{
  "fullName": "Jane Doe",
  "password": "newpassword123"
}
```

## Database Schema

Users table structure:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

- ✓ Password hashing with bcrypt
- ✓ JWT token authentication
- ✓ Email validation
- ✓ Password strength validation
- ✓ CORS protection
- ✓ Input validation

## Technologies

- Express.js - Web framework
- Supabase - Database & Backend
- JWT - Authentication
- bcryptjs - Password hashing
- CORS - Cross-origin support
- Validator - Input validation

## License

ISC
