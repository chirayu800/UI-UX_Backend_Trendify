import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import userModel from "../models/userModel.js";
import adminSettingsModel from "../models/adminSettingsModel.js";

// INFO: Function to create token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// INFO: Route for user login
const loginUser = async (req, res) => {
  console.log(req.body)
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    console.log(user)

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (isPasswordCorrect) {
      const token = createToken(user._id);
      const freshUser = await userModel.findById(user._id);

      res.status(200).json({ success: true, token, user: freshUser });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error while logging in user: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// INFO: Route for user registration
const registerUser = async (req, res) => {
  console.log(req.body)
  try {
    const { name, email, password } = req.body;

    // INFO: Check if user already exists
    const userExists = await userModel.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // INFO: Validating email and password
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // INFO: Hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // INFO: Create new user
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    // INFO: Save user to database
    const user = await newUser.save();

    // INFO: Create token
    const token = createToken(user._id);

    // INFO: Return success response
    res.status(200).json({ success: true, token, user });
  } catch (error) {
    console.log("Error while registering user: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// INFO: Route for admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Admin login attempt - Email:", email);
    console.log("Environment ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
    console.log("Environment ADMIN_PASSWORD exists:", !!process.env.ADMIN_PASSWORD);

    // Check database first
    let adminSettings = await adminSettingsModel.findOne({ email });
    
    // If no admin settings in DB, check environment variables and create DB entry
    if (!adminSettings) {
      console.log("No admin settings in DB, checking environment variables");
      const envEmail = process.env.ADMIN_EMAIL?.trim();
      const envPassword = process.env.ADMIN_PASSWORD?.trim();
      const inputEmail = email?.trim();
      const inputPassword = password?.trim();
      
      if (
        envEmail &&
        envPassword &&
        inputEmail === envEmail &&
        inputPassword === envPassword
      ) {
        console.log("Environment variables match, creating DB entry");
        // Create admin settings in database with hashed password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(inputPassword, salt);
        
        adminSettings = new adminSettingsModel({
          email: envEmail,
          password: hashedPassword,
        });
        await adminSettings.save();
        
        const token = jwt.sign({ email: envEmail, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({ success: true, token });
      } else {
        console.log("Environment variables don't match");
        return res.status(400).json({ success: false, message: "Invalid email or password" });
      }
    }

    // Verify password from database
    console.log("Admin settings found in DB, verifying password");
    const isPasswordCorrect = await bcrypt.compare(password, adminSettings.password);
    
    if (isPasswordCorrect) {
      const token = jwt.sign({ email: adminSettings.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(200).json({ success: true, token });
    } else {
      console.log("Password verification failed");
      res.status(400).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error while logging in admin: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await userModel.findById(id)
    res.status(200).json({ success: true, user });

  } catch (error) {
    console.log("Error while logging in admin: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// INFO: Route for updating user profile
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Validate email if provided
    if (email && !validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const emailExists = await userModel.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();

    await user.save();

    // Return user without password
    const updatedUser = await userModel.findById(id).select('-password');

    res.status(200).json({ 
      success: true, 
      message: "Profile updated successfully",
      user: updatedUser 
    });
  } catch (error) {
    console.log("Error while updating profile: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// INFO: Route for getting all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}).select('-password');
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.log("Error while fetching all users: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// INFO: Route for resetting admin password (for debugging/initial setup)
const resetAdminPassword = async (req, res) => {
  try {
    // Delete all admin settings to reset
    await adminSettingsModel.deleteMany({});
    res.status(200).json({ 
      success: true, 
      message: "Admin settings reset. You can now login with environment variables." 
    });
  } catch (error) {
    console.log("Error while resetting admin password: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// INFO: Route for changing admin password
const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword, email } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // Get admin email from request or environment variable
    const adminEmail = email || process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      return res.status(400).json({ success: false, message: "Admin email not found" });
    }
    
    // Find admin settings
    let adminSettings = await adminSettingsModel.findOne({ email: adminEmail });
    
    // If no admin settings in DB, check environment variables
    if (!adminSettings) {
      if (currentPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(400).json({ success: false, message: "Current password is incorrect" });
      }
      
      // Create admin settings with new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      adminSettings = new adminSettingsModel({
        email: adminEmail,
        password: hashedPassword,
      });
      await adminSettings.save();
      
      return res.status(200).json({ success: true, message: "Password changed successfully" });
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, adminSettings.password);
    
    if (!isPasswordCorrect) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    adminSettings.password = hashedPassword;
    await adminSettings.save();

    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.log("Error while changing admin password: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
}


// INFO: Route for requesting password reset
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({ 
        success: true, 
        message: "If an account exists with this email, a password reset token has been generated." 
      });
    }

    // Generate reset token (simple 6-digit code for demo)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // Token expires in 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // In production, send email with reset token
    // For demo purposes, we'll return the token (remove this in production!)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.status(200).json({ 
      success: true, 
      message: "Password reset token generated. Check your email (or console for demo).",
      resetToken: resetToken // Remove this in production - only for demo
    });
  } catch (error) {
    console.log("Error in forgot password: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// INFO: Route for resetting password with token
const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Email, reset token, and new password are required" 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const user = await userModel.findOne({ 
      email,
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: new Date() } // Token not expired
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset token" 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: "Password reset successfully" 
    });
  } catch (error) {
    console.log("Error in reset password: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { loginUser, registerUser, loginAdmin, getProfile, getAllUsers, changeAdminPassword, resetAdminPassword, forgotPassword, resetPassword, updateProfile };
