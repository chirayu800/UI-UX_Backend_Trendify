import validator from "validator";
import contactModel from "../models/contactModel.js";

// INFO: Route for submitting contact form
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    // Create new contact message
    const newContact = new contactModel({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    await newContact.save();

    res.status(201).json({ 
      success: true, 
      message: "Thank you for contacting us! We'll get back to you soon." 
    });
  } catch (error) {
    console.log("Error while submitting contact form: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// INFO: Route for getting all contact messages (admin)
const getAllContacts = async (req, res) => {
  try {
    const contacts = await contactModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: contacts.length, contacts });
  } catch (error) {
    console.log("Error while fetching contacts: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// INFO: Route for updating contact status (admin)
const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ 
        success: false, 
        message: "Contact ID and status are required" 
      });
    }

    const contact = await contactModel.findById(id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    contact.status = status;
    await contact.save();

    res.status(200).json({ 
      success: true, 
      message: "Contact status updated successfully",
      contact 
    });
  } catch (error) {
    console.log("Error while updating contact status: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// INFO: Route for deleting a contact message (admin)
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await contactModel.findById(id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    await contactModel.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true, 
      message: "Contact message deleted successfully" 
    });
  } catch (error) {
    console.log("Error while deleting contact: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { submitContact, getAllContacts, updateContactStatus, deleteContact };

