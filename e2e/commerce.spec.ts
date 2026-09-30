import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL!;
const password = process.env.E2E_ADMIN_PASSWORD!;

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("ایمیل").fill(email);
  await page.getByLabel("رمز عبور").fill(password);
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page.getByRole("button", { name: /خروج/ })).toBeVisible();
}

test("category and product lifecycle enforces safe pricing, stock, cart and upload security", async ({ page, request }, testInfo) => {
  const runKey = `e2e-${testInfo.workerIndex}-${Date.now()}`;
  const categorySlug = `real-${runKey}`;
  const productSlug = `safe-price-${runKey}`;
  const sku = `SAFE-${runKey}`;
  await login(page);

  // Upload endpoint must reject unsupported content even for an authenticated admin.
  const badUpload = await page.request.post("/api/admin/upload", {
    multipart: { file: { name: "unsafe.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg></svg>") } },
  });
  expect(badUpload.status()).toBe(400);
  await expect(badUpload.json()).resolves.toMatchObject({ error: /Unsupported image/ });

  // A real PNG must be accepted and persisted under /uploads.
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  const goodUpload = await page.request.post("/api/admin/upload", {
    multipart: { file: { name: "e2e.png", mimeType: "image/png", buffer: png } },
  });
  expect(goodUpload.status()).toBe(200);
  const uploaded = await goodUpload.json();
  expect(uploaded.url).toMatch(/^\/uploads\/[a-f0-9-]+\.png$/);

  // Create a dedicated category through the real admin UI.
  await page.goto("/admin/categories/new");
  await page.getByLabel("نام (فارسی)").fill("دسته تست واقعی");
  await page.getByLabel("نام (English)").fill("Real E2E Category");
  await page.getByLabel("اسلاگ (آدرس)").fill(categorySlug);
  await page.getByRole("button", { name: "ذخیره" }).click();
  await expect(page).toHaveURL(/\/admin\/categories$/);
  const categoryRow = page.getByRole("row").filter({ hasText: "دسته تست واقعی" }).last();
  await expect(categoryRow).toBeVisible();

  // Create a published product with a deliberately private/unapproved price.
  await page.goto("/admin/products/new");
  await page.getByLabel("نام (فارسی)").fill("محصول تست قیمت امن");
  await page.getByLabel("نام (English)").fill("Safe Price E2E Product");
  await page.getByLabel("اسلاگ").fill(productSlug);
  await page.getByLabel("دسته‌بندی").selectOption({ label: "دسته تست واقعی" });
  await page.getByLabel("برند").fill("E2E");
  await page.getByLabel("کد کالا (SKU)").fill(sku);
  await page.getByLabel("قیمت (تومان)").fill("125000");
  await page.getByLabel("موجودی انبار").fill("3");
  await page.getByLabel("منتشر شده (در سایت نمایش داده شود)").check();
  await expect(page.getByLabel("قیمت عمومی و تأییدشده")).not.toBeChecked();
  await page.getByRole("button", { name: "ذخیره" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);

  const productRow = page.getByRole("row").filter({ hasText: "محصول تست قیمت امن" }).last();
  await expect(productRow).toBeVisible();
  const editHref = await productRow.getByRole("link").getAttribute("href");
  expect(editHref).toMatch(/^\/admin\/products\//);
  const productId = editHref!.split("/").pop()!;

  // Public product must fail closed: no public price and no add-to-cart control.
  await page.goto(`/fa/product/${productSlug}`);
  await expect(page.getByRole("heading", { name: "محصول تست قیمت امن" })).toBeVisible();
  await expect(page.getByText("استعلام قیمت")).toBeVisible();
  await expect(page.getByRole("button", { name: /سبد|cart/i })).toHaveCount(0);

  // Server must independently reject checkout for a private price.
  const privateCheckout = await request.post("/api/checkout", {
    data: {
      locale: "fa", customerName: "کاربر تست", phone: "09123456789",
      address: "آدرس تست معتبر برای سفارش", city: "ارومیه",
      lines: [{ type: "product", id: productId, quantity: 1 }],
    },
  });
  expect(privateCheckout.status()).toBe(409);
  await expect(privateCheckout.json()).resolves.toMatchObject({ error: "Product unavailable" });

  // Approve the price in admin, then verify public purchase controls.
  await page.goto(editHref!);
  await page.getByLabel("قیمت عمومی و تأییدشده").check();
  await page.getByRole("button", { name: "ذخیره" }).click();
  await page.goto(`/fa/product/${productSlug}`);
  await expect(page.getByText(/۱۲۵|125/).first()).toBeVisible();
  const addButton = page.getByRole("button").filter({ hasText: /سبد/ }).first();
  await expect(addButton).toBeVisible();
  await addButton.click();

  // Cart quantity controls are real client-side state, not mocked.
  await page.goto("/fa/cart");
  const cartItem = page.getByText("محصول تست قیمت امن").locator("..");
  await expect(cartItem).toBeVisible();
  await cartItem.getByRole("button", { name: "+" }).click();
  await expect(cartItem.getByText("2", { exact: true })).toBeVisible();
  await cartItem.getByRole("button", { name: "-" }).click();
  await expect(cartItem.getByText("1", { exact: true })).toBeVisible();

  // Server-side stock validation must reject quantities above inventory.
  const stockCheckout = await request.post("/api/checkout", {
    data: {
      locale: "fa", customerName: "کاربر تست", phone: "09123456789",
      address: "آدرس تست معتبر برای سفارش", city: "ارومیه",
      lines: [{ type: "product", id: productId, quantity: 4 }],
    },
  });
  expect(stockCheckout.status()).toBe(409);
  await expect(stockCheckout.json()).resolves.toMatchObject({ error: /Insufficient stock/ });

  // Remove from cart and verify the empty-cart recovery path.
  await cartItem.getByRole("button", { name: /حذف/ }).click();
  await expect(page.getByText(/سبد.*خالی|خالی است/)).toBeVisible();
});
