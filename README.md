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

### 2.1) Backend prerequisites for teammates
- This backend targets .NET 10.
- The API reads the SQL Server connection string from `ConnectionStrings__DefaultConnection` at runtime.
- On Windows PowerShell, set it for the current session with:
```powershell
$env:ConnectionStrings__DefaultConnection = 'Data Source=AHMAD-MEDHAT200\SQLEXPRESS;Database=NeuroNoteDb;Integrated Security=True;TrustServerCertificate=True;'
```
- To persist it for your user account:
```powershell
[Environment]::SetEnvironmentVariable('ConnectionStrings__DefaultConnection', 'Data Source=AHMAD-MEDHAT200\SQLEXPRESS;Database=NeuroNoteDb;Integrated Security=True;TrustServerCertificate=True;', 'User')
```
- After setting the user variable, reopen VS Code or start a new terminal session.

### 3) Database
- Install SQL Server locally (or use Docker)
- Run scripts in order:
  1. `database/schema/001_initial_schema.sql`
  2. `database/seeds/001_seed_data.sql`
- For a shared dev database, set `ConnectionStrings__DefaultConnection` in your environment to point at the shared SQL Server instance.
- The local dev default database name is `NeuroNoteDb`.

### 4) EF Core schema workflow
- Create a migration after changing the EF model:
```bash
cd backend/NeuroNote.Api
dotnet ef migrations add <MigrationName>
```
- Apply migrations to the database:
```bash
cd backend/NeuroNote.Api
dotnet ef database update
```
- If the database is missing, create it by running `dotnet ef database update` after the connection string is set.

## Notes
- This repository was restructured from an MVC layout to a separated full-stack architecture.
- Keep cross-team contracts documented (API DTOs, DB naming, conventions).
