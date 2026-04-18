# SchoolFlow - Multi-Branch School Management System

A modern, scalable School Management System (SaaS-ready) that supports multiple branches under one organization.

## Features

- **Multi-Branch Architecture** - Support for 3+ branches with isolated data
- **Role-Based Access Control** - Super Admin, Branch Admin, Teacher, Student, Parent
- **Student Management** - Add, edit, delete, assign to classes
- **Teacher Management** - Add, edit, assign subjects and classes
- **Class & Subject Management** - Create classes, assign subjects and teachers
- **Attendance System** - Daily attendance for students and teachers
- **Fees & Billing** - Create invoices, track payments, revenue analytics
- **Exams & Results** - Create exams, enter marks, generate report cards

## Tech Stack

### Backend
- Django 5.x
- Django REST Framework
- JWT Authentication (djangorestframework-simplejwt)
- PostgreSQL

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS
- TypeScript
- Lucide React Icons
- Recharts

## Project Structure

```
school-management/
├── backend/                 # Django API
│   ├── core/                # Core settings
│   ├── accounts/           # User authentication
│   ├── student/            # Student management
│   ├── teacher/            # Teacher management
│   ├── academics/          # Classes, subjects, exams
│   ├── attend/             # Attendance tracking
│   └── financeapp/         # Fees, invoices, payments
│
└── frontend/               # Next.js frontend
    ├── src/
    │   ├── app/            # Pages
    │   ├── components/     # UI components
    │   ├── contexts/       # React contexts
    │   └── lib/            # API utilities
    └── package.json
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables (see `.env` file)

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Create demo data:
   ```bash
   python manage.py create_demo_data
   ```

7. Start development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (see `.env.local`)

4. Start development server:
   ```bash
   npm run dev
   ```

## Demo Credentials

- **Super Admin**: `admin@school.com` / `admin123`
- **Branch Admin**: `admin_main@school.com` / `admin123`
- **Teacher**: `teacher_main@school.com` / `teacher123`

## API Endpoints

- `POST /api/accounts/login/` - Login
- `POST /api/accounts/logout/` - Logout
- `GET /api/accounts/me/` - Current user
- `GET /api/students/` - List students
- `GET /api/teachers/` - List teachers
- `GET /api/academics/classes/` - List classes
- `GET /api/academics/subjects/` - List subjects
- `GET /api/academics/exams/` - List exams
- `GET /api/attendance/students/` - Student attendance
- `POST /api/attendance/students/mark/` - Mark attendance
- `GET /api/finance/invoices/` - List invoices
- `GET /api/finance/invoices/dashboard/` - Finance dashboard

## Deployment

### Backend (Production)

1. Set environment variables:
   ```
   DEBUG=False
   ALLOWED_HOSTS=yourdomain.com
   ```

2. Run with Gunicorn:
   ```bash
   gunicorn core.wsgi:application --bind 0.0.0.0:8000
   ```

### Frontend (Production)

```bash
npm run build
npm start
```

## License

MIT