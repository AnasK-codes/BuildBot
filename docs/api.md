# BuildBot API Documentation

All requests require an `Authorization: Bearer <token>` header except Registration and Login.

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
**Response:** Returns `accessToken` (15m) and `refreshToken` (7d).

---

## App Definition APIs (Metadata Engine)

### 3. Create or Update App Definition
`POST /api/apps` (or `PUT /api/apps/:appId`)

Generates the metadata schema. Uses stable IDs (`ent_...`, `fld_...`) to track evolution.

```json
{
  "appName": "CRM",
  "entities": [
    {
      "id": "ent_customer",
      "name": "Customer",
      "fields": [
        {
          "id": "fld_name",
          "name": "fullName",
          "type": "string",
          "required": true
        }
      ]
    }
  ]
}
```
*Note: If passing breaking changes during a `PUT`, you must pass `?forcePublishBreaking=true` in the URL.*

---

## Dynamic CRUD APIs (Runtime Engine)

Use the dynamic catch-all route to interact with your data.

### 4. Create Record
`POST /api/apps/:appId/:entitySlug`
```json
{
  "fullName": "Alice Smith"
}
```

### 5. Read Record
`GET /api/apps/:appId/:entitySlug/:recordId`

### 6. List Records (Cursor Pagination)
`GET /api/apps/:appId/:entitySlug?limit=50&cursor=rec_1234`

### 7. Update Record (Partial)
`PATCH /api/apps/:appId/:entitySlug/:recordId`
```json
{
  "fullName": "Alice Johnson"
}
```

### 8. Delete Record (Soft Delete)
`DELETE /api/apps/:appId/:entitySlug/:recordId`
