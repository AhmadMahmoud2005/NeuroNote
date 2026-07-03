# NeuroNote Architecture

## Overview
NeuroNote is organized as a monorepo with clear boundaries:

- `frontend/` Angular SPA
- `backend/` ASP.NET Core API
- `database/` SQL Server scripts

## Request Flow
1. Angular client calls REST endpoints in the API.
2. API validates/authenticates request.
3. API executes business logic and talks to SQL Server.
4. API returns JSON response to frontend.

## Suggested Conventions
- API base route: `/api/v1`
- Keep DTOs versioned and backward-compatible when possible.
- Use database migration files with incremental numbering.
