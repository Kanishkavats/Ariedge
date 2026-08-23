# Book Inventory & Borrowing Tracker

A simplified library management system built as an end-to-end full-stack application. It allows an admin to manage a catalog of books and members to browse, borrow, and return books.

## 🚀 Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (JSON Web Tokens)

## ✨ Core Features
### Member (User) Features
- **Browse Catalog**: View all available books with pagination and rich UI.
- **Search & Filter**: Search books by title/author and filter by category/genre.
- **Borrow Books**: Request to borrow a book (automatically decrements available copies).
- **Manage Borrows**: View a list of currently borrowed books, past returned books, and check overdue status (14-day due date).
- **Return Books**: Return borrowed books (automatically increments available copies).

### Admin Features
- **Dashboard Overview**: Track library statistics (total books, issued books, out of stock, overdue).
- **Manage Catalog**: Full CRUD operations for books (Create, Read, Update, Delete) with image upload support.
- **Borrowing Tracker**: System-wide view of all active and past borrowing records across all members.
- **Member Directory**: View all registered users.

## 🛠️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local instance or MongoDB Atlas cluster)

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## 🔐 Seeding an Admin User
To test the admin features, you need an Admin account. 
You can either manually change a user's role to `'admin'` in your MongoDB database, or you can register a new user normally via the `/signup` page, and then manually update their role field in MongoDB Compass to `admin`.

## 📝 Trade-offs & Assumptions
- **No Third-Party Auth**: As per requirements, simple JWT-based authentication was built from scratch without relying on OAuth (Google/GitHub).
- **Simplified Borrowing Logic**: The borrowing logic allows a user to borrow a book immediately if copies are available. There is no "admin approval" queue for requests to keep the flow streamlined for the POC.
- **Hardcoded Due Dates**: Due dates are strictly set to 14 days from the moment of borrowing, handled entirely on the backend `Borrow` model. Overdue status is calculated dynamically based on the current date vs. the due date.

## 🛡️ Security
- Passwords are encrypted and hashed using `bcryptjs` before being saved to the database.
- Admin-specific routes (e.g., adding/deleting books, viewing system-wide borrows) are protected via an `authorize('admin')` backend middleware to prevent unauthorized access by standard members.
# Ariedge
