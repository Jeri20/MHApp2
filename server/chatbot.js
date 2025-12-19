function therapistChat(userId, prompt, userContext = {}) {
  const lowerPrompt = prompt.toLowerCase().trim();
  
  // Extract context data
  const { moods = [], journals = [], questionnaire = [], chatHistory = [] } = userContext;
  
  // Crisis detection (same patterns as Python)
  const crisisPatterns = [
    /i.?don.?t want to live/i, /suicid.?eal/i, /end it all/i, /hopeless/i,
    /want to die/i, /can.?t go on/i, /no reason to live/i, /worthless/i
  ];
  
  const isCrisis = crisisPatterns.some(pattern => pattern.test(lowerPrompt));
  if (isCrisis) {
    return "I'm really sorry you're feeling this way. You're not alone. I'm not a professional therapist—please reach out for help: US 988, UK 116 123, India +91 9820466726. You matter more than you know.";
  }
  
  // Analyze mood trends from database (mood calendar data)
  const recentMoods = moods.slice(-7); // Last 7 mood entries
  const allMoods = moods.slice().reverse(); // Chronological order for trend analysis
  const avgMood = recentMoods.length > 0 
    ? recentMoods.reduce((sum, m) => sum + (m.moodscore || 0), 0) / recentMoods.length 
    : null;
  const latestMood = moods.length > 0 ? moods[moods.length - 1] : null;
  
  // Analyze mood patterns from calendar
  const lowMoodStreak = (() => {
    let streak = 0;
    for (let i = 0; i < Math.min(7, moods.length); i++) {
      if (moods[i].moodscore <= 1) streak++;
      else break;
    }
    return streak;
  })();
  
  const moodImprovement = (() => {
    if (moods.length < 2) return null;
    const oldest = moods[moods.length - 1].moodscore;
    const newest = moods[0].moodscore;
    return newest - oldest;
  })();
  
  // Analyze questionnaire scores
  const latestQuestionnaire = questionnaire.length > 0 ? questionnaire[questionnaire.length - 1] : null;
  const hasHighAnxiety = latestQuestionnaire && latestQuestionnaire.gadscore >= 10;
  const hasHighDepression = latestQuestionnaire && latestQuestionnaire.phqscore >= 10;
  
  // Analyze journal entries - now with actual text content
  const recentJournals = journals.slice(-5);
  const avgSentiment = recentJournals.length > 0
    ? recentJournals.reduce((sum, j) => sum + (j.sentiment || 0), 0) / recentJournals.length
    : null;
  
  // Extract key themes from journal entries
  const journalThemes = (() => {
    if (recentJournals.length === 0) return [];
    const themes = [];
    const allText = recentJournals.map(j => (j.entry || '').toLowerCase()).join(' ');
    
    // Common themes to detect
    const themeKeywords = {
      'work': ['work', 'job', 'career', 'boss', 'colleague', 'office'],
      'relationships': ['friend', 'family', 'partner', 'relationship', 'love', 'breakup'],
      'health': ['sick', 'health', 'pain', 'doctor', 'medication', 'sleep'],
      'anxiety': ['anxious', 'worried', 'stress', 'panic', 'nervous', 'fear'],
      'depression': ['sad', 'depressed', 'hopeless', 'empty', 'tired', 'worthless'],
      'achievement': ['accomplished', 'proud', 'success', 'achieved', 'completed']
    };
    
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        themes.push(theme);
      }
    }
    return themes;
  })();
  
  // Get most recent journal entry text for context
  const latestJournal = recentJournals.length > 0 ? recentJournals[0] : null;
  const latestJournalText = latestJournal && latestJournal.entry ? latestJournal.entry.toLowerCase() : '';
  
  // Build personalized greeting with context from mood calendar and journal
  let contextAwareGreeting = "";
  if (latestMood) {
    const moodEmojis = { 3: '😊', 2: '😐', 1: '😔', 0: '😰' };
    const moodLabels = { 3: 'happy', 2: 'neutral', 1: 'sad', 0: 'anxious' };
    const daysAgo = latestMood.date ? 
      Math.floor((new Date() - new Date(latestMood.date)) / (1000 * 60 * 60 * 24)) : null;
    
    if (daysAgo === 0) {
      contextAwareGreeting = `I see you logged your mood today as ${moodEmojis[latestMood.moodscore] || ''} (${moodLabels[latestMood.moodscore] || 'unknown'}). `;
    } else if (daysAgo === 1) {
      contextAwareGreeting = `I noticed you tracked your mood yesterday as ${moodEmojis[latestMood.moodscore] || ''}. `;
    } else {
      contextAwareGreeting = `I see you've been tracking your mood in your calendar. `;
    }
  }
  
  // Reference mood calendar patterns
  if (lowMoodStreak >= 3) {
    contextAwareGreeting += `I've noticed you've had ${lowMoodStreak} consecutive days of lower mood in your calendar. `;
  }
  
  if (moodImprovement !== null && moodImprovement > 0.5) {
    contextAwareGreeting += "Your mood calendar shows a positive trend recently! ";
  } else if (moodImprovement !== null && moodImprovement < -0.5) {
    contextAwareGreeting += "I see your mood has been declining in your calendar. ";
  }
  
  // Reference journal entries
  if (latestJournal && latestJournal.entry) {
    const journalDate = latestJournal.date ? 
      Math.floor((new Date() - new Date(latestJournal.date)) / (1000 * 60 * 60 * 24)) : null;
    
    if (journalDate === 0) {
      contextAwareGreeting += "I read your journal entry from today. ";
    } else if (journalDate === 1) {
      contextAwareGreeting += "I saw your journal entry from yesterday. ";
    } else if (journalDate <= 3) {
      contextAwareGreeting += "I've been reading your recent journal entries. ";
    }
    
    // Reference specific themes from journal
    if (journalThemes.length > 0) {
      const themes = journalThemes.slice(0, 2).join(' and ');
      contextAwareGreeting += `I notice you've been writing about ${themes}. `;
    }
  }
  
  if (hasHighAnxiety || hasHighDepression) {
    contextAwareGreeting += "I see from your questionnaire that you've been dealing with some challenges. ";
  }
  
  if (avgMood !== null && avgMood < 1.5) {
    contextAwareGreeting += "Your mood calendar shows you've been having a tough time. ";
  } else if (avgMood !== null && avgMood > 2.5) {
    contextAwareGreeting += "It's great to see your mood calendar showing positive entries! ";
  }
  
  // Empathetic responses with context awareness
  const responses = {
    'hi,hello,hey': contextAwareGreeting || "Hey there! I'm here to support you. What's on your mind today?",
    'sad,unhappy,teary': (() => {
      let response = "I'm really sorry you're feeling sad. ";
      if (latestMood && latestMood.moodscore <= 1) {
        response += "I see you've been tracking this in your mood calendar. ";
      }
      if (lowMoodStreak >= 3) {
        response += `You've had ${lowMoodStreak} days of lower mood in a row. `;
      }
      if (avgSentiment !== null && avgSentiment < 0) {
        response += "Your recent journal entries also reflect this. ";
      }
      if (latestJournal && latestJournal.entry) {
        // Check if journal mentions specific sad topics
        const sadKeywords = ['sad', 'depressed', 'down', 'unhappy', 'crying', 'tears'];
        if (sadKeywords.some(keyword => latestJournalText.includes(keyword))) {
          response += "I can see from your journal that you've been writing about these feelings. ";
        }
      }
      response += "Want to talk about what's been making you feel this way?";
      return response;
    })(),
    'anxious,nervous,panic,overwhelmed': (() => {
      let response = "It sounds like anxiety might be weighing on you. ";
      if (hasHighAnxiety) {
        response += "Your GAD-7 scores suggest this is something you've been dealing with. ";
      }
      response += "Want to walk through it together? No pressure.";
      return response;
    })(),
    'lonely,alone': "Feeling lonely can be really tough. You're not alone here. Want to share what's been going on?",
    'happy,excited': (() => {
      let response = "That's so great to hear! ";
      if (avgMood !== null && avgMood > 2) {
        response += "Your mood calendar shows you've been doing well! ";
      }
      if (latestMood && latestMood.moodscore === 3) {
        response += "I see you logged a happy mood in your calendar recently. ";
      }
      if (latestJournal && latestJournal.sentiment > 0.5) {
        response += "Your recent journal entries have been more positive too. ";
      }
      if (journalThemes.includes('achievement')) {
        response += "I noticed in your journal that you've been writing about accomplishments. ";
      }
      response += "What's been going well? Let's celebrate the joy.";
      return response;
    })(),
    'better,improving,progress': (() => {
      let response = "That's wonderful to hear you're feeling better! ";
      if (moodImprovement !== null && moodImprovement > 0) {
        response += `Your mood calendar shows improvement - your mood has gone up by ${moodImprovement.toFixed(1)} points recently. `;
      }
      if (avgMood !== null && avgMood > 2) {
        response += "Your mood calendar reflects this positive trend. ";
      }
      if (latestJournal && latestJournal.sentiment > 0.3) {
        response += "I can see your journal entries have been more positive too. ";
      }
      response += "What do you think has been helping?";
      return response;
    })(),
    'worse,declining,struggling': (() => {
      let response = "I'm sorry things have been getting harder. ";
      if (latestQuestionnaire) {
        response += "Remember, your questionnaire scores help us understand what you're going through. ";
      }
      response += "Let's talk about what's been challenging. I'm here to listen.";
      return response;
    })()
  };
  
  // Check for keyword matches
  for (const [keywords, response] of Object.entries(responses)) {
    if (keywords.split(',').some(word => lowerPrompt.includes(word))) {
      return response;
    }
  }
  
  // Context-aware default response using journal and mood calendar data
  let defaultResponse = "Thank you for sharing. ";
  
  // Reference mood calendar
  if (latestMood) {
    defaultResponse += "I'm here to listen and support you. ";
    if (latestMood.moodscore <= 1) {
      defaultResponse += "I see from your mood calendar that you've been having a tough time. ";
    } else if (latestMood.moodscore >= 2) {
      defaultResponse += "I'm glad to see your mood calendar shows you've been doing okay. ";
    }
  }
  
  // Reference journal entries
  if (latestJournal && latestJournal.entry) {
    // Check if current prompt relates to journal content
    const promptWords = lowerPrompt.split(/\s+/);
    const journalWords = latestJournalText.split(/\s+/);
    const commonWords = promptWords.filter(word => word.length > 3 && journalWords.includes(word));
    
    if (commonWords.length > 0) {
      defaultResponse += "I remember you wrote about something similar in your journal. ";
    }
    
    if (latestJournal.sentiment < -0.2) {
      defaultResponse += "I noticed your recent journal entry reflected some difficult feelings. ";
    } else if (latestJournal.sentiment > 0.3) {
      defaultResponse += "I saw some positive things in your recent journal entry. ";
    }
  }
  
  // Reference mood patterns
  if (lowMoodStreak >= 3) {
    defaultResponse += `I've been tracking your mood calendar and noticed ${lowMoodStreak} days of lower mood. `;
  }
  
  // Reference journal themes
  if (journalThemes.length > 0 && !lowerPrompt.includes('work') && !lowerPrompt.includes('relationship')) {
    const relevantTheme = journalThemes.find(theme => {
      const themeMap = {
        'work': ['work', 'job', 'career'],
        'relationships': ['friend', 'family', 'relationship'],
        'health': ['health', 'sick', 'pain']
      };
      return themeMap[theme] && themeMap[theme].some(word => lowerPrompt.includes(word));
    });
    
    if (relevantTheme) {
      defaultResponse += `I see you've been writing about ${relevantTheme} in your journal. `;
    }
  }
  
  if (chatHistory.length > 0) {
    defaultResponse += "What's been on your mind since we last talked?";
  } else {
    defaultResponse += "What's been on your mind?";
  }
  
  return defaultResponse;
}

module.exports = { therapistChat };
