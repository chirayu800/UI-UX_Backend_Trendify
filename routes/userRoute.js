import express from "express";
import {
  loginUser,
  registerUser,
  loginAdmin,
  getProfile,
  getAllUsers,
  changeAdminPassword,
  resetAdminPassword,
  forgotPassword,
  resetPassword,
  updateProfile,
} from "../controllers/userController.js";
import adminAuth from "../middleware/adminAuth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin", loginAdmin);
userRouter.get("/profile/:id", getProfile);
userRouter.put("/profile/:id", updateProfile);
userRouter.get("/all", getAllUsers);
userRouter.post("/change-admin-password", changeAdminPassword);
userRouter.post("/reset-admin-password", resetAdminPassword); // For debugging/reset
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);

export default userRouter;
