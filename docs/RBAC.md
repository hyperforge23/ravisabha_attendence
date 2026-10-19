# Role-Based Access Control (RBAC)

## Overview

The application implements role-based access control with two roles: **Admin** and **Data Enterer**.

## Roles

### Admin
- Full access to all features
- Can create, edit, and delete Ravisabha events
- Can add, edit, and delete devotees (both SMK and non-SMK)
- Can mark and unmark attendance
- Can toggle pre-attendance status
- Can view and export reports
- Can manage login accounts and assign roles
- Can promote users to admin

### Data Enterer
- Limited access focused on data entry
- Can view Ravisabha list and details (read-only)
- Can add new devotees (SMK and non-SMK)
- Can mark attendance (add attendance records)
- Cannot create, edit, or delete Ravisabha events
- Cannot edit or delete devotees
- Cannot toggle pre-attendance status
- Cannot access Reports page
- Cannot manage login accounts

## Permission Matrix

| Action | Admin | Data Enterer |
|--------|-------|--------------|
| View Ravisabha list and details | ✓ | ✓ |
| Create, edit, or delete Ravisabha | ✓ | ✗ |
| Add a new devotee (SMK or non-SMK) | ✓ | ✓ |
| Edit or delete a devotee | ✓ | ✗ |
| Mark or unmark presence (attendance toggle) | ✓ | ✓ |
| Pre-attendance toggle | ✓ | ✗ |
| Search, households, candidates, attendance stats | ✓ | ✓ |
| Non-SMK page (add only; no edit or delete) | ✓ | ✓ |
| View and export Reports (/export and export APIs) | ✓ | ✗ |
| Create, edit, or delete login accounts | ✓ | ✗ |
| Assign the admin role | ✓ | ✗ |

## Role Rules

### Server-Side Enforcement
1. **Only admins can set `role: "admin"`**: An enterer who attempts to create or promote an admin account will receive a 403 Forbidden response.

2. **Only admins can change any account's role**: Role modification is restricted to admin users only.

3. **The last admin cannot be demoted or deleted**: The system prevents demoting or deleting the last remaining admin account. Returns 409 Conflict.

4. **All protected routes validate role server-side**: The client is never the only check. Every protected API route uses `requireRole()` to validate authentication and authorization.

### Client-Side Behavior
1. **Enterers cannot see admin-only controls**: UI elements for admin-only actions are hidden from enterers (e.g., Add/Edit Ravisabha buttons, Edit/Delete devotee buttons).

2. **Enterers are redirected from admin-only pages**: Attempting to access `/export` or `/accounts` redirects enterers to `/ravisabha`.

3. **Pre-attendance indicators are hidden**: Pre-attendance badges and toggles are not shown to enterers.

4. **403 errors show toast notifications**: When an enterer attempts an unauthorized action, they see a toast message: "You don't have permission to do that."

## Authentication

### Password Hashing
- New passwords are hashed with bcryptjs (10 rounds)
- Existing plain-text passwords are migrated to bcrypt on first successful login
- This allows existing accounts to continue working while upgrading security

### Session Management
- JWT tokens stored in httpOnly cookies
- 12-hour session expiration
- Secure flag enabled in production
- sameSite: 'lax' for CSRF protection
- Session contains: userId, username, and role

### Endpoints
- `POST /api/login` - Authenticate and create session
- `POST /api/logout` - Clear session cookie
- `GET /api/auth/me` - Get current session info

## Managing Accounts

### Creating Admin Accounts
Use the script to promote an existing user to admin:

```bash
node scripts/set-user-role.mjs --username <username> --role admin
```

### Account Management UI
Admins can manage accounts through the `/accounts` page:
- Create new accounts with username, password, and role
- Edit existing accounts (change username, password, or role)
- Delete accounts (except the last admin)
- View all login accounts with role badges

## Default Behavior

- Accounts without a role field default to "enterer"
- Existing accounts are treated as enterers until upgraded
- The first user should be promoted to admin using the script
