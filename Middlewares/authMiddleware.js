import jwt from "jsonwebtoken";
import Resident from "../Models/residentSchema.js";
import Staff from "../Models/staffSchema.js";
import Admin from "../Models/adminSchema.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from headers
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Token is missing. Authorization denied." });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    switch (decoded.role) {
      case "resident":
        user = await Resident.findById(decoded._id);
        break;
      case "staff":
        user = await Staff.findById(decoded._id);
        break;
      case "admin":
        user = await Admin.findById(decoded._id);
        break;
      default:
        return res.status(400).send({ error: "Invalid role" });
    }

    if (!user) return res.status(404).send({ error: "User not found" });

    // Attach user to the request object
    req.user = user;
    req.role = decoded.role;
    next();
  } catch (error) {
    res.status(401).send({ error: "Authentication failed" });
  }
};

export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if the user role is in the allowedRoles array
      if (!allowedRoles.includes(req.role)) {
        return res.status(403).send({ error: "Access denied" });
      }

      // If role is allowed, proceed to the next middleware or route handler
      next();
    } catch (error) {
      res.status(401).send({ error: "Authentication failed" });
    }
  };
};
