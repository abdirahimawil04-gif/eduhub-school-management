# School Management System - Specification Document

## 1. Project Overview

**Project Name:** SchoolFlow - Multi-Branch School Management System  
**Project Type:** SaaS-ready Web Application  
**Core Functionality:** A comprehensive school management platform supporting multiple branches under a single organization with role-based access control, student/teacher management, attendance, fees, exams, and analytics.  
**Target Users:** School administrators, teachers, students, parents, and super admins

---

## 2. Technical Architecture

### Backend Stack
- **Framework:** Django 5.x + Django REST Framework
- **Authentication:** JWT (djangorestframework-simplejwt)
- **Database:** PostgreSQL (16)
- **Multi-tenancy:** Branch-based data isolation using tenant schema pattern

### Frontend Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State Management:** React Context + SWR/React Query
- **Charts:** Recharts
- **Icons:** Lucide React

### Project Structure
```
school-management/
├── backend/                 # Django API
│   ├── core/                # Core settings, tenants
│   ├── accounts/           # User authentication & profiles
│   ├── students/           # Student management
│   ├── teachers/           # Teacher management
│   ├── academic/           # Classes, subjects, exams
│   ├── attendance/         # Attendance tracking
│   ├── finance/            # Fees, invoices, payments
│   └── requirements.txt
│
└── frontend/               # Next.js frontend
    ├── app/                # App router pages
    ├── components/         # Reusable UI components
    ├── contexts/           # React contexts
    ├── hooks/             # Custom hooks
    ├── lib/               # API utilities
    └── tailwind.config.js
```

---

## 3. Multi-Branch Architecture

### Branch Model
- Each branch has: name, code, address, phone, email, logo
- Branch admins can only see/manage their branch data
- Super admin can access all branches

### Data Isolation
- All queries filtered by current user's branch
- API serializers include branch context
- Middleware ensures branch context in requests

---

## 4. User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full system access, all branches, manage branch admins |
| **Branch Admin** | Full branch access, manage teachers/students/finance |
| **Teacher** | View assigned classes, manage attendance, enter marks |
| **Student** | View profile, attendance, marks, fees |
| **Parent** | View child info, attendance, marks, fees |

### Role Hierarchy
- Super Admin (Organization Owner)
  - Branch Admin (per branch)
    - Teacher
    - Student
    - Parent

---

## 5. UI/UX Specification

### Color Palette
```css
--primary: #3B82F6 (Blue 500)
--primary-dark: #1E40AF (Blue 800)
--primary-light: #DBEAFE (Blue 100)
--secondary: #10B981 (Emerald 500)
--accent: #F59E0B (Amber 500)
--danger: #EF4444 (Red 500)
--success: #22C55E (Green 500)
--warning: #F59E0B (Amber 500)
--background: #F8FAFC (Slate 50)
--surface: #FFFFFF
--text-primary: #1E293B (Slate 800)
--text-secondary: #64748B (Slate 500)
--border: #E2E8F0 (Slate 200)
--dark-bg: #0F172A (Slate 900)
--dark-surface: #1E293B (Slate 800)
```

### Typography
- **Headings:** Inter (Google Fonts)
- **Body:** Inter
- **Monospace:** JetBrains Mono (for codes/IDs)

### Font Sizes
- h1: 2.5rem (40px), font-weight: 700
- h2: 2rem (32px), font-weight: 600
- h3: 1.5rem (24px), font-weight: 600
- h4: 1.25rem (20px), font-weight: 500
- body: 1rem (16px), font-weight: 400
- small: 0.875rem (14px), font-weight: 400

### Spacing System
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

### Layout Structure

#### Sidebar (Fixed, 280px width)
- Logo + Branch selector (for branch admins)
- Navigation sections:
  - Dashboard
  - Academic (Students, Teachers, Classes, Subjects, Exams)
  - Attendance
  - Finance (Fees, Invoices, Payments)
  - Reports
  - Settings
- User profile at bottom
- Collapsible on mobile (hamburger menu)

