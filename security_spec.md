# Security Specification & Test Matrix

## 1. Data Invariants
- **Identity Invariant**: Only the authenticated user whose `request.auth.uid` matches `{userId}` can read, list, create, update, or delete trade documents under `/users/{userId}/trades/{tradeId}` and their profile at `/users/{userId}`.
- **Relational Integrity**: Every trade record MUST have `userId == request.auth.uid`. No user can create or update trades on behalf of another user.
- **Payload Boundaries**: All string fields are bounded by strict `.size()` constraints (e.g. symbol <= 32, setup <= 64, notes <= 5000). Numerical fields (prices, quantities, P&L) must be valid numbers.
- **Tamper Resistance**: `userId` is immutable once created.
- **Default Deny**: All other collections and paths default to `read, write: if false;`.

## 2. The "Dirty Dozen" Malicious & Invalid Payloads
1. **Unauthenticated Read**: Anonymous/unauthenticated user tries to read `/users/test-user/trades/trade1`. Must result in `PERMISSION_DENIED`.
2. **Cross-Tenant Read**: User A authenticated tries to read User B's `/users/userB/trades/trade1`. Must result in `PERMISSION_DENIED`.
3. **Cross-Tenant List**: User A authenticated queries `/users/userB/trades`. Must result in `PERMISSION_DENIED`.
4. **Identity Spoof Create**: User A attempts to create a trade with `userId: "userB"` under `/users/userA/trades/trade1`. Must result in `PERMISSION_DENIED`.
5. **Path Escaping Write**: User A attempts to write a trade to `/users/userB/trades/trade1`. Must result in `PERMISSION_DENIED`.
6. **Denial of Wallet (Huge String)**: Payload with a 100KB symbol string or notes > 10,000 characters. Must result in `PERMISSION_DENIED`.
7. **Invalid Side Enum**: Trade created with `side: "LEVERAGED_YOLO"` instead of `LONG` or `SHORT`. Must result in `PERMISSION_DENIED`.
8. **Invalid Asset Class**: Trade created with `assetClass: "UNSPECIFIED"`. Must result in `PERMISSION_DENIED`.
9. **Invalid Status**: Trade created with `status: "MOONING"`. Must result in `PERMISSION_DENIED`.
10. **Immutability Breach**: User A tries to update an existing trade changing `userId` to `userB`. Must result in `PERMISSION_DENIED`.
11. **Arbitrary Root Document Write**: User A attempts to write to `/admin_secrets/passwords`. Must result in `PERMISSION_DENIED`.
12. **Malicious Path ID Poisoning**: Path ID containing invalid characters or length > 128 characters like `/users/userA/trades/../../etc/passwd`. Must result in `PERMISSION_DENIED`.
