# Team_7
## MENTAL HEALTH SUPPORT CHATBOT
## INTRODUCTION

The Mental Health Support Chatbot is an AI-powered system designed to provide accessible, stigma-free mental health support for university students. A large proportion of students experience stress, anxiety, and emotional challenges, yet many do not receive adequate care due to availability, privacy, and social barriers. This project addresses these challenges by offering an emotionally aware chatbot that delivers personalized support, mood tracking, and journaling while ensuring data privacy and security.

## METHODOLOGY

### User Registration & Initial Assessment

- Users register and complete standardized mental health assessments (PHQ-9 and GAD-7) once.

- Establishes an initial emotional baseline.

### Emotion & Sentiment Detection

- User chats and journal entries are analyzed using a fine-tuned emotion classification model.

- Emotional states are continuously updated.

### Context-Aware Chatbot Interaction

- A fine-tuned Large Language Model generates empathetic, context-sensitive responses.

- The chatbot adapts based on prior interactions and emotional history.

### Mood Tracking & Time-Series Analysis

- Daily mood logs are stored and analyzed.

- Emotional trends are visualized over time.

### Dynamic Dashboard Update

- User data is stored in a dynamic database.

- Dashboards display real-time emotional insights and trends.

## TECH STACK

- Sentiment Analysis: Fine-tuned GoEmotions Model

- Chatbot Engine: Fine-tuned LLM (via Groq/Gork)

- Backend: Python, Flask

- Frontend: Streamlit

- Database: SQLite (MySQL for scalability)

- Analytics & Visualization: Pandas, Matplotlib, Seaborn

## SYSTEM ARCHITECTURE OVERVIEW

- The Frontend (Streamlit) handles user interaction, login, journaling, and mood inputs.

- Requests are routed to the Backend (Flask APIs).

The backend invokes:

- Sentiment Analysis Module for emotion detection.

- LLM-based Chatbot Module for generating responses.

- All user data (mood logs, journals, chat history) is stored in a dynamic database.

- The Analytics Layer performs time-series analysis and generates visual insights.

- Results are sent back to the frontend dashboard for user interpretation.

- This architecture ensures real-time interaction, personalization, and scalability.

## RESULTS

- Achieved emotionally aware, empathetic chatbot responses.

- Successfully tracked mood variations and emotional trends.

- Improved contextual understanding compared to static chatbot systems.

- Enabled continuous learning through dynamic user data updates.

## SIGNIFICANCE

Provides 24/7 accessible mental health support.

Reduces stigma associated with seeking help.

Enables early emotional distress detection.

Ensures privacy, security, and transparency.

Bridges the gap between limited counseling resources and student needs.
## User Interface :
![dq1](https://github.com/user-attachments/assets/866a0a8f-1045-4c7f-8d67-a4ab0aad9c3d)
![dq2](https://github.com/user-attachments/assets/471a5e63-0845-4e08-aacc-ed89ac2143bb)
![dq3](https://github.com/user-attachments/assets/8351f3ec-ce8d-48b6-b158-45a20ac39443)
![dq4](https://github.com/user-attachments/assets/4cabcf49-0111-434e-bc74-29da14ac377b)
![dq5](https://github.com/user-attachments/assets/02cdaf23-8f97-4371-baeb-ffa99a3125c2)
![dq6](https://github.com/user-attachments/assets/9d279cd5-4209-40e6-a034-0b0a448234a3)
## FUTURE WORK

Integrate speech and physiological signal analysis.

Implement alert-based early intervention mechanisms.

Deploy scalable cloud-based infrastructure.

Collaborate with mental health professionals for validated guidance.

Extend support via a mobile application.


To run:
npm install
npm dev run
