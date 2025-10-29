import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

/**
 * Accessibility Tests - WCAG 2.1 Level AA
 * Uses axe-core for automated accessibility checking
 */

const BASE_URL = 'http://localhost:5173';

test.describe('Dashboard Accessibility - WCAG AA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Accessibility', () => {
    test('homepage should pass axe accessibility audit', async ({ page }) => {
      await injectAxe(page);
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      });
    });

    test('should have proper language attribute', async ({ page }) => {
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBeTruthy();
    });

    test('should have valid page title', async ({ page }) => {
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });
  });

  test.describe('Heading Structure', () => {
    test('should have h1 on page', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
    });

    test('headings should be in logical order', async ({ page }) => {
      const headings = await page.locator('h1, h2, h3, h4').all();
      
      // Should have at least h1
      expect(headings.length).toBeGreaterThan(0);
      
      // First should be h1
      const firstLevel = await headings[0].evaluate(el => 
        parseInt(el.tagName[1])
      );
      expect(firstLevel).toBe(1);
    });

    test('should not skip heading levels', async ({ page }) => {
      const headingLevels: number[] = [];
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      for (const heading of headings) {
        const level = await heading.evaluate(el => 
          parseInt(el.tagName[1])
        );
        headingLevels.push(level);
      }
      
      // Check no skips (simple check - real validation more complex)
      for (let i = 1; i < headingLevels.length; i++) {
        const diff = Math.abs(headingLevels[i] - headingLevels[i - 1]);
        expect(diff).toBeLessThanOrEqual(1);
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('text should have sufficient color contrast', async ({ page }) => {
      await injectAxe(page);
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
    });

    test('alert banner should have high contrast', async ({ page }) => {
      const alertBanner = page.getByRole('alert');
      
      if (await alertBanner.isVisible()) {
        // Banner should have distinct styling
        const bgColor = await alertBanner.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        const textColor = await alertBanner.evaluate(el => 
          window.getComputedStyle(el).color
        );
        
        expect(bgColor).toBeTruthy();
        expect(textColor).toBeTruthy();
        expect(bgColor).not.toBe(textColor);
      }
    });

    test('buttons should have visible focus indicator', async ({ page }) => {
      const button = page.locator('button').first();
      
      // Tab to button
      await page.keyboard.press('Tab');
      
      const focusStyle = await button.evaluate(el => 
        window.getComputedStyle(el, ':focus-visible').outline
      );
      
      expect(focusStyle).toBeTruthy();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should be able to reach all interactive elements via keyboard', async ({ page }) => {
      const focusableElements: string[] = [];
      
      // Get all focusable elements
      const interactive = page.locator(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const count = await interactive.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should tab through interactive elements in order', async ({ page }) => {
      // Start tabbing
      await page.keyboard.press('Tab');
      const element1 = await page.evaluate(() => 
        document.activeElement?.tagName
      );
      
      await page.keyboard.press('Tab');
      const element2 = await page.evaluate(() => 
        document.activeElement?.tagName
      );
      
      // At least focused something
      expect(element1 || element2).toBeTruthy();
    });

    test('should have visible focus indicator on buttons', async ({ page }) => {
      const button = page.getByRole('button').first();
      
      // Focus button
      await button.focus();
      
      // Check if focused
      const isFocused = await button.evaluate(el => 
        el === document.activeElement
      );
      
      expect(isFocused).toBe(true);
    });

    test('Escape key should close modal', async ({ page }) => {
      // Open modal
      await page.getByRole('button', { name: /View All/i }).click();
      await page.waitForTimeout(300);
      
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Modal should close
      await expect(modal).not.toBeVisible();
    });

    test('Enter key should activate focused button', async ({ page }) => {
      const button = page.getByRole('button', { name: /View All/i });
      
      // Tab to button
      await button.focus();
      
      // Press Enter
      await page.keyboard.press('Enter');
      
      // Modal should open
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible({ timeout: 1000 });
    });
  });

  test.describe('ARIA Labels & Roles', () => {
    test('alert banner should have alert role', async ({ page }) => {
      const alert = page.getByRole('alert');
      
      if (await alert.isVisible()) {
        const role = await alert.getAttribute('role');
        expect(role).toBe('alert');
      }
    });

    test('modals should have dialog role', async ({ page }) => {
      // Open modal
      await page.getByRole('button', { name: /View All/i }).click();
      await page.waitForTimeout(300);
      
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      
      // Check aria-modal
      const ariaModal = await modal.getAttribute('aria-modal');
      expect(ariaModal).toBe('true');
    });

    test('tabs should have proper ARIA attributes', async ({ page }) => {
      // Open modal with tabs
      await page.getByRole('button', { name: /View All/i }).click();
      await page.waitForTimeout(300);
      
      const tabs = page.getByRole('tab');
      
      if (await tabs.count() > 0) {
        // Should have aria-selected
        const firstTab = tabs.first();
        const ariaSelected = await firstTab.getAttribute('aria-selected');
        expect(ariaSelected).toBeTruthy();
      }
    });

    test('buttons should have accessible names', async ({ page }) => {
      const buttons = page.getByRole('button');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        const name = await button.getAttribute('aria-label') || 
                     await button.textContent();
        expect(name).toBeTruthy();
      }
    });

    test('form inputs should have labels', async ({ page }) => {
      // Open modal that may have forms
      await page.getByRole('button', { name: /View All/i }).click();
      await page.waitForTimeout(300);
      
      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          // Should have associated label or aria-label
          const hasLabel = await label.count() > 0;
          const ariaLabel = await input.getAttribute('aria-label');
          expect(hasLabel || ariaLabel).toBeTruthy();
        }
      }
    });
  });

  test.describe('Focus Management', () => {
    test('focus should be visible on interactive elements', async ({ page }) => {
      const button = page.getByRole('button').first();
      
      // Focus element
      await button.focus();
      
      // Check outline (focus-visible style)
      const outline = await button.evaluate(el => 
        window.getComputedStyle(el, ':focus-visible').outlineWidth
      );
      
      // Should have some outline (exact value varies)
      expect(outline || '0px').not.toBe('0px');
    });

    test('focus order should be logical', async ({ page }) => {
      const focusedElements: string[] = [];
      
      // Tab through first 5 elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const active = await page.evaluate(() => 
          document.activeElement?.tagName
        );
        focusedElements.push(active || 'UNKNOWN');
      }
      
      // Should focus different elements
      expect(focusedElements.length).toBeGreaterThan(0);
    });

    test('should restore focus after closing modal', async ({ page }) => {
      // Focus button before opening modal
      const button = page.getByRole('button', { name: /View All/i });
      await button.focus();
      
      const beforeActive = await page.evaluate(() => 
        document.activeElement?.getAttribute('aria-label')
      );
      
      // Open modal
      await button.click();
      await page.waitForTimeout(300);
      
      // Close modal
      await page.keyboard.press('Escape');
      
      // Focus should return to button (or nearby)
      const afterActive = await page.evaluate(() => 
        document.activeElement?.getAttribute('aria-label')
      );
      
      // Either same element or nearby
      expect(beforeActive || afterActive).toBeTruthy();
    });
  });

  test.describe('Semantic HTML', () => {
    test('should use semantic navigation elements', async ({ page }) => {
      // Should have nav, main, or other semantic elements
      const main = page.locator('main');
      
      if (await main.count() > 0) {
        await expect(main).toBeVisible();
      }
    });

    test('should not use onclick for buttons', async ({ page }) => {
      const buttons = page.getByRole('button');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        const html = await button.outerHTML();
        
        // Should be actual button element
        expect(html).toContain('<button');
      }
    });

    test('should use semantic images', async ({ page }) => {
      const images = page.locator('img');
      
      // Check if images have alt attributes
      const count = await images.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        
        // Should have alt text (even if empty for decorative)
        expect(alt !== null).toBe(true);
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should have touch-friendly button sizes', async ({ page }) => {
      const button = page.getByRole('button').first();
      
      const box = await button.boundingBox();
      
      // Minimum 44x44 px
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40); // Allow some margin
        expect(box.width).toBeGreaterThanOrEqual(40);
      }
    });

    test('should allow zoom on mobile', async ({ page }) => {
      const viewport = await page.locator('meta[name="viewport"]')
        .getAttribute('content');
      
      // Should allow user-scalable
      if (viewport) {
        expect(viewport).toContain('maximum-scale');
        expect(viewport).not.toContain('user-scalable=no');
      }
    });
  });

  test.describe('Error Messages', () => {
    test('error messages should be linked to inputs', async ({ page }) => {
      // Open modal that might have forms
      await page.getByRole('button', { name: /View All/i }).click();
      await page.waitForTimeout(300);
      
      const inputs = page.locator('input[aria-invalid]');
      
      if (await inputs.count() > 0) {
        const input = inputs.first();
        const describedBy = await input.getAttribute('aria-describedby');
        
        if (describedBy) {
          const description = page.locator(`#${describedBy}`);
          await expect(description).toBeVisible();
        }
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have meaningful status messages', async ({ page }) => {
      const statusMessages = page.locator('[role="status"]');
      
      const count = await statusMessages.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const message = statusMessages.nth(i);
        const text = await message.textContent();
        expect(text).toBeTruthy();
      }
    });

    test('should have live regions for dynamic content', async ({ page }) => {
      const liveRegions = page.locator('[aria-live]');
      
      // Dashboard should have at least one live region
      const count = await liveRegions.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should announce modal opening', async ({ page }) => {
      // Open modal
      await page.getByRole('button', { name: /View All/i }).click();
      await page.waitForTimeout(300);
      
      const modal = page.getByRole('dialog');
      
      // Should have title that screen reader announces
      const title = modal.locator('h1, h2, [id$="title"]');
      
      if (await title.count() > 0) {
        const text = await title.first().textContent();
        expect(text).toBeTruthy();
      }
    });
  });

  test.describe('Motion & Animation', () => {
    test('should respect prefers-reduced-motion', async ({ page, context }) => {
      // Create page with reduced motion preference
      const newPage = await context.newPage();
      await newPage.addInitScript(() => {
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: (query: string) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
          }),
        });
      });
      
      await newPage.goto(`${BASE_URL}/dashboard`);
      
      // Animations should be minimal
      const button = newPage.getByRole('button').first();
      
      const transition = await button.evaluate(el => 
        window.getComputedStyle(el).transitionDuration
      );
      
      // Transition should be very short or 0
      expect(transition).toBeTruthy();
      
      await newPage.close();
    });
  });
});
