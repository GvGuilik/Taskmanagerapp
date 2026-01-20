document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentWeekStart = getMonday(new Date());
    let selectedMember = 'all';
    let selectedCategory = 'all';
    let tasks = [];

    // API Base URL
    const API_URL = '/api/tasks';

    // Elements
    const weekTitle = document.getElementById('weekTitle');
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const memberBtns = document.querySelectorAll('.member-btn');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const addTaskBtns = document.querySelectorAll('.add-task-btn');
    const modal = document.getElementById('taskModal');
    const closeBtn = document.querySelector('.close-btn');
    const taskForm = document.getElementById('taskForm');
    const dayColumns = document.querySelectorAll('.day-column');

    // Initialize - load tasks from API
    loadTasksFromAPI();

    // Helper: Get Monday of the week
    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    // Helper: Format date
    function formatDate(date) {
        return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    }

    // Helper: Get week number
    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    // Helper: Get date string for comparison
    function getDateString(date) {
        return date.toISOString().split('T')[0];
    }

    // API: Load tasks from backend
    async function loadTasksFromAPI() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch tasks');
            tasks = await response.json();
            updateWeekDisplay();
        } catch (error) {
            console.error('Error loading tasks:', error);
            // Fallback to empty array
            tasks = [];
            updateWeekDisplay();
        }
    }

    // API: Create task
    async function createTask(taskData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
            if (!response.ok) throw new Error('Failed to create task');
            const newTask = await response.json();
            tasks.push(newTask);
            renderTasks();
            return newTask;
        } catch (error) {
            console.error('Error creating task:', error);
            return null;
        }
    }

    // API: Update task
    async function updateTask(id, updates) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error('Failed to update task');
            const updatedTask = await response.json();
            
            // Update local state
            const index = tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                tasks[index] = updatedTask;
            }
            return updatedTask;
        } catch (error) {
            console.error('Error updating task:', error);
            return null;
        }
    }

    // API: Delete task
    async function deleteTask(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete task');
            
            // Update local state
            tasks = tasks.filter(t => t.id !== id);
            return true;
        } catch (error) {
            console.error('Error deleting task:', error);
            return false;
        }
    }

    // Update week display
    function updateWeekDisplay() {
        const weekNum = getWeekNumber(currentWeekStart);
        const monthName = currentWeekStart.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
        weekTitle.textContent = `Week ${weekNum} - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;

        // Update day headers
        dayColumns.forEach((col, index) => {
            const date = new Date(currentWeekStart.getTime() + index * 86400000);
            const dayDate = col.querySelector('.day-date');
            dayDate.textContent = formatDate(date);
            col.dataset.date = getDateString(date);
        });

        renderTasks();
    }

    // Get category emoji
    function getCategoryEmoji(category) {
        const emojis = {
            huishouden: '🧹',
            boodschappen: '🛒',
            school: '📚',
            sport: '⚽',
            werk: '💼',
            overig: '📌'
        };
        return emojis[category] || '📌';
    }

    // Render tasks
    function renderTasks() {
        // Clear all task containers
        document.querySelectorAll('.tasks-container').forEach(container => {
            container.innerHTML = '';
        });

        // Filter and render tasks
        tasks.forEach(task => {
            // Check member filter
            if (selectedMember !== 'all' && task.member !== selectedMember) return;
            // Check category filter
            if (selectedCategory !== 'all' && task.category !== selectedCategory) return;

            // Find the right day column
            const dayColumn = document.querySelector(`.day-column[data-date="${task.day}"]`);
            if (!dayColumn) return;

            const container = dayColumn.querySelector('.tasks-container');
            const taskCard = createTaskCard(task);
            container.appendChild(taskCard);
        });

        updateStats();
    }

    // Create task card element
    function createTaskCard(task) {
        const card = document.createElement('div');
        card.className = `task-card ${task.completed ? 'completed' : ''}`;
        card.dataset.member = task.member;
        card.dataset.id = task.id;

        card.innerHTML = `
            <div class="task-header">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-title">${task.title}</span>
                <div class="task-actions">
                    <button class="task-copy" title="Kopieer naar andere dag">📋</button>
                    <button class="task-delete" title="Verwijderen">🗑️</button>
                </div>
            </div>
            <div class="task-meta">
                <span class="task-member ${task.member}">${task.member}</span>
                <span class="task-category">${getCategoryEmoji(task.category)} ${task.category}</span>
            </div>
        `;

        // Checkbox event
        const checkbox = card.querySelector('.task-checkbox');
        checkbox.addEventListener('change', async () => {
            const updated = await updateTask(task.id, { completed: checkbox.checked });
            if (updated) {
                task.completed = updated.completed;
                card.classList.toggle('completed', task.completed);
                updateStats();
            } else {
                // Revert checkbox if update failed
                checkbox.checked = task.completed;
            }
        });

        // Copy event
        const copyBtn = card.querySelector('.task-copy');
        copyBtn.addEventListener('click', () => {
            openCopyModal(task);
        });

        // Delete event
        const deleteBtn = card.querySelector('.task-delete');
        deleteBtn.addEventListener('click', async () => {
            const deleted = await deleteTask(task.id);
            if (deleted) {
                card.remove();
                updateStats();
            }
        });

        return card;
    }

    // Update statistics
    function updateStats() {
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            weekDates.push(getDateString(new Date(currentWeekStart.getTime() + i * 86400000)));
        }

        const weekTasks = tasks.filter(t => weekDates.includes(t.day));
        const total = weekTasks.length;
        const completed = weekTasks.filter(t => t.completed).length;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = total - completed;
    }

    // Event: Week navigation
    prevWeekBtn.addEventListener('click', () => {
        currentWeekStart = new Date(currentWeekStart.getTime() - 7 * 86400000);
        updateWeekDisplay();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentWeekStart = new Date(currentWeekStart.getTime() + 7 * 86400000);
        updateWeekDisplay();
    });

    // Event: Member filter
    memberBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            memberBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedMember = btn.dataset.member;
            renderTasks();
        });
    });

    // Event: Category filter
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCategory = btn.dataset.category;
            renderTasks();
        });
    });

    // Event: Add task button
    addTaskBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const dayColumn = btn.closest('.day-column');
            document.getElementById('taskDay').value = dayColumn.dataset.date;
            modal.classList.add('active');
            document.getElementById('taskTitle').focus();
        });
    });

    // Copy Modal elements
    const copyModal = document.getElementById('copyModal');
    const copyCloseBtn = copyModal.querySelector('.close-btn');
    const copyDaySelect = document.getElementById('copyDaySelect');
    const copyTaskBtn = document.getElementById('copyTaskBtn');
    let taskToCopy = null;

    // Open copy modal
    function openCopyModal(task) {
        taskToCopy = task;
        document.getElementById('copyTaskTitle').textContent = task.title;
        
        // Populate day options with current week days
        copyDaySelect.innerHTML = '';
        const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart.getTime() + i * 86400000);
            const dateStr = getDateString(date);
            const option = document.createElement('option');
            option.value = dateStr;
            option.textContent = `${dayNames[i]} - ${formatDate(date)}`;
            if (dateStr === task.day) {
                option.disabled = true;
                option.textContent += ' (huidige dag)';
            }
            copyDaySelect.appendChild(option);
        }
        
        copyModal.classList.add('active');
    }

    // Copy task to selected day
    copyTaskBtn.addEventListener('click', async () => {
        if (!taskToCopy) return;
        
        const newTaskData = {
            title: taskToCopy.title,
            member: taskToCopy.member,
            category: taskToCopy.category,
            day: copyDaySelect.value,
            completed: false
        };
        
        const newTask = await createTask(newTaskData);
        if (newTask) {
            copyModal.classList.remove('active');
            taskToCopy = null;
        }
    });

    // Event: Close copy modal
    copyCloseBtn.addEventListener('click', () => {
        copyModal.classList.remove('active');
        taskToCopy = null;
    });

    copyModal.addEventListener('click', (e) => {
        if (e.target === copyModal) {
            copyModal.classList.remove('active');
            taskToCopy = null;
        }
    });

    // Event: Close modal
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Event: Submit task form
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const taskData = {
            title: document.getElementById('taskTitle').value,
            member: document.getElementById('taskMember').value,
            category: document.getElementById('taskCategory').value,
            day: document.getElementById('taskDay').value,
            completed: false
        };

        const newTask = await createTask(taskData);
        
        if (newTask) {
            // Reset form and close modal
            taskForm.reset();
            modal.classList.remove('active');
        }
    });

    // Initialize
    updateWeekDisplay();
});
