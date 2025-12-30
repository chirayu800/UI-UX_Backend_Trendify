import express from "express";
import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getAllSubscribers,
  deleteSubscriber,
} from "../controllers/newsletterController.js";
import adminAuth from "../middleware/adminAuth.js";

const newsletterRouter = express.Router();

newsletterRouter.post("/subscribe", subscribeNewsletter);
newsletterRouter.post("/unsubscribe", unsubscribeNewsletter);
newsletterRouter.get("/all", adminAuth, getAllSubscribers); // Admin route - requires authentication
newsletterRouter.delete("/delete/:id", adminAuth, deleteSubscriber); // Admin route - delete subscriber

export default newsletterRouter;

