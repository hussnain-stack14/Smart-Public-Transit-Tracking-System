const user = require('../models/userModel');
const generateToken = require('../utils/generateToken');

const registerUser = async (req, res) => {
    const { name , email, password, phone, role}= req.body;
    if(!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }
}