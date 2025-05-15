# GroFresh API

A Node.js Express API for the GroFresh e-commerce platform, built with MongoDB as the database.

## Features

-   User Authentication (Register, Login, Profile Management)
-   Admin Authentication and Management
-   Product Management
-   Order Management
-   Category Management
-   Payment Integration
-   Banner Management
-   Review System

## Technology Stack

-   Node.js
-   Express.js
-   MongoDB
-   Mongoose
-   JWT Authentication
-   Multer for File Uploads
-   Stripe for Payments

## Requirements

-   Node.js 14+
-   MongoDB 4+

## Installation

1. Clone the repository

    ```
    git clone <repository-url>
    ```

2. Install dependencies

    ```
    npm install
    ```

3. Create a `.env` file in the root directory with the following variables:

    ```
    NODE_ENV=development
    PORT=8000
    APP_NAME=GroFresh
    APP_URL=http://localhost:8000
    APP_MODE=live
    APP_DEBUG=false

    MONGODB_URI=mongodb://localhost:27017/grofresh

    JWT_SECRET=your-secret-key
    JWT_EXPIRES_IN=7d

    EMAIL_SERVICE=gmail
    EMAIL_USER=your-email@gmail.com
    EMAIL_PASSWORD=your-email-password
    EMAIL_FROM=noreply@grofresh.com

    UPLOAD_PATH=uploads

    STRIPE_SECRET_KEY=your-stripe-secret-key
    STRIPE_PUBLIC_KEY=your-stripe-public-key
    ```

4. Start the server

    ```
    npm start
    ```

5. For development with hot-reload
    ```
    npm run dev
    ```

## API Endpoints

### Authentication

-   `POST /api/auth/register` - Register a new user
-   `POST /api/auth/login` - User login
-   `GET /api/auth/me` - Get user profile
-   `PUT /api/auth/profile` - Update user profile
-   `PUT /api/auth/change-password` - Change password

### Admin

-   `POST /api/admin/login` - Admin login
-   `GET /api/admin/me` - Get admin profile
-   `PUT /api/admin/profile` - Update admin profile
-   `PUT /api/admin/change-password` - Change admin password
-   `GET /api/admin/all` - Get all admins (super admin only)
-   `POST /api/admin/create` - Create new admin (super admin only)

### Products

-   `GET /api/products` - Get all products
-   `GET /api/products/:id` - Get product by ID
-   `POST /api/products` - Create a new product (admin only)
-   `PUT /api/products/:id` - Update a product (admin only)
-   `DELETE /api/products/:id` - Delete a product (admin only)

### Categories, Orders, and Other Endpoints

Please refer to the source code for additional endpoints.

## License

This project is licensed under the MIT License.
