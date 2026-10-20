# RBAC Implementation Summary

## Overview
This document summarizes the changes made to implement Role-Based Access Control (RBAC) with admin and data enterer roles.

## Changed Files

### Database

**models/User.ts**
- Added `role` field with enum `["admin", "enterer"]` and default `"enterer"`
- Updated IUser interface to include `role: "admin" | "enterer"`

**scripts/set-user-role.mjs** (new)
- CLI script to update user roles
- Usage: `npm run set-role -- --username <username> --role <admin|enterer>`

### Backend

**lib/auth.ts** (new)
- `createSession()`: Creates JWT with userId, username, and role
- `getSession()`: Verifies and returns session from request
- `getSessionFromCookies()`: Verifies and returns session from cookies
- `requireRole()`: Middleware helper to check authentication and role authorization
- Sessions expire after 12 hours
- Cookies are httpOnly, secure in production, sameSite: 'lax'

**app/api/login/route.ts**
- Implements bcrypt password hashing for new passwords
- Migrates plain-text passwords to bcrypt on successful login
- Creates JWT session and sets httpOnly cookie
- Returns user with role information

**app/api/logout/route.ts** (new)
- Clears session cookie

**app/api/auth/me/route.ts** (new)
- Returns current session information (userId, username, role)
- Used by frontend to load session on mount

**app/api/accounts/route.ts** (new)
- GET: List all login accounts (admin only)
- POST: Create new account (admin only)
- Validates role permissions
- Prevents non-admins from creating admin accounts

**app/api/accounts/[id]/route.ts** (new)
- PUT: Update account (admin only)
- DELETE: Delete account (admin only)
- Prevents demoting/deleting the last admin (409 Conflict)
- Allows password changes (leave blank to keep current)

**middleware.ts** (new)
- Redirects unauthenticated users to /login
- Redirects enterers from /export and /accounts to /ravisabha
- Validates JWT from session cookie

### Protected API Routes

All routes now use `requireRole()` to enforce permissions:

**Both roles (admin + enterer):**
- app/api/ravisabha/route.ts: GET
- app/api/ravisabha/[id]/route.ts: GET
- app/api/users/route.ts: POST
- app/api/users/[id]/route.ts: GET
- app/api/attendance/route.ts: GET, POST, DELETE
- app/api/attendance/stats/route.ts: GET
- app/api/pre-attendance/route.ts: GET
- app/api/search/route.ts: GET
- app/api/users/candidates/route.ts: GET
- app/api/users/households/route.ts: GET

**Admin only:**
- app/api/ravisabha/route.ts: POST, PATCH
- app/api/ravisabha/[id]/route.ts: PUT, PATCH, DELETE
- app/api/users/[id]/route.ts: PUT, DELETE
- app/api/accounts/**: All methods

### Frontend

**components/AuthProvider.tsx**
- Removed localStorage-based authentication
- Loads session from GET /api/auth/me on mount
- Exposes: `user`, `role`, `isAdmin`, `isEnterer`
- Logout calls POST /api/logout to clear server-side cookie
- Login updates with role from server response

**components/Navbar.tsx**
- Shows role badge in user dropdown
- Reports and Accounts links visible to admins only
- Filters nav items by role

**app/login/page.tsx**
- Updated to handle role in login response

**app/ravisabha/page.tsx**
- Hides "Add New Ravisabha" button from enterers
- Hides "Edit" button on ravisabha cards from enterers

**components/UserCard.tsx**
- Hides "Edit" and "Delete" buttons from enterers
- Attendance toggle remains visible for both roles

**app/export/page.tsx**
- Shows "Access denied" for enterers
- Redirects enterers to /ravisabha
- Only fetches data for admins

**components/AttendanceProvider.tsx**
- `showPreAttendance` is true only when ravisabhaId exists AND user is admin
- Enterers don't see pre-attendance badges

**components/AxiosInterceptor.tsx** (new)
- Global axios interceptor for 403 responses
- Shows toast: "You don't have permission to do that."

**app/accounts/page.tsx** (new)
- Admin-only page to manage login accounts
- List accounts with role badges
- Create, edit, and delete accounts
- Access denied for non-admins

**components/AccountModal.tsx** (new)
- Form for creating/editing accounts
- Fields: username, password, role (radio buttons)
- Role descriptions for Admin and Data Enterer
- Password optional on edit (keeps current if blank)

**app/layout.tsx**
- Added AxiosInterceptor component

### Documentation

**docs/RBAC.md** (new)
- Role descriptions and permission matrix
- Role rules and enforcement details
- Authentication and session management
- Account management instructions

## Migration Notes

### Password Migration
Existing accounts with plain-text passwords will be automatically upgraded to bcrypt on their next successful login. No manual migration is required.

### Role Assignment
Existing accounts without a `role` field will default to "enterer" role. Use the script to promote users to admin:

```bash
npm run set-role -- --username admin_username --role admin
```

### Last Admin Protection
The system prevents:
- Demoting the last admin to enterer (returns 409)
- Deleting the last admin account (returns 409)

This ensures there's always at least one admin account in the system.

## Testing Checklist

- [x] Enterer can add SMK and non-SMK devotees
- [x] Enterer can mark attendance
- [x] Enterer cannot create/edit/delete Ravisabha
- [x] Enterer cannot edit/delete devotees
- [x] Enterer cannot see pre-attendance toggle
- [x] Enterer cannot access Reports page
- [x] Enterer cannot access Accounts page
- [x] Admin has full access to all features
- [x] Admin can create accounts with both roles
- [x] Admin cannot be demoted if they're the last admin
- [x] Logout clears session cookie
- [x] 403 responses show toast notification
- [x] Build completes without errors

## Security Features

1. **Server-side validation**: Every protected route validates role with `requireRole()`
2. **HttpOnly cookies**: JWT stored in httpOnly cookie, not accessible to JavaScript
3. **Password hashing**: All passwords hashed with bcrypt (10 rounds)
4. **Automatic migration**: Plain-text passwords upgraded transparently on login
5. **Session expiration**: 12-hour JWT expiration
6. **CSRF protection**: sameSite: 'lax' cookie setting
7. **Secure in production**: Secure flag enabled when NODE_ENV=production
8. **Last admin protection**: Prevents system lockout
