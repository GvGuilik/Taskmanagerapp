const { test, expect } = require('@playwright/test');

test.describe('Gezin Task Manager', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
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

    test('should display tasks container', async ({ page }) => {
        const tasksContainer = page.locator('.tasks-container').first();
        await expect(tasksContainer).toBeVisible();
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
        await page.locator('.add-task-btn').first().click();
        
        const modal = page.locator('#taskModal');
        await expect(modal).toHaveClass(/active/);
    });

    test('should close modal when clicking close button', async ({ page }) => {
        await page.locator('.add-task-btn').first().click();
        await expect(page.locator('#taskModal')).toHaveClass(/active/);
        
        await page.locator('#taskModal .close-btn').click();
        await expect(page.locator('#taskModal')).not.toHaveClass(/active/);
    });

    test('should filter tasks by category', async ({ page }) => {
        await page.locator('.category-btn[data-category="sport"]').click();
        await expect(page.locator('.category-btn[data-category="sport"]')).toHaveClass(/active/);
    });

    test('should filter by family member', async ({ page }) => {
        await page.locator('.member-btn[data-member="Susan"]').click();
        await expect(page.locator('.member-btn[data-member="Susan"]')).toHaveClass(/active/);
    });

    test('should display statistics', async ({ page }) => {
        await expect(page.locator('#totalTasks')).toBeVisible();
        await expect(page.locator('#completedTasks')).toBeVisible();
        await expect(page.locator('#pendingTasks')).toBeVisible();
    });

    test('should show all categories', async ({ page }) => {
        await expect(page.locator('.category-btn[data-category="huishouden"]')).toBeVisible();
        await expect(page.locator('.category-btn[data-category="boodschappen"]')).toBeVisible();
        await expect(page.locator('.category-btn[data-category="school"]')).toBeVisible();
        await expect(page.locator('.category-btn[data-category="sport"]')).toBeVisible();
        await expect(page.locator('.category-btn[data-category="overig"]')).toBeVisible();
    });
});
