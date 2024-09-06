const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Blacklist = require('../models/Blacklist');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

const router = express.Router();

const JWT_SECRET = process.env.MONGODB_URI; 

// Signup (Register) API
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({ username, email, password });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login API
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Middleware to protect routes
const authenticate = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    try {
        const blacklisted = await Blacklist.findOne({ token });
        if (blacklisted) return res.status(401).json({ message: 'Token is invalidated' });

        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Logout API
router.post('/logout', async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        // Add token to blacklist
        await new Blacklist({ token }).save();
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = { router, authenticate };
