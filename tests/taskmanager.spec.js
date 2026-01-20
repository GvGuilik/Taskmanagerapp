const { test, expect } = require('@playwright/test');

test.describe('Gezin Task Manager', () => {
    test.beforeEach(async ({ page }) => {
        // Clear localStorage before each test
        await page.goto('http://localhost:3000');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should display the title', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Gezin Task Manager');
    });

    test('should display all family members', async ({ page }) => {
        await expect(page.locator('.member-btn[data-member="Susan"]')).toBeVisible();
        await expect(page.locator('.member-btn[data-member="Gido"]')).toBeVisible();
        await expect(page.locator('.member-btn[data-member="Fien"]')).toBeVisible();
        await expect(page.locator('.member-btn[data-member="Luc"]')).toBeVisible();
    });

    test('should display all 7 days of the week', async ({ page }) => {
        const dayColumns = page.locator('.day-column');
        await expect(dayColumns).toHaveCount(7);
    });

    test('should display sample tasks on first load', async ({ page }) => {
        const tasks = page.locator('.task-card');
        await expect(tasks.first()).toBeVisible();
    });

    test('should navigate to previous week', async ({ page }) => {
        const weekTitle = page.locator('#weekTitle');
        const initialText = await weekTitle.textContent();
        
        await page.locator('#prevWeek').click();
        
        await expect(weekTitle).not.toHaveText(initialText);
    });

    test('should navigate to next week', async ({ page }) => {
        const weekTitle = page.locator('#weekTitle');
        const initialText = await weekTitle.textContent();
        
        await page.locator('#nextWeek').click();
        
        await expect(weekTitle).not.toHaveText(initialText);
    });

    test('should open modal when clicking add task button', async ({ page }) => {
        const addBtn = page.locator('.add-task-btn').first();
        await addBtn.click();
        
        const modal = page.locator('#taskModal');
        await expect(modal).toHaveClass(/active/);
    });

    test('should close modal when clicking close button', async ({ page }) => {
        await page.locator('.add-task-btn').first().click();
        await page.locator('.close-btn').click();
        
        const modal = page.locator('#taskModal');
        await expect(modal).not.toHaveClass(/active/);
    });

    test('should add a new task', async ({ page }) => {
        const initialCount = await page.locator('.task-card').count();
        
        // Open modal
        await page.locator('.add-task-btn').first().click();
        
        // Fill form
        await page.locator('#taskTitle').fill('Test taak toevoegen');
        await page.locator('#taskMember').selectOption('Fien');
        await page.locator('#taskCategory').selectOption('school');
        
        // Submit
        await page.locator('.submit-btn').click();
        
        // Verify task was added
        const tasks = page.locator('.task-card');
        await expect(tasks).toHaveCount(initialCount + 1);
    });

    test('should mark a task as completed', async ({ page }) => {
        const firstCheckbox = page.locator('.task-checkbox').first();
        await firstCheckbox.click();
        
        const firstTask = page.locator('.task-card').first();
        await expect(firstTask).toHaveClass(/completed/);
    });

    test('should delete a task', async ({ page }) => {
        const initialCount = await page.locator('.task-card').count();
        
        // Hover to show delete button
        const firstTask = page.locator('.task-card').first();
        await firstTask.hover();
        
        // Click delete
        await firstTask.locator('.task-delete').click();
        
        const tasks = page.locator('.task-card');
        await expect(tasks).toHaveCount(initialCount - 1);
    });

    test('should filter tasks by family member', async ({ page }) => {
        // Click on Susan filter
        await page.locator('.member-btn[data-member="Susan"]').click();
        
        // All visible tasks should be Susan's
        const visibleTasks = page.locator('.task-card:visible');
        const count = await visibleTasks.count();
        
        for (let i = 0; i < count; i++) {
            await expect(visibleTasks.nth(i)).toHaveAttribute('data-member', 'Susan');
        }
    });

    test('should filter tasks by category', async ({ page }) => {
        // Click on sport category
        await page.locator('.category-btn[data-category="sport"]').click();
        
        // Verify filter is active
        await expect(page.locator('.category-btn[data-category="sport"]')).toHaveClass(/active/);
    });

    test('should display statistics', async ({ page }) => {
        await expect(page.locator('#totalTasks')).toBeVisible();
        await expect(page.locator('#completedTasks')).toBeVisible();
        await expect(page.locator('#pendingTasks')).toBeVisible();
    });

    test('should update statistics when completing a task', async ({ page }) => {
        const completedBefore = await page.locator('#completedTasks').textContent();
        
        // Complete a task
        await page.locator('.task-checkbox').first().click();
        
        const completedAfter = await page.locator('#completedTasks').textContent();
        expect(parseInt(completedAfter)).toBe(parseInt(completedBefore) + 1);
    });

    test('should show all categories', async ({ page }) => {
        await expect(page.locator('.category-btn[data-category="huishouden"]')).toBeVisible();
        await expect(page.locator('.category-btn[data-category="boodschappen"]')).toBeVisible();
        await expect(page.locator('.category-btn[data-category="school"]')).toBeVisible();
        await expect(page.locator('.category-btn[data-category="sport"]')).toBeVisible();
        await expect(page.locator('.category-btn[data-category="overig"]')).toBeVisible();
    });
});
