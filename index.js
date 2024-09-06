const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const { router: authRoutes } = require('./routes/authRoutes');
const cors = require('cors');

dotenv.config(); // Load environment variables

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas using environment variable
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
    })
    .catch(err => console.log(err));

// Use auth and task routes
app.use('/api', authRoutes);  // Authentication routes
app.use('/api', taskRoutes);  // Task routes
app.use('/api', userRoutes);  // User routes

app.get('/', (req, res) => {
    res.send('Welcome to the Task Management API');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
