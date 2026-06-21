# Omegle Clone - Backend API

A Node.js/Express/TypeScript backend API for an Omegle-like application.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer with EJS templates

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB running locally or a remote connection string

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT = 8787
MONGO_URL = mongodb://localhost:27017/omegle

CRYPTO_SECRET = 'your-crypto-secret'
JWT_SECRET = your-jwt-secret
JWT_REFRESH_SECRET = your-jwt-refresh-secret

ADMIN_EMAIL = admin@example.com
ADMIN_PASSWORD = your-admin-password

SMTP_USER = your-smtp-email
SMTP_PASSWORD = your-smtp-password

WEB_URL = http://localhost:5173
```

### Run Development Server

```bash
npm run dev
```

### Run Production

```bash
npm start
```

### Build

```bash
npm run build
```

## API Endpoints

All endpoints are prefixed with `/api/v1/user`

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/signUp` | No | Register new user |
| POST | `/signIn` | No | Login user |
| GET | `/logout` | Yes | Logout user |

### Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | Yes | Get user profile |
| POST | `/editProfile` | Yes | Update profile |
| DELETE | `/delete-profile` | Yes | Delete account |

### Password Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/change-password` | Yes | Change password |
| POST | `/forgot-password` | No | Send forgot password OTP |
| POST | `/verify-otp` | No | Verify OTP |
| POST | `/reset-password` | No | Reset password with token |

## Project Structure

```
src/
├── app.ts                  # Application entry point
├── config/                 # Configuration files
│   ├── config.ts           # App configuration
│   ├── constant/           # Constants & messages
│   ├── connection/         # DB connection setup
│   ├── cleanUps.ts         # Graceful shutdown
│   ├── decryptor.ts        # Request/Response encryption
│   ├── logger.ts           # Winston logger
│   ├── rateLimit.ts        # Rate limiting
│   ├── responseHandler.ts  # Response handler class
│   └── serverValidator.ts  # Env validation
├── controllers/            # Route controllers
├── helpers/                # Utility functions
├── middlewares/             # Express middlewares
├── models/                 # Mongoose models
├── repository/             # Database queries
├── routes/                 # API routes
├── services/               # Business logic
└── views/                  # EJS email templates
```
