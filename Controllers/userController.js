import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendEmail from "../Utils/mailer.js";
import Resident from "../Models/residentSchema.js";
import Admin from "../Models/adminSchema.js";
import Staff from "../Models/staffSchema.js";

// Utility functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) =>
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&/])[A-Za-z\d@$!%*?&/]{8,}$/.test(
    password
  );

const getModelByRole = (role) => {
  switch (role) {
    case "resident":
      return Resident;
    case "admin":
      return Admin;
    case "staff":
      return Staff;
    default:
      throw new Error("Invalid role");
  }
};

// Register a user
export const registerUser = async (req, res) => {
  const {
    role,
    name,
    email,
    phoneNumber,
    password,
    emergencyContact,
    address,
  } = req.body;

  // Validate email and password format
  if (!validateEmail(email) || !validatePassword(password)) {
    return res
      .status(400)
      .json({ message: "Invalid email or password format" });
  }

  // If the role is 'resident', validate emergencyContact and address
  if (role === "resident") {
    if (
      !emergencyContact ||
      !emergencyContact.name ||
      !emergencyContact.phoneNumber ||
      !emergencyContact.relationship
    ) {
      return res
        .status(400)
        .json({ message: "Emergency contact details are incomplete" });
    }

    if (!address || address.trim() === "") {
      return res.status(400).json({ message: "Address cannot be empty" });
    }
  }

  try {
    const Model = getModelByRole(role);
    const existingUser = await Model.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: `${role} already exists` });

    // hash pasword
    const hashedPassword = await bcrypt.hash(password, 12);

    /* new user */
    const newUser = new Model({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      status: "non resident",
      emergencyContact: role === "resident" ? emergencyContact : undefined, // Include only for resident
      address: role === "resident" ? address : undefined, // Include only for resident
    });


    // Save the new user
    await newUser.save();
    res.status(201).json({ message: `${role} registered successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login a user
export const loginUser = async (req, res) => {
  const { role, email, password } = req.body;

  // Validate email and password format
  if (!validateEmail(email) || !validatePassword(password)) {
    return res
      .status(400)
      .json({ message: "Invalid email or password format" });
  }

  
  try {
    // Check if the user exists
    const Model = getModelByRole(role);
    const user = await Model.findOne({ email });
    if (!user) return res.status(400).json({ message: `${role} not found` });

    // Check if the password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Generate and save the token
    const token = jwt.sign({ _id: user._id, role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    user.token = token;
    await user.save();

    let residentStatus = null;
    if (role === "resident") {
      residentStatus = user.status;
    }

    /* response */
    res.status(200).json({ message: "Login successful", token, role, residentStatus, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  const { role, email } = req.body;

  // Validate email
  if (!validateEmail(email))
    return res.status(400).json({ message: "Invalid email format" });

  try {
    // Check if the user exists
    const Model = getModelByRole(role);
    const user = await Model.findOne({ email }).select("-password");
    if (!user)
      return res.status(401).json({ message: `${role} is not found.` });

    // Generate reset token
    const resetToken = jwt.sign(
      { _id: user._id, role },
      process.env.JWT_SECRET,
      {
        expiresIn: "30m",
      }
    );

    // Email content
    const subject = "Password Reset Link";
    const resetUrl = `https://hostel-management-mern.netlify.app/reset-password/${user._id}/${resetToken}`;
    const html = `
      <p>You recently requested to reset the password for your account.</p>
      <p>Click the button below to proceed:</p>
      <a href="${resetUrl}" 
         style="
           display: inline-block;
           background-color: #ea580c;
           color: white;
           padding: 10px 20px;
           text-align: center;
           text-decoration: none;
           border-radius: 5px;
           font-size: 16px;
           margin-top: 6px;
           
         "
         target="_blank" 
       >
         Reset Password
      </a>
      <p>This link is valid for 30 minutes. If you did not request a password reset, please ignore this email.</p>
    `;

    // Send reset password link
    try {
      await sendEmail(email, subject, html);
      return res.status(200).json({ message: "Email sent successfully" });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res.status(500).json({
        message: "Failed to send password reset email. Please try again later.",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { id, resetToken } = req.params;
  const { password } = req.body;

  // Validate password
  if (!resetToken || !validatePassword(password)) {
    return res
      .status(400)
      .json({ message: "Invalid token or password format" });
  }

  try {
    // Check if the user exists
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const Model = getModelByRole(decoded.role);
    const user = await Model.findById(decoded._id);
    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid token or user not found" });

        // Update password
    user.password = await bcrypt.hash(password, 12);
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password" });
  }
};

