import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL!;
const password = process.env.E2E_ADMIN_PASSWORD!;

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("ایمیل").fill(email);
  await page.getByLabel("رمز عبور").fill(password);
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page).toHaveURL(/\/admin(\/|$)/);
}

test("admin can create a page and publish a managed section", async ({ page }) => {
  await login(page);
  await page.goto("/admin/pages/new");
  await page.getByLabel("عنوان (فارسی)").fill("صفحه تست خودکار");
  await page.getByLabel("عنوان (English)").fill("Automated Test Page");
  await page.getByLabel("اسلاگ (آدرس صفحه)").fill("e2e-managed-page");
  await page.getByLabel("منتشر شده").check();
  await page.getByRole("button", { name: "ذخیره" }).click();
  const row = page.getByRole("row").filter({ hasText: "صفحه تست خودکار" });
  await expect(row).toBeVisible();
  await row.getByRole("link").click();
  await page.getByRole("button", { name: "افزودن سکشن" }).click();
  await page.getByLabel("عنوان فارسی").last().fill("سکشن تست");
  await page.getByLabel("English title").last().fill("Test section");
  await page.getByLabel("متن فارسی").last().fill("محتوای تست");
  await page.getByLabel("English body").last().fill("Test content");
  await page.getByLabel("وضعیت").last().selectOption("PUBLISHED");
  await page.getByRole("button", { name: "ذخیره سکشن" }).last().click();
  await page.goto("/fa/e2e-managed-page");
  await expect(page.getByRole("heading", { name: "سکشن تست" })).toBeVisible();
});

test("admin can reorder homepage sections", async ({ page }) => {
  await login(page);
  await page.goto("/admin/pages");
  const homeRow = page.getByRole("row").filter({ hasText: "/home" });
  await homeRow.getByRole("link").click();
  await expect(page.locator("article").first()).toContainText("هیرو");
  await page.locator("article").nth(1).getByRole("button", { name: /بالا/ }).click();
  await expect(page.locator("article").first()).not.toContainText("هیرو");
  await page.locator("article").nth(1).getByRole("button", { name: /بالا/ }).click();
  await expect(page.locator("article").first()).toContainText("هیرو");
});
