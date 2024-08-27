const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const auth = require("../middleware/auth");
const { transferFunds } = require("../services/transferService");
const transporter = require("../config/emailConfig");
const Transaction = require("../models/transaction");

const router = express.Router();

// POST /api/users - Create a new user

router.post("/", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      isVerified: false,
      balance: 1000,
    });

    await user.save();

    // Send verification email using Mailtrap
    const verificationLink = `http://localhost:3000/api/users/verify/${verificationToken}`;

    const mailOptions = {
      from: "no-reply@example.com",
      to: email,
      subject: "Email Verification",
      html: `<p>Hi! ${name}, Thank you for signing up! This is the verification process, require for account activation. Please verify your email by clicking the link below:</p>
               <p><a href="${verificationLink}">Verify Your Email</a></p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending verification email:", error);
        return res
          .status(500)
          .json({ message: "Error sending verification email" });
      }
      console.log("Verification email sent:", info.response);
      res.status(201).json({
        message:
          "User created successfully. Please check your email to verify your account.",
      });
    });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res
      .status(500)
      .json({ message: "Something went wrong!, please try again." });
  }
});

// GET /api/users/verify/:token - Verify user's email
router.get("/verify/:token", async (req, res) => {
  const { token } = req.params;

  try {
    // Find the user by the verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update user status to verified
    user.isVerified = true;
    user.verificationToken = undefined; // Clear the token
    await user.save();

    res
      .status(200)
      .json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Error verifying email:", error.message);
    res.status(500).json({ message: "Email Verification Failed" });
  }
});

// POST /api/users/login - Log in a user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if the user’s email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        message:
          "Email not verified. Please check your email for the verification link.",
      });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Create a JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET, // Replace with your actual JWT secret key
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error logging in:", error.message);
    res.status(500).json({ message: "Login failed, Check Email and Password" });
  }
});

// GET /api/users/me - Get current user details.
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error.message);
    res.status(500).json({ message: "Failed, Check Token details" });
  }
});

// Middleware to authenticate user
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.userId = decoded.userId;
    next();
  });
};

// POST /api/users/transfer - Transfer balance between users
router.post("/transfer", authenticate, async (req, res) => {
  const { receiverEmail, amount } = req.body;
  const senderId = req.userId;

  try {
    const sender = await User.findById(senderId);

    const result = await transferFunds(sender.email, receiverEmail, amount);

    // Exclude the password from the response
    const senderWithoutPassword = await User.findById(senderId)
      .select("-password")
      .select("-balance");
    const receiverWithoutPassword = await User.findOne({
      email: receiverEmail,
    })
      .select("-password")
      .select("-balance");

    res.status(200).json({
      message: "Transfer successful",
      sender: senderWithoutPassword,
      receiver: receiverWithoutPassword,
    });
  } catch (error) {
    console.error("Error during transfer:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/transactions - Retrieve transaction history for the current user
router.get("/transactions", authenticate, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find all transactions where the user is either the sender or receiver
    const transactions = await Transaction.find({
      $or: [{ senderEmail: user.email }, { receiverEmail: user.email }],
    }).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error retrieving transaction history:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/admin/transactions - Retrieve all transactions (Admin only)
router.get("/admin/transactions", authenticate, async (req, res) => {
  const userId = req.userId;

  try {
    // Find the user by their ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is an admin
    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. You are not admin" });
    }

    // Find all transactions
    const transactions = await Transaction.find().sort({ date: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error retrieving all transactions:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
