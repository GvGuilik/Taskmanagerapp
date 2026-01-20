const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes

// GET /api/tasks - Get all tasks
app.get('/api/tasks', (req, res) => {
    const { member, category, startDate, endDate } = req.query;
    
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (member && member !== 'all') {
        sql += ' AND member = ?';
        params.push(member);
    }

    if (category && category !== 'all') {
        sql += ' AND category = ?';
        params.push(category);
    }

    if (startDate) {
        sql += ' AND day >= ?';
        params.push(startDate);
    }

    if (endDate) {
        sql += ' AND day <= ?';
        params.push(endDate);
    }

    sql += ' ORDER BY day ASC, id ASC';

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            return res.status(500).json({ error: 'Failed to fetch tasks' });
        }
        
        // Convert completed from 0/1 to boolean
        const tasks = rows.map(row => ({
            ...row,
            completed: row.completed === 1
        }));
        
        res.json(tasks);
    });
});

// GET /api/tasks/:id - Get single task
app.get('/api/tasks/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching task:', err);
            return res.status(500).json({ error: 'Failed to fetch task' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({
            ...row,
            completed: row.completed === 1
        });
    });
});

// POST /api/tasks - Create new task
app.post('/api/tasks', (req, res) => {
    const { title, member, category, day, completed = false } = req.body;

    if (!title || !member || !category || !day) {
        return res.status(400).json({ error: 'Missing required fields: title, member, category, day' });
    }

    const sql = 'INSERT INTO tasks (title, member, category, day, completed) VALUES (?, ?, ?, ?, ?)';
    const params = [title, member, category, day, completed ? 1 : 0];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('Error creating task:', err);
            return res.status(500).json({ error: 'Failed to create task' });
        }

        res.status(201).json({
            id: this.lastID,
            title,
            member,
            category,
            day,
            completed
        });
    });
});

// PUT /api/tasks/:id - Update task
app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, member, category, day, completed } = req.body;

    // First check if task exists
    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching task:', err);
            return res.status(500).json({ error: 'Failed to fetch task' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Build update query dynamically
        const updates = [];
        const params = [];

        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title);
        }
        if (member !== undefined) {
            updates.push('member = ?');
            params.push(member);
        }
        if (category !== undefined) {
            updates.push('category = ?');
            params.push(category);
        }
        if (day !== undefined) {
            updates.push('day = ?');
            params.push(day);
        }
        if (completed !== undefined) {
            updates.push('completed = ?');
            params.push(completed ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(id);
        const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;

        db.run(sql, params, function(err) {
            if (err) {
                console.error('Error updating task:', err);
                return res.status(500).json({ error: 'Failed to update task' });
            }

            // Fetch and return updated task
            db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, updatedRow) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to fetch updated task' });
                }
                res.json({
                    ...updatedRow,
                    completed: updatedRow.completed === 1
                });
            });
        });
    });
});

// DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching task:', err);
            return res.status(500).json({ error: 'Failed to fetch task' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Task not found' });
        }

        db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Error deleting task:', err);
                return res.status(500).json({ error: 'Failed to delete task' });
            }

            res.json({ message: 'Task deleted successfully', id: parseInt(id) });
        });
    });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server draait op http://localhost:${PORT}`);
    console.log(`API beschikbaar op http://localhost:${PORT}/api/tasks`);
});

module.exports = app;
