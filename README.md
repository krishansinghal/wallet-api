# Wallet_api

This is wallet API built with Node.js, MongoDB, Mongoose, Express.js, and JWT(JSON Web Token) for the session management.
The user can register, login, transfer and retrieve the transaction details using the api and admin can see all transaction details.

## SETUP

1. Clone the repository:

   ```bash
   git clone https://github.com/krishansinghal/wallet-api
   ```

2. Navigate to the project directory:

   ```bash
   cd wallet-api
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Setup mongoDB:

   - Create a database on mongoDB(Atlas/Compass) and Create the mongoDB-URI.

5. Set up .env file:

   - `Mailtrap` inbox is used to maintain the Email service. Create a account on `mailtrap` and add the credentials.
   - Create a `.env` file in the root directory and add the following variables:

   ```bash
   PORT=3000
   MONGODB_URI=your_mongoDB_URI
   JWT_SECRET=your-jwt-key
   EMAIL_USER=mailtrap-user-id
   EMAIL_PASSWORD=mailtrap-userid-password
   EMAIL_HOST=mailtrap=host-address
   EMAIL_PORT=2525
   ```

6. Start the server:

   ```bash
   npm start
   ```

   It'll start the server and the server should be running on `http://localhost:3000`.

## Working

### Register a New User

To register a new user, send a `POST` request to `127.0.0.1:3000/api/users` with the following JSON payload:

```json
{
  "username": "username",
  "email": "user@example.com",
  "password": "userPassword"
}
```

The Email will be send to the user Email address. User needs to verify the email for login.

### Login

To login, send a `POST` request to `127.0.0.1:3000/api/users/login` with the following JSON payload:

```json
{
  "email": "user@example.com",
  "password": "userPassword"
}
```

If the login is successful, you will get a JWT token in the response.

### Current User

To get the details of the current logged-in user, send a `GET` request to `127.0.0.1:3000/api/users/me` with the following header information(key:value).

This API uses JWT for authentication. Include the JWT token in the `Authorization` header of requests to protected routes.

Example:

```http
Authorization: Bearer your_jwt_token
```

### Transfer

To send the money to one user to another, send a `POST` request to `127.0.0.1:3000/api/users/transfer` with the following JSON payload:

```json
{
  "receiverEmail": "userEmail@example.com",
  "amount": "amount to transfer"
}
```

This API uses JWT for authentication. Include the JWT token in the `Authorization` header of requests to protected routes.

Example:

```http
Authorization: Bearer your_jwt_token
```

### User transaction details.

To get the list of transaction of a particular user, send a `GET` requeast to `127.0.0.1:3000/api/users/transactions` with JWT token in the `Authorization` header of requests to protected routes.

- In the response you'll get the all transactions of that user.

### Admin transaction details

To get all the trasactions of all users, send a `GET` request to `127.0.0.1:3000/api/users/admin/transactions` with JWT token in the `Authorization` header of requests to protected routes.

- to get the response from this request the user must be Admin(`isAdmin: true`).

### Postman Collection

Postman Documentation URL: [https://documenter.getpostman.com/view/31724378/2sAXjJ4sBc]

- `https://documenter.getpostman.com/view/31724378/2sAXjJ4sBc`.
