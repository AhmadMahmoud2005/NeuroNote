# NeuroNote — AI Context File

> This file is a concise, machine-readable overview of the NeuroNote project.
> It is meant to help AI assistants (and new contributors) understand the
> repository structure, conventions, and current state quickly.

## 1. Project Summary

NeuroNote is a full-stack graduation project: a collaborative note-taking and
workspace application. It is organized as a monorepo with three clear layers.

- **Frontend**: Angular 18 SPA (`frontend/`)
- **Backend**: ASP.NET Core Web API (.NET 10) (`backend/`)
- **Database**: SQL Server, managed via EF Core migrations + raw SQL scripts (`database/`)

## 2. Repository Layout

```text
NeuroNote/
├── CLAUDE.md                 # This file — AI/contributor quick context
├── README.md                 # Human-facing project overview + quick start
├── docker-compose.yml        # SQL Server container for local dev
├── docs/
│   ├── architecture.md       # Request flow + suggested conventions
│   ├── team-workflow.md
│   └── README.md
├── database/
│   ├── schema/001_initial_schema.sql   # Legacy raw SQL schema (Users + Notes only)
│   ├── seeds/001_seed_data.sql
│   └── migrations/README.md
├── backend/
│   ├── NeuroNote.sln
│   └── NeuroNote.Api/
│       ├── NeuroNote.Api.csproj        # net10.0, EF Core SqlServer, Swagger
│       ├── Program.cs                  # App pipeline: DbContext, CORS, Swagger, Controllers
│       ├── appsettings.json
│       ├── Data/NeuroNoteDbContext.cs  # EF Core model configuration (source of truth)
│       ├── Models/                     # Domain entities
│       │   ├── User.cs, Role.cs, UserRole.cs
│       │   ├── Workspace.cs, WorkspaceMember.cs, Invitation.cs
│       │   ├── Page.cs, Block.cs, Comment.cs
│       │   └── ActivityLog.cs
│       ├── Migrations/                 # EF Core migrations (do not edit by hand)
│       └── Controllers/HealthController.cs
└── frontend/
    ├── package.json                    # Angular 18, name: "final-project"
    ├── angular.json
    └── src/
        ├── main.ts, index.html, styles.css
        └── app/
            ├── app.component.*         # Root component
            ├── app.config.ts           # provideRouter + provideHttpClient
            ├── app.routes.ts           # Route table (see below)
            ├── landing/                # home, about
            ├── auth/                   # login, sign-up
            ├── all-pages/              # Pages listing view
            ├── new-page/               # Create page view
            ├── tasks/                  # Tasks view
            ├── search/                 # Search view
            ├── settings/               # User settings view
            ├── slide-bar/              # Sidebar navigation
            └── services/
                ├── search.service.ts   # Mock search (no backend yet)
                └── settings.service.ts # Calls https://localhost:5001/api/v1 + localStorage fallback
```

## 3. Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | Angular 18 (standalone components), RxJS, TypeScript 5.5 |
| Backend    | ASP.NET Core Web API, .NET 10, EF Core 10 (SqlServer)  |
| Database   | Microsoft SQL Server 2022 (Docker image available)     |
| Tooling    | Swagger (dev only), Karma/Jasmine (frontend tests)      |

## 4. Backend Details

### 4.1 Entry point — `Program.cs`
- Registers `NeuroNoteDbContext` with SQL Server (`DefaultConnection`).
- Adds controllers, Swagger, and a CORS policy `AllowFrontend` for
  `http://localhost:4200` (Angular dev server).
- Dev environment enables Swagger UI.
- Pipeline: `HttpsRedirection` → `Cors` → `Authorization` → `MapControllers`.

### 4.2 NuGet packages
- `Microsoft.EntityFrameworkCore.SqlServer` 10.0.0
- `Microsoft.EntityFrameworkCore.Design` 10.0.0
- `Swashbuckle.AspNetCore` 6.6.2

### 4.3 Domain model (EF Core is the source of truth)

The EF Core configuration in `Data/NeuroNoteDbContext.cs` defines the real,
current schema. The raw SQL file `database/schema/001_initial_schema.sql` is
**legacy/outdated** (only `Users` + `Notes`) and does not reflect the latest
model. Prefer EF migrations.

Entities and relationships:

- **User** — `Id`, `FullName`, `Email` (unique), `PasswordHash`, timestamps.
- **Role** / **UserRole** — many-to-many between Users and Roles.
- **Workspace** — `Name`, `Slug` (unique), `Description`, `OwnerUserId` → User.
- **WorkspaceMember** — join table (WorkspaceId, UserId), `MemberRole`.
- **Invitation** — `Email`, `Token` (unique), `MemberRole`, `Status`,
  `WorkspaceId`, `InvitedByUserId`.
