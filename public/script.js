class MindMateApp {
    constructor() {
        this.userId = null;
        this.chatHistory = [];
        this.currentPage = 'landing';
        this.currentCalendarDate = new Date();
        this.moodData = {}; // Store mood data by date (YYYY-MM-DD)
        this.selectedDate = null;
        this.selectedMood = null;
        
        // Voice-related state
        this.recognition = null;
        this.isRecording = false;
        this.voices = [];
        this.currentVoice = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initVoiceFeatures();
        this.showLogin();
    }

    bindEvents() {
        // Auth
        document.getElementById('auth-btn').addEventListener('click', () => this.handleAuth());
        document.getElementById('auth-mode').addEventListener('change', (e) => {
            const btn = document.getElementById('auth-btn');
            btn.textContent = e.target.value === 'login' ? 'Login' : 'Register';
        });

        // Navigation
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showPage(e.target.dataset.page));
        });

        // Journal
        document.getElementById('save-journal').addEventListener('click', () => this.saveJournal());

        // Questionnaire
        document.getElementById('submit-questionnaire').addEventListener('click', () => this.submitQuestionnaire());

        // Mood Calendar
        document.getElementById('save-mood').addEventListener('click', () => this.saveMood());
        document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));
        document.getElementById('cancel-mood-selection').addEventListener('click', () => this.cancelMoodSelection());
        
        // Mood option buttons (using event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mood-option')) {
                const btn = e.target.closest('.mood-option');
                document.querySelectorAll('.mood-option').forEach(b => b.classList.remove('border-blue-500', 'bg-blue-50'));
                btn.classList.add('border-blue-500', 'bg-blue-50');
                this.selectedMood = btn.dataset.mood;
            }
        });

        // Chat
        document.getElementById('send-chat').addEventListener('click', () => this.sendChat());
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChat();
        });
        document.getElementById('reset-chat').addEventListener('click', () => this.resetChat());
        
        // Voice input button
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleRecording());
        }
        
        // Bot voice selection
        const voiceSelect = document.getElementById('bot-voice-select');
        if (voiceSelect) {
            voiceSelect.addEventListener('change', (e) => {
                const index = e.target.value;
                if (index === '') {
                    this.currentVoice = null;
                } else if (this.voices[index]) {
                    this.currentVoice = this.voices[index];
                }
            });
        }

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
    }

    // ALWAYS check backend for questionnaire status
    async checkQuestionnaireCompleted() {
        if (!this.userId) return false;
        try {
            const res = await fetch(`/api/questionnaire/completed/${this.userId}`);
            const data = await res.json();
            return data.completed;
        } catch {
            return false;
        }
    }

    async handleAuth() {
        const mode = document.getElementById('auth-mode').value;
        const role = document.getElementById('auth-role').value; // ✅ Added role selection
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const doctorName = document.getElementById('doctor-name').value;
        const doctorOrg = document.getElementById('doctor-org').value;
        const messageEl = document.getElementById('auth-message');
    
        try {
            const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
            
            // ✅ Handle role selection + doctor fields
            const body = mode === 'login' ? 
                { email, password } : 
                { 
                    email, 
                    password, 
                    role, 
                    name: role === 'doctor' ? doctorName : null,
                    organization: role === 'doctor' ? doctorOrg : null 
                };
            
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body) // ✅ Updated body with role/name/organization
            });
    
            const data = await res.json();
            if (data.success) {
                this.userId = data.userId;
                this.role = data.role || role; // ✅ Store role
                this.doctorName = data.name;   // ✅ Store doctor name
                this.organization = data.organization;
                
                // ✅ Update UI with role info
                document.getElementById('user-id').textContent = this.userId;
                document.getElementById('user-role').textContent = 
                    this.role === 'doctor' ? `Dr. ${this.doctorName || 'Doctor'}` : 'User';
                document.getElementById('user-org').textContent = 
                    this.role === 'doctor' && this.organization ? `${this.organization}` : '';
                
                // CRITICAL: Always check backend status on EVERY login
                const questionnaireCompleted = await this.checkQuestionnaireCompleted();
                
                // Hide questionnaire button if completed
                const questionnaireBtn = document.querySelector('[data-page="questionnaire"]');
                if (questionnaireCompleted && questionnaireBtn) {
                    questionnaireBtn.style.display = 'none';
                }
                
                this.showMainApp(questionnaireCompleted);
            } else {
                messageEl.innerHTML = `<span class="text-red-500">${data.error}</span>`;
            }
        } catch (err) {
            messageEl.innerHTML = `<span class="text-red-500">Error: ${err.message}</span>`;
        }
    }
    

    showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }

    showMainApp(questionnaireCompleted) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        
        // Show questionnaire ONLY if NOT completed, otherwise landing
        if (!questionnaireCompleted) {
            this.showPage('questionnaire');
        } else {
            this.showPage('landing');
        }
    }

    showPage(page) {
        // Block questionnaire if user has completed it (check backend every time)
        if (page === 'questionnaire') {
            this.checkQuestionnaireCompleted().then(completed => {
                if (completed) {
                    alert('✅ Questionnaire already completed! Please use Dashboard to view results.');
                    this.showPage('landing'); // Redirect to landing
                } else {
                    this.renderActualPage(page);
                }
            });
            return;
        }
        
        this.renderActualPage(page);
    }

    renderActualPage(page) {
        document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`${page}-page`).classList.remove('hidden');
        document.querySelectorAll('.page-btn').forEach(btn => btn.classList.remove('bg-blue-50', 'border-blue-500'));
        document.querySelector(`[data-page="${page}"]`).classList.add('bg-blue-50', 'border-blue-500');
        
        if (page === 'questionnaire') this.renderQuestionnaire();
        if (page === 'mood') {
            this.loadPastMoods().then(() => this.renderCalendar());
        }
        if (page === 'chatbot') this.renderChat();
        if (page === 'dashboard') this.loadDashboard();
    }

    renderQuestionnaire() {
        const gadQuestions = [
            "Feeling nervous, anxious or on edge",
            "Not being able to stop or control worrying",
            "Worrying too much about different things",
            "Trouble relaxing",
            "Being so restless that it is hard to sit still",
            "Becoming easily annoyed or irritable",
            "Feeling afraid as if something awful might happen"
        ];

        const phqQuestions = [
            "Little interest or pleasure in doing things",
            "Feeling down, depressed, or hopeless",
            "Trouble falling or staying asleep, or sleeping too much",
            "Feeling tired or having little energy",
            "Poor appetite or overeating",
            "Feeling bad about yourself",
            "Trouble concentrating",
            "Moving or speaking slowly or being fidgety",
            "Thoughts of being better off dead"
        ];

        const gadContainer = document.getElementById('gad-sliders');
        const phqContainer = document.getElementById('phq-sliders');
        
        gadContainer.innerHTML = '';
        phqContainer.innerHTML = '';

        gadQuestions.forEach((q, i) => {
            gadContainer.innerHTML += `
                <div>
                    <label class="block text-sm font-medium mb-2">${q}</label>
                    <input type="range" min="0" max="3" value="0" id="gad-${i}" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                    <div class="flex justify-between text-xs mt-1">
                        <span>0 - Not at all</span>
                        <span>3 - Nearly every day</span>
                    </div>
                </div>
            `;
        });

        phqQuestions.forEach((q, i) => {
            phqContainer.innerHTML += `
                <div>
                    <label class="block text-sm font-medium mb-2">${q}</label>
                    <input type="range" min="0" max="3" value="0" id="phq-${i}" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                    <div class="flex justify-between text-xs mt-1">
                        <span>0 - Not at all</span>
                        <span>3 - Nearly every day</span>
                    </div>
                </div>
            `;
        });
    }

    async submitQuestionnaire() {
        const gadScores = [];
        const phqScores = [];
        
        for (let i = 0; i < 7; i++) gadScores.push(parseInt(document.getElementById(`gad-${i}`).value));
        for (let i = 0; i < 9; i++) phqScores.push(parseInt(document.getElementById(`phq-${i}`).value));
        
        const gadTotal = gadScores.reduce((a, b) => a + b, 0);
        const phqTotal = phqScores.reduce((a, b) => a + b, 0);

        await fetch('/api/questionnaire/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: this.userId, gadscore: gadTotal, phqscore: phqTotal, date: new Date().toISOString().split('T')[0] })
        });

        // Hide questionnaire button permanently for this user
        const questionnaireBtn = document.querySelector('[data-page="questionnaire"]');
        if (questionnaireBtn) {
            questionnaireBtn.style.display = 'none';
        }
        
        document.getElementById('questionnaire-result').innerHTML = 
            `<div class="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl">
                ✅ Responses submitted! GAD Score: ${gadTotal}, PHQ Score: ${phqTotal}
                <br><small>✅ Questionnaire completed forever! View results in Dashboard.</small>
            </div>`;
        
        // Auto-navigate to landing
        setTimeout(() => this.showPage('landing'), 2500);
    }

    async saveJournal() {
        const text = document.getElementById('journal-text').value;
        if (!text.trim()) return;

        const sentiment = text.includes('happy') || text.includes('good') ? 0.7 : 
                         text.includes('sad') || text.includes('bad') ? -0.3 : 0.2;

        await fetch('/api/journal/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: this.userId, entry: text, sentiment, date: new Date().toISOString().split('T')[0] })
        });

        document.getElementById('journal-result').innerHTML = 
            `<div class="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl">
                ✅ Journal saved. Sentiment Score: ${sentiment.toFixed(2)}
            </div>`;
        document.getElementById('journal-text').value = '';
    }

    changeMonth(direction) {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + direction);
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();
        
        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('calendar-month-year').textContent = 
            `${monthNames[month]} ${year}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Get calendar grid container (skip the 7 day headers)
        const grid = document.getElementById('calendar-grid');
        const existingDays = grid.querySelectorAll('.calendar-day');
        existingDays.forEach(day => day.remove());

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'p-2';
            grid.appendChild(emptyCell);
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all text-center';
            dayCell.dataset.date = dateStr;
            
            // Check if this date has a mood entry
            const moodScore = this.moodData[dateStr];
            if (moodScore !== undefined) {
                dayCell.classList.add('bg-green-50', 'border-green-400');
                dayCell.innerHTML = `
                    <div class="font-semibold mb-1">${day}</div>
                    <div class="text-2xl">${this.getMoodEmoji(moodScore)}</div>
                `;
            } else {
                dayCell.innerHTML = `<div class="font-semibold">${day}</div>`;
            }

            // Add click handler
            dayCell.addEventListener('click', () => this.selectDate(dateStr));
            
            grid.appendChild(dayCell);
        }
    }

    selectDate(dateStr) {
        this.selectedDate = dateStr;
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        document.getElementById('selected-date-display').textContent = formattedDate;
        document.getElementById('mood-selection-panel').classList.remove('hidden');
        
        // Pre-select mood if date already has one
        const existingMood = this.moodData[dateStr];
        if (existingMood !== undefined) {
            this.selectedMood = existingMood.toString();
            const moodOption = document.querySelector(`.mood-option[data-mood="${existingMood}"]`);
            if (moodOption) {
                document.querySelectorAll('.mood-option').forEach(b => b.classList.remove('border-blue-500', 'bg-blue-50'));
                moodOption.classList.add('border-blue-500', 'bg-blue-50');
            }
        } else {
            this.selectedMood = null;
            document.querySelectorAll('.mood-option').forEach(b => b.classList.remove('border-blue-500', 'bg-blue-50'));
        }
    }

    cancelMoodSelection() {
        document.getElementById('mood-selection-panel').classList.add('hidden');
        this.selectedDate = null;
        this.selectedMood = null;
        document.getElementById('mood-result').innerHTML = '';
    }

    async saveMood() {
        if (!this.selectedDate || !this.selectedMood) {
            document.getElementById('mood-result').innerHTML = 
                `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-xl">Please select a mood.</div>`;
            return;
        }

        try {
            const res = await fetch('/api/mood/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: this.userId, 
                    date: this.selectedDate, 
                    moodscore: this.selectedMood 
                })
            });

            const data = await res.json();
            if (data.success) {
                // Update local mood data
                this.moodData[this.selectedDate] = parseInt(this.selectedMood);
                
                document.getElementById('mood-result').innerHTML = 
                    `<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-xl">✅ Mood saved!</div>`;
                
                // Re-render calendar to show the new mood badge
                this.renderCalendar();
                
                // Hide panel after a short delay
                setTimeout(() => {
                    this.cancelMoodSelection();
                }, 1500);
            } else {
                document.getElementById('mood-result').innerHTML = 
                    `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-xl">Error: ${data.error}</div>`;
            }
        } catch (err) {
            document.getElementById('mood-result').innerHTML = 
                `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-xl">Error: ${err.message}</div>`;
        }
    }

    async loadPastMoods() {
        try {
            const res = await fetch(`/api/mood/${this.userId}`);
            const moods = await res.json();
            
            // Convert array to object for easy lookup
            this.moodData = {};
            moods.forEach(m => {
                this.moodData[m.date] = m.moodscore;
            });
        } catch (err) {
            console.error('Error loading moods:', err);
            this.moodData = {};
        }
    }

    getMoodEmoji(score) {
        const emojis = { '3': '😊', '2': '😐', '1': '😔', '0': '😰' };
        const scoreStr = score.toString();
        return emojis[scoreStr] || '❓';
    }

    // ---------- Voice Features ----------
    
