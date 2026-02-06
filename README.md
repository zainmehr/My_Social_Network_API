# My Social Network API

## Overview 

My Social Networks API is a RESTful API designed to manage the core features of a social networking platform. It allows users to register and authenticate, create and join groups, organize events, participate in discussions, share photos, create polls, and manage ticketing for public events. 

## Features

### Authentication & Users

- User registration
- User login with JWT authentication
- Retrieve the currently authenticated user
- Secure access to protected routes

### Groups

- Create groups
- Retrieve group information

### Events

- Create events
- Join and leave events
- Retrieve event details
- Enable or disable ticketing for public events

### Discussions (Threads)

- Create discussion threads linked to groups or events
- Post messages in threads
- Reply to messages

### Albums & Photos

- Create photo albums linked to events
- Add photos to albums
- Comment on photos

### Polls

- Create polls for events 
- Answer polls 

### Tickets

- Create ticket types for public events
- Purchase tickets

## API Design

- RESTful architecture
- JSON request and response format
- Standard HTTP methods (GET, POST, DELETE)
- Proper use of HTTP status codes
- Clear separation of concerns (controllers, models, middlewares)

## Security

The API implements several security best practices:
- JWT Authentication
  All protected endpoints require a valid JSON Web Token.

- Role-Based Access Control (RBAC)
  Some actions are restricted based on user roles (e.g. admin, event organizer).

- Input Validation
  All incoming requests are validated to prevent invalid or malicious data.

- Rate Limiting
  Limits the number of requests to prevent abuse and brute-force attacks.
- CORS Configuration
  Only authorized origins can access the API.

- HTTP Security Headers
  Security headers are set using Helmet.

- MongoDB Injection Protection
  Protection against NoSQL injection attacks.

## Technologies Used
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (JSON Web Tokens)
- Zod for request validation
- Postman for API documentation and testing

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm
- MongoDB (local or MongoDB Atlas)

### Installation

```bash
  npm install
```
### Environment Variables

Create a .env file at the root of the project:
```bash
  PORT=3000
  MONGO_URI=mongodb+srv://xena_db_user:Z5qWuuJYPJnPHZPv@mysocialnetwork.zjjzpng.mongodb.net/
  JWT_SECRET=your_secret_key
  JWT_EXPIRES_IN=2h
  CORS_ORIGINS=http://localhost:3000
```

### Run the API
```bash
  npm run dev
```


### API Documentation
The complete API documentation, including all endpoints, request examples, and responses, is available on Postman:

👉 Postman Documentation: https://documenter.getpostman.com/view/49047621/2sBXc8pPJW



