# P2P Financial Wallet Service (Technical Assessment)

A production-grade, secure, and concurrent Peer-to-Peer (P2P) financial wallet microservice built with NestJS, TypeScript, Prisma ORM, and PostgreSQL. Designed with strict transactional isolation, idempotency guardrails, and administrative security controls.

---

## Live Production URL
 Base URL: https://wallet-service-1ks0.onrender.com
 Health Check: `GET /health`

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

## Local Development Setup

### Prerequisites
* Node.js (v18+ recommended)
* PostgreSQL instance (local or remote)

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/notSimpson04/wallet-service.git](https://github.com/notSimpson04/wallet-service.git)
   cd wallet-service
