import validator from "validator";
import newsletterModel from "../models/newsletterModel.js";

// INFO: Route for subscribing to newsletter
const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Check if email already exists
    const existingSubscriber = await newsletterModel.findOne({ email: email.toLowerCase() });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: "This email is already subscribed to our newsletter" 
        });
      } else {
        // Reactivate subscription
        existingSubscriber.isActive = true;
        existingSubscriber.subscribedAt = new Date();
        await existingSubscriber.save();
        return res.status(200).json({ 
          success: true, 
          message: "Welcome back! Your subscription has been reactivated." 
        });
      }
    }

    // Create new subscription
    const newSubscriber = new newsletterModel({
      email: email.toLowerCase(),
    });

    await newSubscriber.save();

    res.status(201).json({ 
      success: true, 
      message: "Thank you for subscribing! You've unlocked 20% off your next purchase." 
    });
  } catch (error) {
    console.log("Error while subscribing to newsletter: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// INFO: Route for unsubscribing from newsletter
const unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const subscriber = await newsletterModel.findOne({ email: email.toLowerCase() });

    if (!subscriber) {
      return res.status(404).json({ success: false, message: "Email not found in our newsletter list" });
    }

    subscriber.isActive = false;
    await subscriber.save();

    res.status(200).json({ success: true, message: "You have been unsubscribed from our newsletter" });
  } catch (error) {
    console.log("Error while unsubscribing from newsletter: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// INFO: Route for getting all newsletter subscribers (admin)
const getAllSubscribers = async (req, res) => {
  try {
    // Get all subscribers (both active and inactive) for admin view
    const subscribers = await newsletterModel.find().sort({ subscribedAt: -1 });
    res.status(200).json({ success: true, count: subscribers.length, subscribers });
  } catch (error) {
    console.log("Error while fetching subscribers: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// INFO: Route for deleting a subscriber (admin only)
const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Subscriber ID is required" });
    }

    const subscriber = await newsletterModel.findById(id);

    if (!subscriber) {
      return res.status(404).json({ success: false, message: "Subscriber not found" });
    }

    await newsletterModel.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true, 
      message: "Subscriber removed successfully" 
    });
  } catch (error) {
    console.log("Error while deleting subscriber: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { subscribeNewsletter, unsubscribeNewsletter, getAllSubscribers, deleteSubscriber };

