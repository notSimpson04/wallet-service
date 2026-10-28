# P2P Financial Wallet Service (Technical Assessment)

A production-grade, secure, and concurrent Peer-to-Peer (P2P) financial wallet microservice built with NestJS, TypeScript, Prisma ORM, and PostgreSQL. Designed with strict transactional isolation, idempotency guardrails, and administrative security controls.

---

## Live Production URL
 Base URL: https://wallet-service-1ks0.onrender.com
 Health Check: `GET /health`

---

## API Endpoints Summary

| Endpoint | Method | Description | Access / Guards |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | Service health check | Public |
| `/auth/register` | `POST` | Register a new user account and associated wallet | Public |
| `/auth/login` | `POST` | Authenticate user credentials, check blacklist status, and issue JWT | Public |
| `/wallets` | `GET` | Retrieve wallet balance and transaction history for authenticated user | Protected (JWT) |
| `/wallets/deposit` | `POST` | Credit funds to the authenticated user's wallet | Protected (JWT) |
| `/wallets/transfer` | `POST` | Execute P2P fund transfer (Wallet A to Wallet B) with row-level concurrency locking (`FOR UPDATE`) | Protected (JWT) |
| `/admin/blacklist` | `POST` | Add a user or actor to the security blacklist | Admin / Protected |
| `/admin/blacklist` | `GET` | List all blacklisted entities | Admin / Protected |
| `/admin/blacklist/:id` | `DELETE` | Remove an entity from the blacklist | Admin / Protected |
| `/users/:id/block` | `PATCH` | Block or restrict a user account | Admin / Protected |
| `/users/:id/unblock` | `PATCH` | Restore/unblock a restricted user account | Admin / Protected |


---

##  Tech Stack & Architecture
* Framework: NestJS (Modular architecture, Dependency Injection, Guard-based RBAC)
* Language: TypeScript
* Database & ORM: PostgreSQL hosted on Render, managed via Prisma ORM
* Authentication: Passport.js with JSON Web Tokens (JWT)
* Deployment: Render Web Service (Node.js runtime with automated migration deployment)

---

##  Core Design Decisions & Engineering Standards

### 1. Concurrency & Race Condition Safety (Financial Accuracy)
* The Problem: In high-throughput P2P transfers, parallel requests targeting the same source wallet can lead to race conditions (double-spending or negative balances).
* The Solution: Financial transfers are wrapped inside Prisma interactive transactions utilizing explicit row-level locking (`FOR UPDATE`). This guarantees that concurrent operations on the same wallet serialize correctly at the database level, maintaining strict mathematical balance consistency.

### 2. Transaction Integrity & Idempotency
* All fund transfers and deposits execute atomically. If any step fails (e.g., recipient account not found, insufficient funds, or blacklisted actor), the transaction rolls back completely to prevent orphan states.

### 3. Security & Blacklist Enforcement
* Actor Validation: Incoming requests extract the actor/user context via validated JWT headers.
* Blacklist Checks: Middleware/Guards cross-reference user identifiers against an administrative blacklist table prior to permitting login, deposits, or P2P transfers. Blocked or blacklisted accounts are immediately rejected with appropriate HTTP status codes.

---
