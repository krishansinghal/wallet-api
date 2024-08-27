const User = require("../models/user");
const Transaction = require("../models/transaction");
const transporter = require("../config/emailConfig");

// Function to send email
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: '"Your Wallet App" <no-reply@example.com>',
    to: to,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
  }
};

// Function to perform transfer between users
const transferFunds = async (senderEmail, receiverEmail, amount) => {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  // Find sender and receiver users
  const sender = await User.findOne({ email: senderEmail });
  const receiver = await User.findOne({ email: receiverEmail });

  if (!sender || !receiver) {
    throw new Error("Sender or receiver not found");
  }

  // Check if sender's balance is sufficient
  if (sender.balance < amount) {
    await sendEmail(
      sender.email,
      "Transaction Failed",
      `Your transaction of $${amount} to ${receiver.email} failed due to insufficient balance.`
    );

    // Record the failed transaction
    await new Transaction({
      senderEmail,
      receiverEmail,
      amount,
      status: "Failed",
    }).save();

    throw new Error("Insufficient balance");
  }

  // Perform the transfer
  sender.balance -= amount;
  receiver.balance += amount;

  // Save the updated users
  await sender.save();
  await receiver.save();

  // Send success email to sender
  await sendEmail(
    sender.email,
    "Transaction Successful",
    `You have successfully sent $${amount} to ${receiver.email}.`
  );

  // Send success email to receiver
  await sendEmail(
    receiver.email,
    "Transaction Received",
    `You have received $${amount} from ${sender.email}.`
  );

  // Record the successful transaction
  await new Transaction({
    senderEmail,
    receiverEmail,
    amount,
    status: "Success",
  }).save();

  return { sender, receiver };
};

module.exports = { transferFunds };
