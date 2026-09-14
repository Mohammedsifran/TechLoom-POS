# TechLoom.ai Software Engineer Intern Assessment

**Candidate:** Mohammed Sifran  
**Repository:** [https://github.com/Mohammedsifran/TechLoom-POS](https://github.com/Mohammedsifran/TechLoom-POS)

*Live website link * 
Task 1: https://tech-loom-pos-l8xg.vercel.app/
Task 2: https://task2front.vercel.app/


## Live Deployments
* **Task 1 (POS Order & Inventory System)**
  * Frontend: [https://techloom-pos-two.vercel.app](https://techloom-pos-two.vercel.app)
  * Backend API: [https://tech-loom-pos-backend-93f4.vercel.app](https://tech-loom-pos-backend-93f4.vercel.app)
* **Task 2 (E-Commerce Checkout & Payment System)**
  * Frontend: [https://task2-zeta-dusky.vercel.app](https://task2-zeta-dusky.vercel.app)
  * Backend API: (Connected to Task 2 Frontend)

---

## Tech Stack
* **Frontend:** React.js, Vite, Axios, React Router
* **Backend:** Node.js, Express.js
* **Database:** MySQL (Hosted on Aiven)
* **Deployment:** Vercel

## Repository Structure
* `/task-01/` - Contains the POS Order & Inventory System
* `/task-02/` - Contains the E-Commerce Checkout & Payment System

## Setup Steps (Local Development)
If you wish to run the code locally instead of using the live deployment URLs:
1. Clone the repository: `git clone https://github.com/Mohammedsifran/TechLoom-POS.git`
2. Navigate into `task-01/backend` or `task-02/backend` and run `npm install`.
3. Start the backend server with `npm run start`.
4. Navigate into `task-01/frontend` or `task-02/frontend` and run `npm install`.
5. Start the React frontend with `npm run dev`.

*Note: There are no `.env` files required for the backend because the Aiven Database credentials have been securely configured to run out-of-the-box for evaluation purposes.*

## How to Test Features

### Task 1: POS System
* **Add to Cart & Checkout:** Click products to add them to the cart. Click checkout to reserve the stock. 
* **Mock Payments:** Enter exactly 16 digits into the credit card field to trigger a successful payment. Enter any other amount of digits to trigger a failed payment. Stock will be released back to the store immediately on failure.
* **Timeout Simulation:** Add items to the cart and click checkout. Do not complete the payment. After exactly 5 minutes, the reservation will expire and the stock will be released back into the available pool automatically.

### Task 2: E-Commerce Storefront
* **Product Discovery:** Use the search bar to filter products by name in real-time, or use the category dropdown.
* **Order History & Refunds:** Click the "Order History" link in the navigation bar to see a list of past orders. For orders with a 'Paid' status, click the red "Refund & Cancel Order" button to simulate a refund and automatically return the stock to the inventory.
