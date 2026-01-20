const request = require('supertest');
const app = require('../server');
const db = require('../database');

describe('Tasks API', () => {
    // Clean up and seed before tests
    beforeAll((done) => {
        db.serialize(() => {
            db.run('DELETE FROM tasks', () => {
                const seedTasks = [
                    { title: 'Test Task 1', member: 'Susan', category: 'huishouden', day: '2026-01-20' },
                    { title: 'Test Task 2', member: 'Gido', category: 'werk', day: '2026-01-21' },
                    { title: 'Test Task 3', member: 'Fien', category: 'school', day: '2026-01-22' }
                ];

                const stmt = db.prepare('INSERT INTO tasks (title, member, category, day, completed) VALUES (?, ?, ?, ?, 0)');
                seedTasks.forEach(task => {
                    stmt.run(task.title, task.member, task.category, task.day);
                });
                stmt.finalize(done);
            });
        });
    });

    // Clean up after all tests
    afterAll((done) => {
        db.close(done);
    });

    describe('GET /api/tasks', () => {
        test('should return all tasks', async () => {
            const response = await request(app)
                .get('/api/tasks')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(3);
        });

        test('should filter tasks by member', async () => {
            const response = await request(app)
                .get('/api/tasks?member=Susan')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            response.body.forEach(task => {
                expect(task.member).toBe('Susan');
            });
        });

        test('should filter tasks by category', async () => {
            const response = await request(app)
                .get('/api/tasks?category=huishouden')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            response.body.forEach(task => {
                expect(task.category).toBe('huishouden');
            });
        });
    });

    describe('POST /api/tasks', () => {
        test('should create a new task', async () => {
            const newTask = {
                title: 'Nieuwe Test Taak',
                member: 'Luc',
                category: 'sport',
                day: '2026-01-23'
            };

            const response = await request(app)
                .post('/api/tasks')
                .send(newTask)
                .expect(201);

            expect(response.body.title).toBe(newTask.title);
            expect(response.body.member).toBe(newTask.member);
            expect(response.body.category).toBe(newTask.category);
            expect(response.body.day).toBe(newTask.day);
            expect(response.body.completed).toBe(false);
            expect(response.body.id).toBeDefined();
        });

        test('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/api/tasks')
                .send({ title: 'Incomplete task' })
                .expect(400);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('GET /api/tasks/:id', () => {
        test('should return a single task', async () => {
            // First create a task
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({
                    title: 'Task to fetch',
                    member: 'Susan',
                    category: 'overig',
                    day: '2026-01-24'
                });

            const taskId = createResponse.body.id;

            const response = await request(app)
                .get(`/api/tasks/${taskId}`)
                .expect(200);

            expect(response.body.id).toBe(taskId);
            expect(response.body.title).toBe('Task to fetch');
        });

        test('should return 404 for non-existent task', async () => {
            const response = await request(app)
                .get('/api/tasks/99999')
                .expect(404);

            expect(response.body.error).toBe('Task not found');
        });
    });

    describe('PUT /api/tasks/:id', () => {
        test('should update a task', async () => {
            // First create a task
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({
                    title: 'Task to update',
                    member: 'Gido',
                    category: 'werk',
                    day: '2026-01-25'
                });

            const taskId = createResponse.body.id;

            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ completed: true })
                .expect(200);

            expect(response.body.completed).toBe(true);
        });

        test('should update multiple fields', async () => {
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({
                    title: 'Original title',
                    member: 'Fien',
                    category: 'school',
                    day: '2026-01-26'
                });

            const taskId = createResponse.body.id;

            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ 
                    title: 'Updated title',
                    category: 'overig'
                })
                .expect(200);

            expect(response.body.title).toBe('Updated title');
            expect(response.body.category).toBe('overig');
        });

        test('should return 404 for non-existent task', async () => {
            const response = await request(app)
                .put('/api/tasks/99999')
                .send({ completed: true })
                .expect(404);

            expect(response.body.error).toBe('Task not found');
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        test('should delete a task', async () => {
            // First create a task
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({
                    title: 'Task to delete',
                    member: 'Luc',
                    category: 'sport',
                    day: '2026-01-27'
                });

            const taskId = createResponse.body.id;

            const response = await request(app)
                .delete(`/api/tasks/${taskId}`)
                .expect(200);

            expect(response.body.message).toBe('Task deleted successfully');

            // Verify task is deleted
            await request(app)
                .get(`/api/tasks/${taskId}`)
                .expect(404);
        });

        test('should return 404 for non-existent task', async () => {
            const response = await request(app)
                .delete('/api/tasks/99999')
                .expect(404);

            expect(response.body.error).toBe('Task not found');
        });
    });
});
