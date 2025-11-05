# JDU Librarian System - Copilot Instructions

## 📋 Project Overview
This is a full-stack library management system built with React + Vite frontend and Express + Prisma backend. The system manages user accounts, book loans/reservations, fines, notifications, and includes a social "channels" feature for posts, comments, and reactions.

## 🏗️ Architecture & Structure

### Monorepo Layout
- `frontend/` - React 19 app with TypeScript, Vite, React Router 7, MUI, Tailwind CSS
  - `src/components/` - Reusable React components (common, layout, books, users, etc.)
  - `src/pages/` - Page components (manager, librarian sections)
  - `src/api/` - API client code with Axios
  - `src/types/` - TypeScript type definitions
  - `src/store/` - Zustand state management
- `backend/` - Node.js/Express API with TypeScript
  - `src/api/*/` - Feature modules (controller, service, route, validation pattern)
  - `src/middlewares/` - Express middlewares
  - `src/config/` - Configuration files
  - `src/utils/` - Utility functions
  - `prisma/` - Database schema, migrations, and seed files
  - `src/api/__tests__/` - Jest + Supertest tests

### Database
- **PostgreSQL** via Prisma ORM
- Default database name: `library_db`
- Use Prisma Client for all database operations
- Run migrations with `npx prisma migrate dev`

## 🔧 Development Tools & Commands

### Package Management
- **Use npm** (NOT Bun, NOT yarn) - the project uses `package-lock.json`
- Install dependencies: `npm install`
- Frontend: `cd frontend && npm install`
- Backend: `cd backend && npm install`

### Backend Commands
- Development: `npm run dev` (runs on port 5000)
- Build: `npm run build`
- Production: `npm start`
- Tests: `npm test` (Jest + Supertest)
- Database seed: `npm run db:seed`
- Prisma migrations: `npx prisma migrate dev`

### Frontend Commands
- Development: `npm run dev` (runs on port 5173)
- Build: `npm run build`
- Lint: `npm run lint`
- Preview: `npm run preview`

### Database Operations
- Use Prisma Client for database queries (NOT raw psql)
- Migrations: `npx prisma migrate dev`
- Seed: `npm run db:seed` (from backend directory)
- Reset: `npm run db:reset` (from backend directory)

## 📝 Code Standards

### TypeScript
- **MANDATORY**: Fix TypeScript errors after ALL changes
- Use proper typing throughout - NO `any` unless absolutely necessary
- Follow existing type patterns in `frontend/src/types/` and backend interfaces

### Code Organization
- **Backend API Pattern**: Each feature has `controller.ts`, `service.ts`, `route.ts`, and `validation.ts`
- **Frontend Components**: Organize by feature/domain in `components/` subdirectories
- **ONLY modify relevant code** - Do NOT touch unrelated code
- **PRESERVE**: existing formatting, names, and documentation unless explicitly requested
- **FOLLOW EXISTING PATTERNS**: Always check similar existing code before creating new features

### Code Quality
- ✅ Handle errors properly and validate inputs
- ✅ Never expose secrets or credentials
- ✅ Write clear, readable, type-safe code
- ✅ Remove debug console.logs before committing
- ✅ Use Zod for validation (both frontend and backend use Zod)

## ⚡ Development Workflow

### Before Making Changes
1. Run `git status` to check current state
2. Review relevant existing code to understand patterns
3. Check README.md for project-specific setup requirements

### During Development
- Make small, incremental changes
- Test changes immediately after making them
- Follow the existing code structure and naming conventions
- For backend API changes: Update controller → service → route
- For frontend changes: Update components → pages → API client

### Testing
- Backend tests use Jest + Supertest
- Test files in `backend/src/api/__tests__/`
- Run tests with `npm test` from backend directory
- Use test database (`.env.test` configuration)

### Environment Variables
- Backend uses `.env` for local development
- Example environment variables in README.md
- **NEVER** commit `.env` files or expose secrets

## 🎯 Key Conventions

### API Development
- Use Express 5 async handlers
- Validate requests with Zod schemas
- Follow RESTful conventions
- Document endpoints with Swagger/JSDoc comments
- Return consistent error responses

### Frontend Development
- Use React 19 with functional components and hooks
- State management with Zustand
- Form handling with React Hook Form + Zod validation
- Styling with MUI components + Tailwind CSS utilities
- API calls through centralized Axios client

### Database
- Use Prisma schema enums (Role, UserStatus, BookCopyStatus, LoanStatus, etc.)
- Never bypass Prisma Client for data access
- Keep migrations organized and named clearly

## 📐 General Principles
- 🎯 **Simplicity first**: Prefer readable code over clever solutions
- 🎯 **Incremental**: Start with minimal working functionality, then enhance
- 🎯 **Consistency**: Match existing code style throughout the codebase
- 🎯 **Type Safety**: Leverage TypeScript strictly
- 🎯 **Error Handling**: Always handle errors gracefully with user-friendly messages
