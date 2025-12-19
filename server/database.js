const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../mindmate.db');
const db = new sqlite3.Database(dbPath);

function initDB() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS questionnaire (
      userid INTEGER,
      gadscore INTEGER,
      phqscore INTEGER,
      date TEXT
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS journal (
      userid INTEGER,
      entry TEXT,
      sentiment REAL,
      date TEXT
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS mood (
      userid INTEGER,
      date TEXT,
      moodscore INTEGER
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS chat (
      userid INTEGER,
      message TEXT,
      sentiment REAL,
      date TEXT
    )`);
  });
}

module.exports = { db, initDB };