#### Top Header (64px height)
- Page title + Breadcrumbs
- Search bar (global search)
- Notifications bell
- User dropdown (profile, settings, logout)

#### Main Content Area
- Padding: 24px
- Max-width: 1400px
- Responsive grid for cards (1 col mobile, 2 col tablet, 3-4 col desktop)

### Component Specifications

#### Cards
- Background: white
- Border-radius: 12px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Padding: 24px
- Hover: slight elevation increase

#### Buttons
- Primary: Blue background, white text
- Secondary: White background, blue border
- Danger: Red background, white text
- Border-radius: 8px
- Padding: 10px 20px
- Transitions: 150ms ease

#### Tables
- Striped rows (alternate #F8FAFC)
- Sticky header
- Sortable columns
- Pagination (25, 50, 100 per page)
- Row hover highlight

#### Forms
- Input fields with labels above
- Validation messages below fields
- Focus state: blue ring
- Error state: red border + message

#### Charts
- Consistent color scheme matching palette
- Tooltips on hover
- Legend positioned appropriately

### Animations
- Page transitions: fade in (200ms)
- Card hover: translateY(-2px) + shadow increase
- Button press: scale(0.98)
- Loading states: skeleton placeholders
- Toast notifications: slide in from top-right

### Responsive Breakpoints
- Mobile: < 640px (1 column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (3-4 columns)

---

## 6. Database Schema

### Core Models

#### Organization
- name, logo, address, phone, email, created_at

#### Branch
- organization (FK)
- name, code, address, phone, email, logo, is_active

#### User (Abstract)
- email, password, role, branch (FK), is_active, created_at

#### Student
- user (OneToOne)
- admission_number (unique per branch)
- first_name, last_name, gender, DOB
- photo, phone, address
- parent_name, parent_phone, parent_email
- class_section (FK)
- roll_number
- admission_date

#### Teacher
- user (OneToOne)
- employee_id (unique per branch)
- first_name, last_name, gender, DOB
- photo, phone, address
- qualification, experience
- salary, join_date
- subjects (M2M), class_teacher (FK)

#### ClassSection
- branch (FK)
- name (e.g., "Class 10 - A")
- class_level (e.g., 10)
- section (e.g., "A")
- class_teacher (FK)

#### Subject
- branch (FK)
- name, code
- class_section (FK)
- teacher (FK)

#### Exam
- branch (FK)
- name, type (terminal, unit, final)
- start_date, end_date
- class_section (FK)
- subjects (M2M)

#### ExamResult
- exam (FK)
- student (FK)
- subject (FK)
- marks, grade, remarks

#### Attendance (Student)
- student (FK)
- date, status (present, absent, late, leave)
- marked_by (FK teacher)
- remarks

#### Attendance (Teacher)
- teacher (FK)
- date, status
- marked_by (FK)

#### FeeStructure
- branch (FK)
- class_section (FK)
- name, amount, due_date
- is_recurring, frequency (monthly, termly, yearly)

#### Invoice
- branch (FK)
- student (FK)
- invoice_number (unique per branch)
- issue_date, due_date
- status (draft, sent, paid, partial, overdue)
- total_amount, paid_amount

#### InvoiceItem
- invoice (FK)
- fee_structure (FK)
- description, amount

#### Payment
- invoice (FK)
- amount, payment_date
- payment_method (cash, bank, online)
- transaction_id, notes
- received_by (FK teacher)

#### AcademicYear
- branch (FK)
- name (e.g., "2024-2025")
- start_date, end_date
- is_current

---

## 7. API Endpoints

### Authentication
- POST /api/auth/login/
- POST /api/auth/logout/
- POST /api/auth/refresh/
- GET /api/auth/me/

### Branches
- GET /api/branches/ (Super Admin only)
- POST /api/branches/
- GET /api/branches/{id}/
- PUT /api/branches/{id}/

### Students
- GET /api/students/
- POST /api/students/
- GET /api/students/{id}/
- PUT /api/students/{id}/
- DELETE /api/students/{id}/

### Teachers
- GET /api/teachers/
- POST /api/teachers/
- GET /api/teachers/{id}/
- PUT /api/teachers/{id}/

### Classes & Subjects
- GET /api/classes/
- POST /api/classes/
- GET /api/subjects/
- POST /api/subjects/

### Attendance
- GET /api/attendance/students/
- POST /api/attendance/students/mark/
- GET /api/attendance/teachers/
- POST /api/attendance/teachers/mark/

### Exams & Results
- GET /api/exams/
- POST /api/exams/
- GET /api/results/
- POST /api/results/
- GET /api/results/student/{id}/

### Finance
- GET /api/fees/
- POST /api/fees/
- GET /api/invoices/
- POST /api/invoices/
- POST /api/invoices/{id}/payments/
- GET /api/finance/dashboard/

---

## 8. Feature Specifications

### Dashboard (Role-specific)
**Super Admin:**
- Total branches count
- Total students, teachers
- Revenue overview (chart)
- Recent activities

**Branch Admin:**
- Students count, teachers count
- Today's attendance %
- Pending fees
- Revenue this month
- Quick actions

**Teacher:**
- Assigned classes
- Today's attendance to mark
- Recent results entered
- Class performance summary

**Student:**
- Attendance %
- Upcoming exams
- Pending fees
- Recent marks

### Student Management
- List with filters (class, section, status)
- Quick search by name/admission number
- Bulk import (CSV)
- Profile view with tabs (details, attendance, fees, results)
- Edit with form validation
- Transfer to another class

### Teacher Management
- List with search
- Profile with assigned subjects/classes
- Attendance tracking
- Salary information (optional)

### Attendance System
- Date picker to select date
- Class selector to choose class
- Auto-populate student list
- Mark all present/absent buttons
- Individual toggle
- Save with confirmation
- View historical data with filters

### Fees & Finance
- Create fee structure (per class)
- Generate bulk invoices for class
- Manual invoice for individual
- Record payment with receipt
- Send reminder (optional)
- Dashboard with:
  - Total collected vs pending
  - Month-wise collection chart
  - Top debtors list

### Exams & Results
- Create exam with date range
- Select classes and subjects
- Enter marks (by subject teacher)
- Auto-calculate grades
- Generate report card (PDF)

---

## 9. Acceptance Criteria

### Authentication
- [ ] Users can login with email/password
- [ ] JWT tokens work correctly
- [ ] Role-based redirect after login
- [ ] Logout clears session

### Multi-Branch
- [ ] Super admin can create/edit branches
- [ ] Branch admin sees only their branch
- [ ] Data isolation works correctly
- [ ] Branch selector in UI works

### Student Management
- [ ] Can add new student with all fields
- [ ] Can edit student details
- [ ] Can delete student (soft delete)
- [ ] Can assign to class
- [ ] Can view student profile

### Teacher Management
- [ ] Can add/edit teachers
- [ ] Can assign subjects
- [ ] Can view teacher profile

### Attendance
- [ ] Can mark student attendance
- [ ] Can view attendance history
- [ ] Attendance reports work

### Finance
- [ ] Can create fee structure
- [ ] Can generate invoices
- [ ] Can record payments
- [ ] Dashboard shows correct data

### Exams
- [ ] Can create exam
- [ ] Can enter marks
- [ ] Can view results

### UI/UX
- [ ] Modern, clean design
- [ ] Responsive on mobile/tablet
- [ ] Fast loading (no lag)
- [ ] Smooth transitions
- [ ] Charts render correctly

### Security
- [ ] Passwords hashed
- [ ] Protected routes by role
- [ ] Data isolation enforced

---

## 10. Deployment Configuration

### Environment Variables (Backend)
```
SECRET_KEY=...
DEBUG=False
ALLOWED_HOSTS=domain.com
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET_KEY=...
```

### Environment Variables (Frontend)
```
NEXT_PUBLIC_API_URL=https://api.domain.com
```

### Server (Ubuntu + Nginx + Gunicorn)
- Gunicorn for Django
- Next.js custom server or standalone export
- Nginx reverse proxy
- SSL via Let's Encrypt