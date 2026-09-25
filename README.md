# Saffron Restaurant Management System (MERN)

## Requirements
Node.js 18+, MongoDB running locally, npm.

## Run backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
Windows: copy `.env.example` to `.env` manually, or run `copy .env.example .env`.

## Run frontend (new terminal)
```bash
cd client
npm install
npm run dev
```
Open the local URL Vite prints (usually http://localhost:5173). Register an account, then log in.

## Modules
Dashboard, menu, orders, reservations, customers, billing/payments, inventory, staff, reports, login and registration.

## IMPORTANT: Educational demo only
Login is a demonstration only: it stores the user's profile in browser localStorage, not an authenticated server session. API CRUD routes have **no authentication or authorization**, so anyone who can access the backend can modify records. Do not expose this app publicly or use real customer data until secure sessions, server-side access controls, input validation and proper order/payment processing are implemented. The logout button clears local browser state only.

Orders currently accept a manually entered total; production billing should calculate totals from server-side menu prices. Table availability conflict prevention and real payment gateways are not implemented in this starter.

## Additional API features
- `POST /api/orders`: send `items: [{"menuId":"<MongoDB menu _id>","quantity":2}]`; server fetches current menu prices and calculates `total`. The basic admin UI still supports manual totals for demo records.
- `POST /api/reservations` and `PUT /api/reservations/:id`: reject an active reservation for the same table, date and exact time with HTTP 409. This is a basic conflict check, not a concurrency-safe or duration-aware booking engine.
- Example reservation: `{"name":"Guest","phone":"9999999999","date":"2026-10-01","time":"19:00","guests":2,"tableNumber":3}`.

**Security:** These APIs are not access-controlled. Use only on localhost with test data.