// Replace the initVoiceFeatures() and toggleRecording() methods with this FIXED version:

initVoiceFeatures() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'en-US';
        this.recognition.continuous = false;  // ✅ FIXED: false for push-to-talk
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        
        // ✅ FIXED: Single comprehensive result handler
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }
            
            const transcript = (finalTranscript + ' ' + interimTranscript).trim();
            if (transcript) {
                const input = document.getElementById('chat-input');
                input.value = input.value ? (input.value + ' ' + transcript) : transcript;
                input.focus();
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech error:', event.error);
            this.stopRecording(); // ✅ Clean stop on error
        };
        
        this.recognition.onend = () => {
            // ✅ FIXED: Only auto-restart ONCE after speech ends
            if (this.isRecording) {
                this.stopRecording();
            }
        };
        
        // ✅ NEW: Visual feedback during recognition
        this.recognition.onstart = () => {
            console.log('🎤 Listening...');
        };
        
    } else {
        console.warn('SpeechRecognition not supported');
    }
    
    // SpeechSynthesis (unchanged)
    if ('speechSynthesis' in window) {
        const populateVoices = () => {
            this.voices = window.speechSynthesis.getVoices();
            const select = document.getElementById('bot-voice-select');
            if (!select) return;
            
            select.innerHTML = '<option value="">Auto</option>';
            this.voices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                select.appendChild(option);
            });
            
            const englishVoice = this.voices.find(v => v.lang.startsWith('en'));
            this.currentVoice = englishVoice || this.voices[0];
        };
        
        populateVoices();
        window.speechSynthesis.onvoiceschanged = populateVoices;
    }
}

