# Security Specification: NiagaBelia Kelantan

## Data Invariants
1. **Mutual Role Exclusion & Identity Integrity (`/users/{userId}`)**: Users can only create and update their own UserProfile where `userId == request.auth.uid`. Normal users cannot self-assign `role: 'admin'`, `role: 'mentor'`, or set/modify `mentorId`.
2. **Business Ownership (`/businesses/{businessId}`)**: A business listing can only be created with `ownerId == request.auth.uid` and `isFeatured == false`. Updates are limited to owner-editable fields (`isApproved` and `isFeatured` are Admin-locked).
3. **Capsule Bookings & Slots (`/capsule_bookings/{bookingId}`, `/capsule_slots/{slotId}`)**: Bookings belong strictly to `applicantId == request.auth.uid` (Mentors have zero access). Youth applicants can only create `pending` bookings and update tenancy/contact fields; only Admins can change `status` ('approved'/'rejected') or `adminNotes`. Only Admins can write `capsule_slots`.
4. **Grant Applications (`/grant_applications/{grantId}`)**: Strictly private to the youth `applicantId` and Admins. **Mentors have zero read/list access** to `grant_applications` (bank account numbers, MyKad/SSM details).
5. **Mentor Profiles (`/mentor_profiles/{mentorId}`)**: Publicly readable for the clinic directory. A Mentor may only update their own mentor profile where their `users/{uid}.mentorId == mentorId` (and cannot alter `id`).
6. **Mentorship Sessions (`/mentor_sessions/{sessionId}`)**: Strictly scoped to (a) Admins, (b) the assigned Mentor whose `users/{uid}.mentorId == resource.data.mentorId`, and (c) the Youth applicant (`resource.data.applicantId == request.auth.uid`). Youth can only create `pending` sessions or update `status` to `'cancelled'`. Only the owning Mentor (matching `mentorId`) or Admin can confirm/complete sessions or write `mentorActionPlan`, `notes`, `meetingLink`.
7. **Grant Endorsements & Mentor Logs (`/mentor_endorsements/{id}`, `/mentor_logs/{id}`)**: No blanket signed-in reads! Endorsements are readable ONLY by Admin, the issuing Mentor (`resource.data.mentorId == getMentorId()`), or the target Mentee (`resource.data.menteeId == request.auth.uid`). Mentor logs are strictly private to Admin and the issuing Mentor (`resource.data.mentorId == getMentorId()`).
8. **Cashflow & Maintenance (`/cashflow_records`, `/maintenance_tickets`)**: Cashflow records belong strictly to Youth `ownerId == request.auth.uid` (and Admin). Mentors have zero access.
9. **Notifications (`/notifications/{notifId}`)**: Readers may only `get`/`list` notifications addressed to `targetRole == 'all'`, their role (`'mentor'` / `'youth'`), or their specific `targetUserId == request.auth.uid` (plus Admin). Recipients can only update `isRead` on their own targeted notifications.
10. **Admins**: Verified via `request.auth.token.email_verified == true` for authorized admin emails (`nabilwahab03020302@gmail.com`, `s24b0382@siswa.umk.edu.my`) or `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`.
11. **Portal News (`/portal_news/{newsId}`)**: Only Admins may create, update, pin, publish/unpublish, or delete news items. Authenticated non-admin users (Belia & Mentor) may only `get`/`list` items where `status == 'published'` (drafts are strictly Admin-only at the database level).

## Dirty Dozen Payloads Handled
1. Youth user attempting to set `role: 'mentor'` or `mentorId: 'mentor-1'` via `users/{uid}` create or update.
2. Mentor A (`mentor-1`) attempting to `get`, `list`, `create`, or `update` `mentor_sessions`, `mentor_endorsements`, or `mentor_logs` with `mentorId: 'mentor-2'`.
3. Mentor A (`mentor-1`) attempting to update `mentor_profiles/mentor-2`.
4. Mentor attempting to `get` or `list` `/grant_applications` or `/capsule_bookings` or `/cashflow_records`.
5. Youth user attempting to self-approve a `mentor_sessions` document (`status: 'confirmed'`) instead of `'cancelled'`.
6. Youth user attempting to read another user's `/mentor_endorsements` or `/notifications` addressed to a different `targetUserId`.
7. Unverified email claiming admin email (`email_verified == false`) attempting admin writes.
8. Non-admin attempting to modify `/capsule_slots`, `/programs`, or `/portal_settings`.
9. Injecting ghost/shadow keys outside the `firebase-blueprint.json` allowlist on any collection.
10. Oversized string or array payloads exceeding blueprint `maxLength` / list bounds (`Denial of Wallet` protection).
11. Modifying immutable ownership/relation fields (`ownerId`, `applicantId`, `mentorId`, `userId`, `createdAt`) on update.
12. Unauthenticated write or private PII read attempts against any collection.
13. Non-admin (Belia/Mentor) attempting to `get`/`list` a `draft` document or write/delete `/portal_news/{newsId}`.
