# Mang Kape — Firestore Security Specification

## 1. Data Invariants
1. **Menu Integrity**: Only verified admins (`joannouf@gmail.com` or `/admins/{uid}`) may create, update, or delete `/menuItems/{itemId}`. All visitors may read the public menu.
2. **PII Isolation**: `/users/{userId}` holds customer email and display name and is strictly readable only by the owning verified user (`request.auth.uid == userId`) or an admin. List queries on `/users` are forbidden for non-admins.
3. **Self-Assigned Privilege Prevention**: Users cannot create or mutate `/admins/{uid}` and cannot include extra role keys (`role`, `isAdmin`) in `/users/{userId}` due to strict `keys().hasOnly(...)` schema validation.
4. **Order Ownership & State Machine**: A user may only create `/orders/{orderId}` with `userId == request.auth.uid`, `status == 'received'`, and server timestamps `request.time`. Customers cannot skip states or modify completed/cancelled orders; they may only cancel while `status == 'received'`. Only admins can transition orders through `preparing -> ready -> completed`.
5. **Loyalty Bounds**: New user profiles start with exactly `50` welcome points. Order point adjustments are strictly bounded (`<= +1000` per write) and `loyaltyPoints >= 0 && loyaltyPoints <= 100000`.
6. **Temporal & ID Integrity**: All document IDs must satisfy `^[a-zA-Z0-9_-]+$` (`<= 128` chars), `createdAt` must equal `request.time` on create and remain immutable on update, and `updatedAt` must equal `request.time` on every write.
7. **Analytics Integrity**: `/pageStats/{pageId}` restricts `pageId` to known storefront sections, restricts `get`/`list` reads and resets strictly to verified admins, and bounds public view increments strictly to `+1` per write with server timestamps.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Menu Write**: Anonymous user attempts `setDoc('/menuItems/latte', ...)` -> `PERMISSION_DENIED`.
2. **Customer Price Tampering**: Signed-in non-admin customer attempts `updateDoc('/menuItems/latte', { priceCents: 1 })` -> `PERMISSION_DENIED`.
3. **Unverified Email Spoof**: User with `email: "joannouf@gmail.com"` and `email_verified: false` attempts menu write -> `PERMISSION_DENIED`.
4. **Self-Admin Escalation**: Customer attempts `setDoc('/admins/<myUid>', { email: '...' })` -> `PERMISSION_DENIED`.
5. **Shadow Role Field on User Create**: Customer attempts `setDoc('/users/<myUid>', { ..., isAdmin: true })` -> `PERMISSION_DENIED` (`hasOnly` rejects).
6. **Welcome Point Inflation**: Customer attempts `setDoc('/users/<myUid>', { ..., loyaltyPoints: 99999 })` -> `PERMISSION_DENIED` (create requires `loyaltyPoints == 50`).
7. **Cross-User PII Read**: Customer A attempts `getDoc('/users/<customerB_uid>')` -> `PERMISSION_DENIED`.
8. **Blanket Order Scraping**: Customer A runs `getDocs(collection(db, 'orders'))` without `where('userId', '==', uid)` -> `PERMISSION_DENIED` (`allow list` checks `resource.data.userId == request.auth.uid`).
9. **Identity Spoofing on Order Create**: Customer A creates order with `userId: '<customerB_uid>'` -> `PERMISSION_DENIED`.
10. **Order State Shortcutting**: Customer A creates order with `status: 'ready'` or updates own order to `status: 'completed'` -> `PERMISSION_DENIED`.
11. **Terminal State Mutation**: Customer A attempts to cancel an order whose status is already `'completed'` -> `PERMISSION_DENIED`.
12. **ID Poisoning / Payload Exhaustion**: Attacker writes document with 1500-char ID or 50-item array or client-forged timestamp -> `PERMISSION_DENIED`.
