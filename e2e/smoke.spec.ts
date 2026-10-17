import { expect, test } from '@playwright/test';
import { linkFromMailbox, PASSWORD, signUp, uniqueEmail } from './helpers';

test('sign up → create project → add task', async ({ page }) => {
  await signUp(page, { name: 'Ada Founder', email: uniqueEmail('founder'), workspace: 'Rocket Labs' });
  await expect(page.getByText('No projects yet')).toBeVisible();

  await page.getByRole('button', { name: 'New project' }).first().click();
  await page.getByLabel('Name').fill('Launch plan');
  await page.getByLabel('Description').fill('Everything for launch day');
  await page.getByRole('button', { name: 'Create project' }).click();

  await page.getByRole('link', { name: /Launch plan/ }).click();
  await expect(page.getByRole('heading', { name: 'Launch plan' })).toBeVisible();

  await page.getByRole('button', { name: 'Add task to To do' }).click();
  await page.getByLabel('Title').fill('Write the press release');
  await page.getByRole('button', { name: 'Add task' }).click();

  const todo = page.getByRole('region', { name: 'To do' });
  await expect(todo.getByText('Write the press release')).toBeVisible();
  await expect(todo.getByText('1', { exact: true })).toBeVisible();
});

test('invite a teammate → they accept and land in the workspace', async ({ page, browser }) => {
  const inviteeEmail = uniqueEmail('teammate');
  await signUp(page, { name: 'Olivia Owner', email: uniqueEmail('owner'), workspace: 'Invite Co' });

  await page.getByRole('link', { name: 'Members' }).first().click();
  await page.getByRole('button', { name: 'Invite', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Email').fill(inviteeEmail);
  await page.getByRole('button', { name: 'Send invitation' }).click();
  await expect(page.getByText(inviteeEmail, { exact: true })).toBeVisible();

  const inviteLink = await linkFromMailbox(page, inviteeEmail, '/invite/');

  const invitee = await (await browser.newContext()).newPage();
  await invitee.goto(inviteLink);
  await expect(invitee.getByRole('heading', { name: 'Join Invite Co' })).toBeVisible();
  await invitee.getByLabel('Your name').fill('Tim Teammate');
  await invitee.getByLabel('Choose a password').fill(PASSWORD);
  await invitee.getByRole('button', { name: /Create account/ }).click();

  await expect(invitee).toHaveURL(/\/projects$/);
  await expect(invitee.getByRole('button', { name: /Current workspace: Invite Co/ })).toBeVisible();
  // Members can't create projects, so the button is hidden for them.
  await expect(invitee.getByRole('button', { name: 'New project' })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('listitem').filter({ hasText: 'Tim Teammate' })).toBeVisible();
});

test('hit the Free limit → upgrade via mock checkout → limit lifted', async ({ page }) => {
  await signUp(page, { name: 'Bea Buyer', email: uniqueEmail('buyer'), workspace: 'Upgrade Co' });

  for (const name of ['One', 'Two', 'Three']) {
    await page.getByRole('button', { name: 'New project' }).first().click();
    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Create project' }).click();
    await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();
  }

  await page.getByRole('button', { name: 'New project' }).first().click();
  await page.getByLabel('Name').fill('Four');
  await page.getByRole('button', { name: 'Create project' }).click();
  const prompt = page.getByRole('dialog', { name: 'Upgrade to keep growing' });
  await expect(prompt).toBeVisible();
  await prompt.getByRole('link', { name: 'See plans' }).click();

  await expect(page).toHaveURL(/\/settings\/billing$/);
  await page.getByRole('button', { name: 'Upgrade to Pro' }).click();
  await expect(page).toHaveURL(/\/billing\/mock-checkout/);
  await page.getByRole('button', { name: /Pay \$19/ }).click();

  await expect(page).toHaveURL(/\/settings\/billing\?checkout=success$/);
  await expect(page.getByRole('heading', { name: /Pro plan/ })).toBeVisible();

  await page.getByRole('link', { name: 'Projects' }).first().click();
  await page.getByRole('button', { name: 'New project' }).first().click();
  await page.getByLabel('Name').fill('Four');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('link', { name: /Four/ })).toBeVisible();

  await page.getByRole('link', { name: 'Audit log' }).first().click();
  await expect(page.getByRole('table').getByText('billing.plan_changed')).toBeVisible();
});
