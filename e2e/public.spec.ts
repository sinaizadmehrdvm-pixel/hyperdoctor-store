import { expect, test } from "@playwright/test";

test("public Persian homepage is CMS-rendered and core navigation works", async ({ page }) => {
  await page.goto("/fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "هایپر دکتر" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "دسته‌بندی محصولات" })).toBeVisible();
  await page.getByRole("link", { name: /مشاهده محصولات/ }).click();
  await expect(page).toHaveURL(/\/fa\/shop/);
});

test("English homepage switches direction and renders CMS content", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: "Hyper Doctor" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Product categories" })).toBeVisible();
});

test("contact page exposes approved production contact details", async ({ page }) => {
  await page.goto("/fa/contact");
  await expect(page.getByText("04432257238")).toBeVisible();
  await expect(page.getByText("04432254578")).toBeVisible();
  await expect(page.getByText("09149483873")).toBeVisible();
  await expect(page.getByText("hyperdoctor@gmail.com")).toBeVisible();
  await expect(page.getByText("ارومیه خیام شمالی کوچه صناعی آذرسرا5 همکف")).toBeVisible();
});

test("unauthenticated admin routes are protected", async ({ page }) => {
  await page.goto("/admin/pages");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "ورود به پنل مدیریت" })).toBeVisible();
});

test("empty cart remains usable", async ({ page }) => {
  await page.goto("/fa/cart");
  await expect(page.getByRole("link", { name: /ادامه خرید/ })).toBeVisible();
});
