// server/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const { initDB } = require('./database');
const authRoutes = require('./routes/auth');
const journalRoutes = require('./routes/journal');
const questionnaireRoutes = require('./routes/questionnaire');
const moodRoutes = require('./routes/mood');
const dashboardRoutes = require('./routes/dashboard');
const chatRoutes = require('./routes/chat'); // only if chat.js exists

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

initDB();

// Attach routers – each of these must be a router, not {}
app.use('/api/auth', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes); // comment this if you don't have chat.js yet

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`MindMate running on http://localhost:${PORT}`);
});