toggleRecording() {
    if (!this.recognition) {
        alert('Voice input not supported. Use Chrome/Edge.');
        return;
    }
    
    const btn = document.getElementById('voice-btn');
    
    if (!this.isRecording) {
        // ✅ START: Clear + Listen (5-10 seconds max)
        this.isRecording = true;
        document.getElementById('chat-input').value = '';
        
        btn.textContent = '🔴';
        btn.classList.add('recording');
        btn.title = 'Listening... Click to stop';
        
        try {
            console.log('🎤 Starting recognition...');
            this.recognition.start();
        } catch (err) {
            console.error('Start failed:', err);
            this.stopRecording();
        }
    } else {
        this.stopRecording();
    }
}

// ✅ NEW: Clean stop method
stopRecording() {
    this.isRecording = false;
    if (this.recognition) {
        this.recognition.stop();
    }
    const btn = document.getElementById('voice-btn');
    if (btn) {
        btn.textContent = '🎙';
        btn.classList.remove('recording');
        btn.title = 'Click to speak';
    }
}


    
    speak(text) {
        if (!('speechSynthesis' in window)) return;
        if (!text) return;
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        
        if (this.currentVoice) {
            utterance.voice = this.currentVoice;
        }
        
        // Natural speech settings
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        window.speechSynthesis.speak(utterance);
    }

    renderChat() {
        const container = document.getElementById('chat-messages');
        container.innerHTML = this.chatHistory.map(msg => 
            `<div class="mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}">
                <div class="inline-block p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'} max-w-xs">
                    ${msg.content}
                </div>
            </div>`
        ).join('');
        container.scrollTop = container.scrollHeight;
    }

    async sendChat() {
        const input = document.getElementById('chat-input');
        const prompt = input.value.trim();
        if (!prompt) return;

        // Stop recording if active
        if (this.isRecording) {
            this.recognition.stop();
        }

        this.chatHistory.push({ role: 'user', content: prompt });
        input.value = '';
        this.renderChat();

        const res = await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: this.userId, prompt })
        });
        const data = await res.json();
        this.chatHistory.push({ role: 'assistant', content: data.response });
        this.renderChat();
        
        // Speak the response
        this.speak(data.response);
    }

    resetChat() {
        this.chatHistory = [];
        document.getElementById('chat-messages').innerHTML = '';
        
        // Stop any ongoing speech
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        // Stop recording if active
        if (this.isRecording) {
            this.recognition.stop();
        }
    }

    async loadDashboard() {
        try {
            const res = await fetch(`/api/dashboard/data/${this.userId}`);
            const data = await res.json();

            // Transform data to match chart format
            const questionnaireData = (data.questionnaire || []).map(q => ({
                date: q.date,
                gad_score: q.gadscore,
                phq_score: q.phqscore
            }));

            const moodData = (data.mood || []).map(m => ({
                date: m.date,
                mood_score: m.moodscore
            }));

            const journalData = (data.journal || []).map(j => ({
                date: j.date,
                sentiment: j.sentiment
            }));

            const chatData = (data.chat || []).map(c => ({
                date: c.date,
                sentiment: c.sentiment
            }));

            // Only render charts if data exists
            if (questionnaireData.length > 0) {
                this.renderChart('questionnaire-chart', questionnaireData, {
                    title: 'GAD & PHQ Scores Over Time',
                    y: ['gad_score', 'phq_score']
                });
            } else {
                document.getElementById('questionnaire-chart').innerHTML = 
                    '<div class="flex items-center justify-center h-full text-gray-500">No questionnaire data yet. Complete the questionnaire to see your scores.</div>';
            }

            if (moodData.length > 0) {
                this.renderChart('mood-chart', moodData, {
                    title: 'Mood Tracker Over Time',
                    y: 'mood_score'
                });
            } else {
                document.getElementById('mood-chart').innerHTML = 
                    '<div class="flex items-center justify-center h-full text-gray-500">No mood entries yet. Track your mood in the Mood Calendar.</div>';
            }

            if (journalData.length > 0) {
                this.renderChart('journal-chart', journalData, {
                    title: 'Journal Sentiment Over Time',
                    y: 'sentiment'
                });
            } else {
                document.getElementById('journal-chart').innerHTML = 
                    '<div class="flex items-center justify-center h-full text-gray-500">No journal entries yet. Start writing in your journal.</div>';
            }

            if (chatData.length > 0) {
                this.renderChart('chat-chart', chatData, {
                    title: 'Chat Sentiment Over Time',
                    y: 'sentiment'
                });
            } else {
                document.getElementById('chat-chart').innerHTML = 
                    '<div class="flex items-center justify-center h-full text-gray-500">No chat history yet. Start chatting with the therapist.</div>';
            }
        } catch (err) {
            console.error('Error loading dashboard:', err);
            // Show error messages in all chart containers
            const errorMsg = '<div class="flex items-center justify-center h-full text-red-500">Error loading data. Please try again.</div>';
            document.getElementById('questionnaire-chart').innerHTML = errorMsg;
            document.getElementById('mood-chart').innerHTML = errorMsg;
            document.getElementById('journal-chart').innerHTML = errorMsg;
            document.getElementById('chat-chart').innerHTML = errorMsg;
        }
    }

    renderChart(containerId, data, config) {
        if (!data || data.length === 0) {
            return;
        }

        const trace1 = {
            x: data.map(d => d.date),
            y: Array.isArray(config.y) ? data.map(d => d[config.y[0]]) : data.map(d => d[config.y]),
            type: 'scatter',
            mode: 'lines+markers',
            name: Array.isArray(config.y) ? 'GAD' : config.y
        };

        const layout = {
            title: config.title,
            height: 300,
            margin: { t: 40, b: 40, l: 60, r: 20 }
        };

        if (Array.isArray(config.y) && config.y.length > 1) {
            const trace2 = {
                x: data.map(d => d.date),
                y: data.map(d => d[config.y[1]]),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'PHQ'
            };
            Plotly.newPlot(containerId, [trace1, trace2], layout);
        } else {
            Plotly.newPlot(containerId, [trace1], layout);
        }
    }

    logout() {
        this.userId = null;
        this.chatHistory = [];
        // Don't reset questionnaire button - let backend decide on next login
        this.showLogin();
    }
}

// Initialize app
new MindMateApp();
