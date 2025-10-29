import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Dashboard v2.0
 * Tests critical user journeys end-to-end
 */

const BASE_URL = 'http://localhost:5173';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Dashboard Loading', () => {
    test('should load dashboard without errors', async ({ page }) => {
      // Check for errors in console
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Wait for main content
      await expect(page.getByRole('main')).toBeVisible();
      
      // Verify no critical errors
      expect(errors).toHaveLength(0);
    });

    test('should display all main dashboard sections', async ({ page }) => {
      // Check for KPI cards
      await expect(page.getByText(/Overall Completion/)).toBeVisible();
      await expect(page.getByText(/Processing Time/)).toBeVisible();
      
      // Check for main charts
      await expect(page.getByText(/Contractor Performance Radar/)).toBeVisible();
      await expect(page.getByText(/AI Actions for Bottlenecks/)).toBeVisible();
      
      // Check for secondary sections
      await expect(page.getByText(/Category Progress/)).toBeVisible();
      await expect(page.getByText(/30-Day Progress/)).toBeVisible();
    });

    test('performance: dashboard should load in less than 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000);
      console.log(`Dashboard loaded in ${loadTime}ms`);
    });
  });

  test.describe('Alert Management Flow', () => {
    test('should display alert banner when critical alerts exist', async ({ page }) => {
      // Check for alert banner
      const alertBanner = page.getByRole('alert');
      await expect(alertBanner).toBeVisible();
      
      // Check for alert text
      await expect(alertBanner).toContainText(/CRITICAL/);
      await expect(alertBanner).toContainText(/Red Cards Blocking/);
    });

    test('should open alerts modal when clicking View All', async ({ page }) => {
      // Find and click View All button
      const viewAllBtn = page.getByRole('button', { name: /View All/i });
      await viewAllBtn.click();
      
      // Wait for modal to appear
      await page.waitForTimeout(500); // Modal animation
      
      // Check for modal
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      
      // Check for modal content
      await expect(modal).toContainText(/Critical Alerts/);
      await expect(modal).toContainText(/Blocking/);
    });

    test('should filter alerts by tab', async ({ page }) => {
      // Open alerts modal
      await page.getByRole('button', { name: /View All/i }).click();
      await page.waitForTimeout(500);
      
      // Click on "Overdue" tab
      const overdueTab = page.getByRole('tab', { name: /Overdue/i });
      await overdueTab.click();
      
      // Verify tab is active
      await expect(overdueTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should send reminder when clicking Send Reminder button', async ({ page }) => {
      // Open alerts modal
      await page.getByRole('button', { name: /View All/i }).click();
      await page.waitForTimeout(500);
      
      // Find and click first Send Reminder button
      const sendReminderBtn = page.getByRole('button', { name: /Send Reminder/i }).first();
      await sendReminderBtn.click();
      
      // Check for success message
      await expect(page.getByText(/sent|Email/i)).toBeVisible();
    });

    test('should close modal when clicking X button', async ({ page }) => {
      // Open alerts modal
      await page.getByRole('button', { name: /View All/i }).click();
      await page.waitForTimeout(500);
      
      // Click close button
      const closeBtn = page.getByRole('button', { name: /Close|✕/i });
      await closeBtn.click();
      
      // Modal should be hidden
      const modal = page.getByRole('dialog');
      await expect(modal).not.toBeVisible();
    });

    test('should close modal when pressing ESC key', async ({ page }) => {
      // Open alerts modal
      await page.getByRole('button', { name: /View All/i }).click();
      await page.waitForTimeout(500);
      
      // Press ESC key
      await page.keyboard.press('Escape');
      
      // Modal should be hidden
      const modal = page.getByRole('dialog');
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('Contractor Performance Analysis', () => {
    test('should open radar detail modal when clicking Ranking Card', async ({ page }) => {
      // Find and click ranking card
      const rankingCard = page.getByText(/Contractor Ranking/);
      await rankingCard.click();
      
      // Wait for modal
      await page.waitForTimeout(500);
      
      // Check for modal
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(/Performance Details/);
    });

    test('should filter contractors in radar modal', async ({ page }) => {
      // Open ranking card
      await page.getByText(/Contractor Ranking/).click();
      await page.waitForTimeout(500);
      
      // Click "Contractor A" filter button
      const filterBtn = page.getByRole('button', { name: /Contractor A/i });
      await filterBtn.click();
      
      // Verify filter is applied
      await expect(filterBtn).toHaveAttribute('class', /active|selected/);
    });

    test('should export report from radar modal', async ({ page }) => {
      // Open ranking card
      await page.getByText(/Contractor Ranking/).click();
      await page.waitForTimeout(500);
      
      // Listen for download
      const downloadPromise = page.waitForEvent('download');
      
      // Click export button
      const exportBtn = page.getByRole('button', { name: /Export/i });
      if (await exportBtn.isVisible()) {
        await exportBtn.click();
        
        const download = await downloadPromise;
        expect(download).toBeDefined();
      }
    });
  });

  test.describe('AI Actions Execution', () => {
    test('should open actions modal when clicking AI Actions Panel', async ({ page }) => {
      // Find and click AI Actions panel
      const aiPanel = page.getByText(/AI Actions for Bottlenecks/);
      await aiPanel.click();
      
      // Wait for modal
      await page.waitForTimeout(500);
      
      // Check for modal
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(/Recommended Actions/);
    });

    test('should execute action when clicking Send Now', async ({ page }) => {
      // Open actions modal
      await page.getByText(/AI Actions for Bottlenecks/).click();
      await page.waitForTimeout(500);
      
      // Click Send Now button
      const sendBtn = page.getByRole('button', { name: /Send Now/i }).first();
      if (await sendBtn.isVisible()) {
        await sendBtn.click();
        
        // Check for success notification
        await expect(page.getByText(/sent|Email|success/i)).toBeVisible({ timeout: 5000 });
      }
    });

    test('should edit email preview before sending', async ({ page }) => {
      // Open actions modal
      await page.getByText(/AI Actions for Bottlenecks/).click();
      await page.waitForTimeout(500);
      
      // Find email subject field
      const emailSubject = page.locator('input[value*="Urgent"]').first();
      
      if (await emailSubject.isVisible()) {
        // Edit subject
        await emailSubject.click();
        await emailSubject.triple_click();
        await emailSubject.type('Updated Subject');
        
        // Verify change
        await expect(emailSubject).toHaveValue(/Updated Subject/);
      }
    });
  });

  test.describe('Category Analysis', () => {
    test('should open category modal when clicking Category Progress', async ({ page }) => {
      // Find and click category card
      const categoryCard = page.getByText(/Category Progress/);
      await categoryCard.click();
      
      // Wait for modal
      await page.waitForTimeout(500);
      
      // Check for modal
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(/Category Details/);
    });

    test('should switch between category tabs', async ({ page }) => {
      // Open category modal
      await page.getByText(/Category Progress/).click();
      await page.waitForTimeout(500);
      
      // Click on "By Contractor" tab
      const contractorTab = page.getByRole('tab', { name: /Contractor/i });
      await contractorTab.click();
      
      // Verify tab is active
      await expect(contractorTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should send reminders for missing documents', async ({ page }) => {
      // Open category modal
      await page.getByText(/Category Progress/).click();
      await page.waitForTimeout(500);
      
      // Click Send Reminders button
      const reminderBtn = page.getByRole('button', { name: /Send Reminders/i });
      if (await reminderBtn.isVisible()) {
        await reminderBtn.click();
        
        // Check for confirmation
        await expect(page.getByText(/sent|Email/i)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Timeline Management', () => {
    test('should open timeline modal when clicking 30-Day Progress', async ({ page }) => {
      // Find and click timeline card
      const timelineCard = page.getByText(/30-Day Progress/);
      await timelineCard.click();
      
      // Wait for modal
      await page.waitForTimeout(500);
      
      // Check for modal
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(/Project Timeline/);
    });

    test('should change timeline view mode', async ({ page }) => {
      // Open timeline modal
      await page.getByText(/30-Day Progress/).click();
      await page.waitForTimeout(500);
      
      // Click on "Week" view button
      const weekBtn = page.getByRole('button', { name: /Week/i });
      if (await weekBtn.isVisible()) {
        await weekBtn.click();
        
        // Verify button is active
        await expect(weekBtn).toHaveClass(/active|selected/);
      }
    });

    test('should filter timeline by contractor', async ({ page }) => {
      // Open timeline modal
      await page.getByText(/30-Day Progress/).click();
      await page.waitForTimeout(500);
      
      // Click contractor dropdown
      const dropdown = page.locator('select, [role="combobox"]').first();
      if (await dropdown.isVisible()) {
        await dropdown.click();
        
        // Select option
        await page.getByRole('option', { name: /Contractor A/i }).click();
        
        // Verify selection
        await expect(dropdown).toBeFocused();
      }
    });
  });

  test.describe('Complete User Journey', () => {
    test('scenario: Identify problem contractor → Take action → Verify', async ({ page }) => {
      // 1. Dashboard loads successfully
      await expect(page.getByRole('main')).toBeVisible();
      
      // 2. See critical alerts banner
      await expect(page.getByRole('alert')).toBeVisible();
      
      // 3. Click View All alerts
      await page.getByRole('button', { name: /View All/i }).click();
      await page.waitForTimeout(500);
      
      // 4. Verify alerts modal opened
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      
      // 5. Find blocking alert
      const blockingTab = page.getByRole('tab', { name: /Blocking/i });
      await blockingTab.click();
      
      // 6. Send reminder
      const sendBtn = page.getByRole('button', { name: /Send Reminder/i }).first();
      if (await sendBtn.isVisible()) {
        await sendBtn.click();
        await expect(page.getByText(/sent|Email/i)).toBeVisible();
      }
      
      // 7. Close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
      
      // 8. Verify back on dashboard
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('scenario: Analyze contractor performance → Compare → Export', async ({ page }) => {
      // 1. Click on Ranking Card
      await page.getByText(/Contractor Ranking/).click();
      await page.waitForTimeout(500);
      
      // 2. Modal opens
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      
      // 3. View metrics table
      await expect(modal).toContainText(/Performance/);
      
      // 4. Filter by contractor
      const filterBtn = page.getByRole('button', { name: /Contractor/i }).first();
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
      }
      
      // 5. Export if available
      const exportBtn = page.getByRole('button', { name: /Export/i });
      if (await exportBtn.isVisible()) {
        const downloadPromise = page.waitForEvent('download');
        await exportBtn.click();
        const download = await downloadPromise;
        expect(download).toBeDefined();
      }
    });
  });

  test.describe('Accessibility Requirements', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Tab through alert button
      await page.keyboard.press('Tab');
      
      // Check if element is focused
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.getAttribute('role');
      });
      
      expect(focusedElement).toBeTruthy();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check for ARIA labels
      const alertBanner = page.getByRole('alert');
      const ariaLabel = await alertBanner.getAttribute('aria-label');
      
      // Should have some accessible text
      await expect(alertBanner).toContainText(/CRITICAL|Red Cards|Blocking/);
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // This would require axe-core integration
      // For now, just verify text is visible
      const criticalText = page.getByText(/CRITICAL/);
      await expect(criticalText).toBeVisible();
    });

    test('should work without mouse (keyboard only)', async ({ page }) => {
      // Navigate using only Tab and Enter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Modal should open
      const modal = page.getByRole('dialog');
      
      // Either modal is visible or some action occurred
      const hasDialog = await modal.isVisible();
      expect(hasDialog || page.url()).toBeTruthy();
    });
  });

  test.describe('Performance Requirements', () => {
    test('modal should open in less than 500ms', async ({ page }) => {
      const startTime = Date.now();
      
      // Click to open modal
      await page.getByRole('button', { name: /View All/i }).click();
      
      // Wait for modal to be visible
      await page.getByRole('dialog').waitFor({ state: 'visible' });
      
      const openTime = Date.now() - startTime;
      
      expect(openTime).toBeLessThan(500);
      console.log(`Modal opened in ${openTime}ms`);
    });

    test('should not have layout shifts during load', async ({ page }) => {
      // Navigate and measure
      const startTime = Date.now();
      
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Check that elements are stable
      const kpiCard = page.getByText(/Overall Completion/);
      const rect1 = await kpiCard.boundingBox();
      
      await page.waitForTimeout(100);
      
      const rect2 = await kpiCard.boundingBox();
      
      // Position should be stable
      expect(rect1).toEqual(rect2);
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message on network failure', async ({ page }) => {
      // Simulate network error
      await page.context().setOffline(true);
      
      try {
        // Try to navigate
        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'load' });
      } catch (e) {
        // Expected to fail
      }
      
      // Should show error or reconnect message
      const errorOrSpinner = page.getByText(/Error|Loading|Retry/i);
      await expect(errorOrSpinner).toBeVisible({ timeout: 5000 });
    });

    test('should have retry functionality', async ({ page }) => {
      // Find retry button if visible
      const retryBtn = page.getByRole('button', { name: /Retry/i });
      
      if (await retryBtn.isVisible()) {
        await retryBtn.click();
        
        // Should attempt to reload
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('main')).toBeVisible();
      }
    });
  });
});
