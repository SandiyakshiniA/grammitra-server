require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const adviceRoutes = require('./routes/advice');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());

// Basic health check - visiting your backend URL directly should show this
app.get('/', (req, res) => {
  res.json({ status: 'GramMitra backend is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api', adviceRoutes);
app.use('/api', dashboardRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas.');
    app.listen(PORT, () => {
      console.log(`GramMitra server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
