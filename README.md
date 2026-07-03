# NeuroNote

Full-stack graduation project structure:

- **Frontend**: Angular (`frontend/`)
- **Backend**: ASP.NET Core Web API (`backend/`)
- **Database**: SQL Server scripts (`database/`)

## Project Structure

```text
NeuroNote/
├── frontend/                # Angular app
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── ...
├── backend/                 # .NET Web API
│   ├── NeuroNote.Api/
│   ├── NeuroNote.sln
│   └── ...
├── database/                # SQL Server schema, seeds, migrations
│   ├── schema/
│   ├── seeds/
│   └── migrations/
├── docs/                    # Architecture and team guides
└── README.md
```

## Team Responsibilities

### Frontend Team
Work inside `frontend/`:
- UI components, pages, routing
- API integration services
- state management

### Backend Team
Work inside `backend/`:
- REST API endpoints
- business logic
- authentication/authorization
- data access

### Database Team
Work inside `database/`:
- schema design
- seed data
- versioned migration scripts

## Quick Start

### 1) Frontend
```bash
cd frontend
npm install
npm start
```

### 2) Backend
```bash
cd backend/NeuroNote.Api
dotnet restore
dotnet run
```

### 3) Database
- Install SQL Server locally (or use Docker)
- Run scripts in order:
  1. `database/schema/001_initial_schema.sql`
  2. `database/seeds/001_seed_data.sql`

## Notes
- This repository was restructured from an MVC layout to a separated full-stack architecture.
- Keep cross-team contracts documented (API DTOs, DB naming, conventions).
