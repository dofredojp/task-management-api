const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { authenticate } = require('./authRoutes');
const mongoose = require('mongoose');

// Create a new task (Protected)
router.post('/tasks', authenticate, async (req, res) => {
    try {
        const task = new Task(req.body);
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all tasks with pagination (Protected)
router.get('/tasks', authenticate, async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

        // Calculate the number of items to skip
        const skip = (page - 1) * limit;

        // Fetch tasks with pagination
        const tasks = await Task.find().skip(skip).limit(limit);
        const totalTasks = await Task.countDocuments();

        res.status(200).json({
            page,
            limit,
            totalTasks,
            totalPages: Math.ceil(totalTasks / limit),
            tasks
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a task by ID or title (Protected)
router.get('/tasks/:idOrTitle', authenticate, async (req, res) => {
    const { idOrTitle } = req.params;

    try {
        let task;

        // Check if the parameter is a valid MongoDB ObjectId (search by ID)
        if (mongoose.Types.ObjectId.isValid(idOrTitle)) {
            task = await Task.findById(idOrTitle);
        }

        // If not a valid ObjectId or no task found, search by title (case-insensitive)
        if (!task) {
            task = await Task.findOne({ title: { $regex: new RegExp(idOrTitle, 'i') } });
        }

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Update a task by ID (Protected)
router.put('/tasks/:id', authenticate, async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.status(200).json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a task by ID (Protected)
router.delete('/tasks/:id', authenticate, async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