- **Page** — belongs to Workspace, optional `ParentPageId` (self-reference),
  `CreatedByUserId`, `Title`, `Slug`, `MetadataJson`, `IsArchived`, `SortOrder`.
- **Block** — belongs to Page, optional `ParentBlockId` (self-reference),
  `Type`, `Content`, `SortOrder`. Represents content blocks inside a page.
- **Comment** — belongs to User + Page, `Content`.
- **ActivityLog** — audit entry: `ActionType`, `Description`, `MetadataJson`,
  linked to User, Workspace, Page (all `DeleteBehavior.NoAction`).

### 4.4 Migrations
- `20260703180009_AddWorkspaceCollaborationSchema`
- `20260703180235_FixActivityLogDeleteBehavior`

Commands (run from `backend/NeuroNote.Api`):
```bash
dotnet ef migrations add <Name>
dotnet ef database update
```

### 4.5 Connection string
- Read at runtime from env var `ConnectionStrings__DefaultConnection`.
- Local dev default DB name: `NeuroNoteDb`.
- Example (PowerShell):
  ```powershell
  $env:ConnectionStrings__DefaultConnection = 'Data Source=AHMAD-MEDHAT200\SQLEXPRESS;Database=NeuroNoteDb;Integrated Security=True;TrustServerCertificate=True;'
  ```

## 5. Frontend Details

### 5.1 Routes (`app.routes.ts`)
| Path        | Component           |
|-------------|---------------------|
| `''`        | redirect → `home`   |
| `home`      | HomeComponent       |
| `about`     | AboutComponent      |
| `login`     | LoginComponent      |
| `register`  | SignUpComponent     |
| `all-pages` | AllPagesComponent   |
| `tasks`     | TasksComponent      |
| `new-page`  | NewPageComponent    |
| `search`    | SearchComponent     |
| `settings`  | SettingsComponent   |

### 5.2 Services
- `SearchService` — **mock only**, filters in-memory data, no HTTP calls.
- `SettingsService` — calls `https://localhost:5001/api/v1` for profile/avatar
  and falls back to `localStorage` on error. Endpoints used:
  - `GET /users/{id}/profile`
  - `PUT /users/{id}/profile`
  - `POST /users/{id}/avatar`

### 5.3 Commands
```bash
cd frontend
npm install
npm start      # ng serve on http://localhost:4200
npm run build
npm test
```

## 6. Running the Stack

1. **Database** — start SQL Server:
   ```bash
   docker compose up -d sqlserver
   ```
   or use a local SQL Server instance.
2. **Backend**:
   ```bash
   cd backend/NeuroNote.Api
   dotnet restore
   dotnet ef database update   # apply migrations
   dotnet run
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 7. Conventions

- API base route (suggested): `/api/v1`.
- Keep DTOs versioned and backward-compatible.
- EF Core migrations are the source of truth for the DB schema.
- Raw SQL scripts in `database/` are legacy/educational; do not rely on them
  for the current model.
- Frontend uses standalone Angular components (no NgModules).
- CORS is restricted to `http://localhost:4200` in the backend.

## 8. Known Gaps / Current State

- Only `HealthController` exists in the backend; most API endpoints referenced
  by the frontend (users/profile, search, pages, tasks) are **not implemented**
  yet on the backend.
- `SearchService` is fully mock-based.
- `SettingsService` expects the API at `https://localhost:5001` and silently
  falls back to `localStorage` when the backend is unavailable.
- No authentication/authorization middleware is wired in `Program.cs` yet
  (only `app.UseAuthorization()` is present, with no auth scheme configured).
- The legacy SQL schema (`database/schema`) is out of sync with the EF Core
  model — use EF migrations instead.

## 9. Where to Make Common Changes

| Task                         | Start here                                              |
|------------------------------|---------------------------------------------------------|
| Add a new API endpoint        | `backend/NeuroNote.Api/Controllers/` + register in DI if needed |
| Change DB schema              | Edit `Models/` + `Data/NeuroNoteDbContext.cs`, then `dotnet ef migrations add` |
| Add a frontend page           | Create component folder under `src/app/`, add route in `app.routes.ts` |
| Add a frontend service        | `src/app/services/`, inject via `providedIn: 'root'`    |
| Update API base URL (frontend)| `settings.service.ts` (`apiUrl`)                        |
| Configure CORS origins       | `Program.cs` (`AllowFrontend` policy)                   |