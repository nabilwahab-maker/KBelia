# Security Specification: NiagaBelia Kelantan

## Data Invariants
1. **User Identity Integrity**: Users can only create and edit their own UserProfile (`/users/{userId}`) where `userId == request.auth.uid`. Users cannot self-escalate `role: 'admin'`.
2. **Business Ownership**: A business listing (`/businesses/{businessId}`) can only be created with `ownerId == request.auth.uid`. Updates can only be made by the owner or an admin. Approval status (`isApproved`, `isFeatured`) can only be modified by an admin.
3. **Capsule Booking**: A booking application (`/capsule_bookings/{bookingId}`) must have `applicantId == request.auth.uid`. Normal applicants can create their booking and view their own bookings. Only admins can update the `status` ('approved' / 'rejected') and `adminNotes`.
4. **Capsule Slots**: Publicly readable. Only admins can create, update, or delete capsule slots.
5. **Products**: Products belong to a business and can only be created/updated by the owner of that business or an admin. Publicly readable.
6. **Programs / Announcements**: Publicly readable. Only admins can create, update, or delete programs.
7. **Admins**: Admin list is checked via `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or admin email `nabilwahab03020302@gmail.com`.

## Dirty Dozen Payloads Handled
1. Non-admin attempting to approve a business listing (`isApproved: true`).
2. User attempting to modify another user's business listing or products.
3. User attempting to create a capsule booking for a different `applicantId`.
4. Non-admin updating slot pricing or availability directly.
5. User attempting to set `role: 'admin'` during user profile registration.
6. Unauthenticated write attempts to any collection.
7. Payload containing oversized string or invalid data types.
8. Non-owner attempting to delete another user's product.
9. Modifying immutable ID fields (`ownerId`, `applicantId`, `createdAt`).
10. Unverified email writing protected data.
11. Injecting malicious keys outside the schema blueprint.
12. Attempting to bypass booking status approval workflow.
