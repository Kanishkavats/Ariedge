require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/authRoutes');
const bookRoutes = require('./src/routes/bookRoutes');
const borrowRoutes = require('./src/routes/borrowRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow: no origin (curl/Postman), any localhost port in dev, or specific production client URL
    if (!origin || origin.startsWith('http://localhost:') || origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
}));
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process first.`);
        process.exit(1);
      } else {
        throw err;
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();

module.exports = app;
