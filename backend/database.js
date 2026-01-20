const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'tasks.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            member TEXT NOT NULL,
            category TEXT NOT NULL,
            day TEXT NOT NULL,
            completed INTEGER DEFAULT 0
        )
    `);

    // Check if we need to seed data
    db.get('SELECT COUNT(*) as count FROM tasks', (err, row) => {
        if (err) {
            console.error('Error checking tasks count:', err);
            return;
        }

        if (row.count === 0) {
            console.log('Seeding database with 6 initial tasks...');
            const today = new Date();
            const monday = getMonday(today);
            
            const seedTasks = [
                { title: 'Stofzuigen woonkamer', member: 'Susan', category: 'huishouden', day: formatDate(monday) },
                { title: 'Boodschappen halen', member: 'Gido', category: 'boodschappen', day: formatDate(monday) },
                { title: 'Huiswerk wiskunde', member: 'Fien', category: 'school', day: formatDate(addDays(monday, 1)) },
                { title: 'Voetbaltraining', member: 'Luc', category: 'sport', day: formatDate(addDays(monday, 1)) },
                { title: 'Vergadering voorbereiden', member: 'Gido', category: 'werk', day: formatDate(addDays(monday, 2)) },
                { title: 'Zwemles', member: 'Luc', category: 'sport', day: formatDate(addDays(monday, 3)) }
            ];

            const stmt = db.prepare('INSERT INTO tasks (title, member, category, day, completed) VALUES (?, ?, ?, ?, 0)');
            seedTasks.forEach(task => {
                stmt.run(task.title, task.member, task.category, task.day);
            });
            stmt.finalize();
            console.log('Database seeded successfully!');
        }
    });
});

// Helper functions
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

module.exports = db;
