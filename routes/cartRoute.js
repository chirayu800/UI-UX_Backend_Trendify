import express from "express";

import { addToCart, getCartDetails, removeFromCart, clearUserCart } from "../controllers/cartController.js";


const cartRouter = express.Router();

cartRouter.post("/add", addToCart);
cartRouter.get("/list/:userId", getCartDetails);
cartRouter.delete("/remove", removeFromCart);
cartRouter.post("/clear", clearUserCart); // Admin endpoint to clear user cart

export default cartRouter;
