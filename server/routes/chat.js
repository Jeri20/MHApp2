const express = require('express');
const { therapistChat } = require('../chatbot');
const { db } = require('../database');
const router = express.Router();

// Helper function to get user context from database
function getUserContext(userId, callback) {
  const context = {
    moods: [],
    journals: [],
    questionnaire: [],
    chatHistory: []
  };

  // Get moods (ordered by date, most recent first) - include all mood data
  db.all('SELECT date, moodscore FROM mood WHERE userid = ? ORDER BY date DESC LIMIT 30', [userId], (err, moods) => {
    if (!err && moods) context.moods = moods;
    
    // Get journal entries with actual entry text (not just sentiment)
    db.all('SELECT date, entry, sentiment FROM journal WHERE userid = ? ORDER BY date DESC LIMIT 10', [userId], (err, journals) => {
      if (!err && journals) context.journals = journals;
      
      // Get questionnaire scores
      db.all('SELECT date, gadscore, phqscore FROM questionnaire WHERE userid = ? ORDER BY date DESC LIMIT 5', [userId], (err, questionnaire) => {
        if (!err && questionnaire) context.questionnaire = questionnaire;
        
        // Get recent chat history (last 10 messages for context)
        db.all('SELECT message, sentiment, date FROM chat WHERE userid = ? ORDER BY date DESC, rowid DESC LIMIT 10', [userId], (err, chatHistory) => {
          if (!err && chatHistory) context.chatHistory = chatHistory.reverse(); // Reverse to get chronological order
          
          callback(context);
        });
      });
    });
  });
}

router.post('/send', (req, res) => {
  const { userId, prompt } = req.body;
  
  // Get simple sentiment (can be improved with actual sentiment analysis)
  const sentiment = prompt.includes('happy') || prompt.includes('good') || prompt.includes('great') ? 0.7 : 
                   prompt.includes('sad') || prompt.includes('bad') || prompt.includes('terrible') ? -0.3 : 
                   prompt.includes('anxious') || prompt.includes('worried') || prompt.includes('nervous') ? -0.2 : 0.2;
  
  const date = new Date().toISOString().split('T')[0];
  
  // Get user context from database (feedback loop)
  getUserContext(userId, (userContext) => {
    // Generate response using context-aware chatbot
    const response = therapistChat(userId, prompt, userContext);
    
    // Store message in database
    db.run('INSERT INTO chat (userid, message, sentiment, date) VALUES (?, ?, ?, ?)',
      [userId, prompt, sentiment, date], (err) => {
        if (err) {
          console.error('Error saving chat:', err);
        }
        // Return response even if save fails
        res.json({ response });
      });
  });
});

module.exports = router;
