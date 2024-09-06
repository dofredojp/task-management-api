const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { authenticate } = require('./authRoutes');

router.post('/tasks', authenticate, async (req, res) => {
    try {
        const task = new Task(req.body);
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/tasks', authenticate, async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; 

        const skip = (page - 1) * limit;

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


router.get('/tasks/search', authenticate, async (req, res) => {
    try {
        const { title = '', status, priority, dueDate, page = 1, limit = 10 } = req.query;

        let query = {};

        if (title) {
            query.title = { $regex: title, $options: 'i' }; // Case-insensitive search
        }
        if (status) {
            query.status = status; 
        }
        if (priority) {
            query.priority = priority; 
        }
        if (dueDate && dueDate != 'null') {
            query.dueDate = { $gte: new Date(dueDate) };
        }

        const totalItems = await Task.countDocuments(query);

        const tasks = await Task.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .exec();

        const totalPages = Math.ceil(totalItems / limit);

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


// Update a task by ID
router.put('/tasks/:id', authenticate, async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.status(200).json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a task by ID
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
