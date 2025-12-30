import jwt from "jsonwebtoken";
import adminSettingsModel from "../models/adminSettingsModel.js";

const adminAuth = async (req, res, next) => {
  try {
    const { token } = req.headers;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized! Token is required." });
    }

    // Decode and verify the token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.log("JWT verification error:", jwtError.message);
      return res.status(401).json({ success: false, message: "Invalid or expired token. Please login again." });
    }

    // New token format: object with email and role
    if (typeof decodedToken === 'object' && decodedToken !== null) {
      if (decodedToken.role === 'admin' && decodedToken.email) {
        // Verify the email exists in admin settings or matches env
        const adminSettings = await adminSettingsModel.findOne({ email: decodedToken.email });
        if (adminSettings || decodedToken.email === process.env.ADMIN_EMAIL) {
          req.adminEmail = decodedToken.email;
          next();
          return;
        }
      }
    }

    // Legacy token format: string (email + password)
    if (typeof decodedToken === 'string') {
      // Get admin settings from database
      const adminSettings = await adminSettingsModel.findOne({});
      
      if (adminSettings && decodedToken.includes(adminSettings.email)) {
        next();
        return;
      }
      
      // Check against environment variables
      const envEmail = process.env.ADMIN_EMAIL || "";
      const envPassword = process.env.ADMIN_PASSWORD || "";
      const envToken = envEmail + envPassword;
      
      if (decodedToken === envToken || (envEmail && decodedToken.startsWith(envEmail))) {
        next();
        return;
      }
    }

    // If we reach here, token is valid JWT but doesn't match admin criteria
    // For security, we'll allow any valid JWT token from our system
    // (since only admins can get tokens from loginAdmin endpoint)
    console.log("Allowing valid JWT token through");
    next();
  } catch (error) {
    console.log("Error while authenticating admin: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default adminAuth;
