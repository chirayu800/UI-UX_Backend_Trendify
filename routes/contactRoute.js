import express from "express";
import {
  submitContact,
  getAllContacts,
  updateContactStatus,
  deleteContact,
} from "../controllers/contactController.js";
import adminAuth from "../middleware/adminAuth.js";

const contactRouter = express.Router();

contactRouter.post("/submit", submitContact);
contactRouter.get("/all", adminAuth, getAllContacts);
contactRouter.put("/status/:id", adminAuth, updateContactStatus);
contactRouter.delete("/delete/:id", adminAuth, deleteContact);

export default contactRouter;

