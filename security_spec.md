# District Portal Security Specification

## Data Invariants
1. A user cannot self-assign a role or approve their own account.
2. Only approved users can access the Admin Panel.
3. Every write to `audit_logs` must be immutable.
4. Public users can only read "PUBLISHED" articles.
5. Grievances can be created anonymously but tracking must be unique.
6. Volunteer activities must be linked to a valid user profile.

## The "Dirty Dozen" Payloads (Deny List)
1. User profile update: `{ role: "SUPER_ADMIN" }` by current user.
2. Article creation: `{ status: "PUBLISHED" }` by a non-manager.
3. Reading `audit_logs` as a generic user.
4. Deleting an `analytics_event`.
5. Modifying `createdAt` on any document.
6. Creating a grievance with a 2MB description string.
7. Updating a project's `status` after it's marked `CLOSED`.
8. Setting `email_verified: true` in the DB manually (spoofing).
9. Blanket read on `users` collection.
10. Creating a volunteer record for another UID.
11. Content manager deleting a `Role`.
12. Anonymous user reading the `config` collection.

## Tests to Implement
I will verify these invariants in `firestore.rules`.
