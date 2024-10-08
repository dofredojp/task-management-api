const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('./authRoutes');

const router = express.Router();

router.get('/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password'); // Exclude password field
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.log("ERROR: ", err)
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/change-password', authenticate, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await user.matchPassword(currentPassword); 
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully!' });
    } catch (err) {
        console.log("ERROR: ", err)
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
