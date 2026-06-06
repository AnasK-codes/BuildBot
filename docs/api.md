# BuildBot API Documentation

All protected requests require authentication via an `accessToken` cookie or an `Authorization: Bearer <token>` header, except Registration and Login.

## Authentication
### 1. Register User
`POST /api/auth/register`
```json
{
  "email": "demo@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 2. Login
`POST /api/auth/login`
```json
{
  "email": "demo@example.com",
  "password": "password123"
}
```

### 3. Reviewer Login
`POST /api/auth/reviewer`
Instantly provisions a session for the default reviewer account (`reviewer@buildbot.local`).

---

## Workspace APIs

### 4. Create Project
`POST /api/projects`
Generates a new web application from a prompt using the AI Provider.
```json
{
  "prompt": "A sleek calculator app"
}
```
**Response:** Returns `projectId` and the generated version data.

### 5. Fetch Project & Latest Version
`GET /api/projects/:projectId`
Returns the project metadata and the most recent `ProjectVersion` (containing `html`, `css`, `js`).

### 6. Refine Project
`POST /api/projects/:projectId/refine`
Sends a follow-up prompt to modify the existing codebase. The backend passes the current codebase context to the AI alongside the new instructions.
```json
{
  "prompt": "Make the background dark and the text white"
}
```
**Response:** Returns the newly created `ProjectVersion` snapshot.

### 7. List Version History
`GET /api/projects/:projectId/versions`
Returns an ordered list of all `ProjectVersion` snapshots for the specified project, tracking the prompts that generated each state.

### 8. Rollback Version
`POST /api/projects/:projectId/versions/:version/rollback`
Restores a previous version by cloning its code and appending it as the newest version in the timeline.
**Response:** Returns the newly appended `ProjectVersion`.

### 9. Export Project
`GET /api/projects/:projectId/export`
Downloads a `.zip` file containing `index.html`, `style.css`, and `script.js` populated with the raw code from the active version.
