# Team Workflow

## Branching
- `main` is protected/stable.
- Feature branches:
  - `feat/frontend/...`
  - `feat/backend/...`
  - `feat/database/...`

## PR Rules
- At least one reviewer from affected team.
- Backend API changes require frontend team awareness.
- DB schema changes require backend validation.

## Cross-Team Contract
- API contract documented in backend Swagger/OpenAPI.
- Breaking changes require issue + migration notes.

## Local Backend Setup
- The backend targets .NET 10.
- Teammates should set `ConnectionStrings__DefaultConnection` locally rather than committing it to JSON.
- PowerShell session value:
```powershell
$env:ConnectionStrings__DefaultConnection = 'Data Source=AHMAD-MEDHAT200\SQLEXPRESS;Database=NeuroNoteDb;Integrated Security=True;TrustServerCertificate=True;'
```
- Persistent user value:
```powershell
[Environment]::SetEnvironmentVariable('ConnectionStrings__DefaultConnection', 'Data Source=AHMAD-MEDHAT200\SQLEXPRESS;Database=NeuroNoteDb;Integrated Security=True;TrustServerCertificate=True;', 'User')
```
- After changing the user variable, restart VS Code or open a new terminal so the API can read it.
- EF workflow for schema changes:
```bash
cd backend/NeuroNote.Api
dotnet ef migrations add <MigrationName>
dotnet ef database update
```
