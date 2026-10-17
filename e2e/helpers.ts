import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'Passw0rd!';

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.test`;
}

export async function signUp(page: Page, opts: { name: string; email: string; workspace: string }) {
  await page.goto('/signup');
  await page.getByLabel('Your name').fill(opts.name);
  await page.getByLabel('Work email').fill(opts.email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByLabel('Workspace name').fill(opts.workspace);
  await page.getByRole('button', { name: 'Create workspace' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
}

/** Reads the newest email to `to` from the dev mailbox API and returns the first link matching `path`. */
export async function linkFromMailbox(page: Page, to: string, path: string): Promise<string> {
  let link: string | undefined;
  await expect
    .poll(async () => {
      const list = await (await page.request.get(`/api/v1/dev/mailbox?to=${encodeURIComponent(to)}`)).json();
      for (const item of list as Array<{ id: string }>) {
        const mail = await (await page.request.get(`/api/v1/dev/mailbox/${item.id}`)).json();
        const match = (mail.html as string).match(new RegExp(`https?://[^"\\s]*${path}[^"\\s<]*`));
        if (match) {
          link = match[0];
          return true;
        }
      }
      return false;
    })
    .toBe(true);
  return new URL(link!).pathname + new URL(link!).search;
}
