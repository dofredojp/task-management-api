const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { authenticate } = require('./authRoutes');

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

//  Search API 
router.get('/tasks/search', authenticate, async (req, res) => {
    try {
        const { title = '', status, priority, dueDate, page = 1, limit = 10 } = req.query;

        // Build the search query dynamically
        let query = {};

        if (title) {
            query.title = { $regex: title, $options: 'i' }; // Case-insensitive search
        }
        if (status) {
            query.status = status; // Exact match on status (e.g., 'completed', 'pending')
        }
        if (priority) {
            query.priority = priority; // Exact match on priority (e.g., 'high', 'low')
        }
        if (dueDate && dueDate != 'null') {
            // Match tasks with due dates greater than or equal to the provided date
            query.dueDate = { $gte: new Date(dueDate) };
        }

        // Get total count of tasks that match the query
        const totalItems = await Task.countDocuments(query);

        // Paginate the tasks using skip() and limit()
        const tasks = await Task.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .exec();

        // Calculate total pages
        const totalPages = Math.ceil(totalItems / limit);

        // Return the tasks and pagination metadata
        res.status(200).json({
            tasks,
            totalItems,
            totalPages,
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit),
        });
    } catch (error) {
        console.error('Error searching tasks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Get task by ID
router.get('/tasks/:id', authenticate, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json(task);
    } catch (error) {
        console.error('Error fetching task by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
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
