# Techloom POS System (Task 1)

This repository contains the solution for **Task 1: POS Order & Inventory System**.

## Tech Stack
- **Backend**: Node.js (Express)
- **Database**: MySQL (using `mysql2/promise` for raw SQL and concurrency control)
- **Frontend**: React (Vite) + Vanilla CSS (Glassmorphism UI)
- **Concurrency Strategy**: `SELECT ... FOR UPDATE` row-level locking during checkout to prevent overselling.

## Setup Instructions

### 1. Database Setup
1. Open phpMyAdmin (`http://localhost/phpmyadmin/`).
2. Create a new database or simply import the `schema.sql` file provided in this folder.
3. The SQL script will create the `techloom_pos` database and insert 5 sample products.

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd task-01/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the database connection in `backend/.env` if your MySQL root user has a password. (Default is no password, user `root`).
4. Start the server:
   ```bash
   npm start
   ```
   *(Note: The server runs on port 3001. A cron job automatically runs every minute to expire reservations older than 5 minutes).*

### 3. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd task-01/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the provided local URL (usually `http://localhost:5173`) in your browser to view the beautiful POS interface.

## Testing the Features
- **Stock Reservation**: Add products to the cart and click "Checkout Now". The stock will decrease, and an order will be created in `Reserved` status.
- **Concurrency Safe**: Because we use `SELECT ... FOR UPDATE`, simultaneous checkouts on the same product will wait for the lock to release, guaranteeing no overselling.
- **Mock Payments**: After checkout, a modal appears. 
  - Click **Simulate Success** to confirm the order (`Paid` status).
  - Click **Simulate Failure** or **Timeout** to release the stock back into inventory and mark the order as `Failed` or `Expired`.
- **5-minute Timeout**: If you close the payment modal without acting, the backend cron job will automatically release the reserved stock after 5 minutes.
