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
