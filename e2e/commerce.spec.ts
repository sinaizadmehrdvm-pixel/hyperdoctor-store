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
  const categoryName = `دسته تست واقعی ${runKey}`;
  const productName = `محصول تست قیمت امن ${runKey}`;
  await page.getByLabel("نام (فارسی)").fill(categoryName);
  await page.getByLabel("نام (English)").fill("Real E2E Category");
  await page.getByLabel("اسلاگ (آدرس)").fill(categorySlug);
  await page.getByRole("button", { name: "ذخیره" }).click();
  await expect(page).toHaveURL(/\/admin\/categories$/);
  const categoryRow = page.getByRole("row").filter({ hasText: categoryName });
  await expect(categoryRow).toBeVisible();

  // Create a published product with a deliberately private/unapproved price.
  await page.goto("/admin/products/new");
  await page.getByLabel("نام (فارسی)").fill(productName);
  await page.getByLabel("نام (English)").fill("Safe Price E2E Product");
  await page.getByLabel("اسلاگ").fill(productSlug);
  await page.getByLabel("دسته‌بندی").selectOption({ label: categoryName });
  await page.getByLabel("برند").fill("E2E");
  await page.getByLabel("کد کالا (SKU)").fill(sku);
  await page.getByLabel("قیمت (تومان)").fill("125000");
  await page.getByLabel("موجودی انبار").fill("3");
  await page.getByLabel("منتشر شده (در سایت نمایش داده شود)").check();
  await expect(page.getByLabel("قیمت عمومی و تأییدشده")).not.toBeChecked();
  await page.getByRole("button", { name: "ذخیره" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);

  const productRow = page.getByRole("row").filter({ hasText: productName });
  await expect(productRow).toBeVisible();
  const editHref = await productRow.getByRole("link").getAttribute("href");
  expect(editHref).toMatch(/^\/admin\/products\//);
  const productId = editHref!.split("/").pop()!;

  // Public product must fail closed: no public price and no add-to-cart control.
  await page.goto(`/fa/product/${productSlug}`);
  await expect(page.getByRole("heading", { name: productName, exact: true })).toBeVisible();
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
  const cartItem = page.getByRole("listitem").filter({ hasText: productName });
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


test("dashboard cards are navigable and checkout rejects invalid payloads", async ({ page, request }) => {
  await login(page);
  await page.goto("/admin");
  const productsCard = page.getByRole("link").filter({ hasText: "محصولات" }).first();
  await expect(productsCard).toBeVisible();
  await productsCard.click();
  await expect(page).toHaveURL(/\/admin\/products$/);

  const invalid = await request.post("/api/checkout", { data: {} });
  expect(invalid.status()).toBe(400);

  const invalidQuantity = await request.post("/api/checkout", {
    data: {
      locale: "fa",
      customerName: "کاربر تست",
      phone: "09123456789",
      address: "آدرس تست معتبر برای سفارش",
      city: "ارومیه",
      lines: [{ type: "product", id: "missing-product", quantity: 51 }],
    },
  });
  expect(invalidQuantity.status()).toBe(400);
});

test("unpublished products stay private and approved price fails closed again", async ({ page }, testInfo) => {
  const runKey = `privacy-${testInfo.workerIndex}-${Date.now()}`;
  const categoryName = `دسته حریم ${runKey}`;
  const productName = `محصول خصوصی ${runKey}`;
  const productSlug = `private-${runKey}`;
  await login(page);

  await page.goto("/admin/categories/new");
  await page.getByLabel("نام (فارسی)").fill(categoryName);
  await page.getByLabel("نام (English)").fill(`Privacy ${runKey}`);
  await page.getByLabel("اسلاگ (آدرس)").fill(`privacy-cat-${runKey}`);
  await page.getByRole("button", { name: "ذخیره" }).click();

  await page.goto("/admin/products/new");
  await page.getByLabel("نام (فارسی)").fill(productName);
  await page.getByLabel("نام (English)").fill(`Private ${runKey}`);
  await page.getByLabel("اسلاگ").fill(productSlug);
  await page.getByLabel("دسته‌بندی").selectOption({ label: categoryName });
  await page.getByLabel("کد کالا (SKU)").fill(`PRIVATE-${runKey}`);
  await page.getByLabel("قیمت (تومان)").fill("99000");
  await page.getByLabel("موجودی انبار").fill("2");
  await page.getByLabel("قیمت عمومی و تأییدشده").check();
  await page.getByRole("button", { name: "ذخیره" }).click();

  await page.goto(`/fa/product/${productSlug}`);
  await expect(page.getByText(/404|یافت نشد|not found/i)).toBeVisible();

  await page.goto("/admin/products");
  const row = page.getByRole("row").filter({ hasText: productName });
  const editHref = await row.getByRole("link").getAttribute("href");
  await page.goto(editHref!);
  await page.getByLabel("منتشر شده (در سایت نمایش داده شود)").check();
  await page.getByRole("button", { name: "ذخیره" }).click();
  await page.goto(`/fa/product/${productSlug}`);
  await expect(page.getByRole("heading", { name: productName, exact: true })).toBeVisible();
  await expect(page.getByRole("button").filter({ hasText: /سبد/ }).first()).toBeVisible();

  await page.goto(editHref!);
  await page.getByLabel("قیمت عمومی و تأییدشده").uncheck();
  await page.getByRole("button", { name: "ذخیره" }).click();
  await page.goto(`/fa/product/${productSlug}`);
  await expect(page.getByText("استعلام قیمت")).toBeVisible();
  await expect(page.getByRole("button", { name: /سبد|cart/i })).toHaveCount(0);
});

test("Persian shop remains RTL and usable on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/fa/shop");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("body")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
});


test("product gallery supports real uploads, primary selection and published visibility", async ({ page }, testInfo) => {
  const runKey = `gallery-${testInfo.workerIndex}-${Date.now()}`;
  const categoryName = `دسته گالری ${runKey}`;
  const productName = `محصول گالری ${runKey}`;
  const productSlug = `gallery-${runKey}`;
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  await login(page);

  await page.goto("/admin/categories/new");
  await page.getByLabel("نام (فارسی)").fill(categoryName);
  await page.getByLabel("نام (English)").fill(`Gallery ${runKey}`);
  await page.getByLabel("اسلاگ (آدرس)").fill(`gallery-cat-${runKey}`);
  await page.getByRole("button", { name: "ذخیره" }).click();

  await page.goto("/admin/products/new");
  await page.getByLabel("نام (فارسی)").fill(productName);
  await page.getByLabel("نام (English)").fill(`Gallery Product ${runKey}`);
  await page.getByLabel("اسلاگ").fill(productSlug);
  await page.getByLabel("دسته‌بندی").selectOption({ label: categoryName });
  await page.getByLabel("کد کالا (SKU)").fill(`GALLERY-${runKey}`);
  await page.getByLabel("قیمت (تومان)").fill("100000");
  await page.getByLabel("موجودی انبار").fill("5");
  await page.getByLabel("منتشر شده (در سایت نمایش داده شود)").check();
  await page.getByRole("button", { name: "ذخیره" }).click();

  const row = page.getByRole("row").filter({ hasText: productName });
  const editHref = await row.getByRole("link").getAttribute("href");
  await page.goto(editHref!);
  const gallery = page.getByRole("heading", { name: "گالری محصول" }).locator("..").locator("..");
  const fileInput = gallery.locator('input[type="file"]').first();
  await fileInput.setInputFiles({ name: "gallery-1.png", mimeType: "image/png", buffer: png });
  await expect(gallery.getByText("حذف تصویر").first()).toBeVisible();
  await gallery.getByLabel("Alt فارسی").first().fill(`تصویر اول ${runKey}`);
  await gallery.getByLabel("Alt English").first().fill(`First image ${runKey}`);
  await gallery.getByRole("button", { name: "افزودن به گالری" }).click();
  await expect(gallery.getByText("اصلی")).toBeVisible();

  await gallery.locator('input[type="file"]').first().setInputFiles({ name: "gallery-2.png", mimeType: "image/png", buffer: png });
  await gallery.getByLabel("Alt فارسی").first().fill(`تصویر دوم ${runKey}`);
  await gallery.getByLabel("Alt English").first().fill(`Second image ${runKey}`);
  await gallery.getByRole("button", { name: "افزودن به گالری" }).click();
  await expect(gallery.getByRole("button", { name: "انتخاب به‌عنوان تصویر اصلی" })).toHaveCount(1);
  await gallery.getByRole("button", { name: "انتخاب به‌عنوان تصویر اصلی" }).click();

  await page.goto(`/fa/product/${productSlug}`);
  const publicGallery = page.getByLabel("گالری تصاویر محصول");
  await expect(publicGallery).toBeVisible();
  await expect(publicGallery.getByRole("tab")).toHaveCount(2);
  await expect(publicGallery.getByText("1 / 2")).toBeVisible();
  await publicGallery.getByRole("button", { name: "تصویر بعدی" }).click();
  await expect(publicGallery.getByText("2 / 2")).toBeVisible();
});


test("category deletion is guarded until its product is deleted", async ({ page }, testInfo) => {
  const runKey = `delete-${testInfo.workerIndex}-${Date.now()}`;
  const categoryName = `دسته حذف ${runKey}`;
  const productName = `محصول حذف ${runKey}`;
  await login(page);

  await page.goto("/admin/categories/new");
  await page.getByLabel("نام (فارسی)").fill(categoryName);
  await page.getByLabel("نام (English)").fill(`Delete ${runKey}`);
  await page.getByLabel("اسلاگ (آدرس)").fill(`delete-cat-${runKey}`);
  await page.getByRole("button", { name: "ذخیره" }).click();

  await page.goto("/admin/products/new");
  await page.getByLabel("نام (فارسی)").fill(productName);
  await page.getByLabel("نام (English)").fill(`Delete Product ${runKey}`);
  await page.getByLabel("اسلاگ").fill(`delete-product-${runKey}`);
  await page.getByLabel("دسته‌بندی").selectOption({ label: categoryName });
  await page.getByLabel("کد کالا (SKU)").fill(`DELETE-${runKey}`);
  await page.getByLabel("قیمت (تومان)").fill("1");
  await page.getByLabel("موجودی انبار").fill("0");
  await page.getByRole("button", { name: "ذخیره" }).click();

  await page.goto("/admin/categories");
  const categoryRow = page.getByRole("row").filter({ hasText: categoryName });
  await expect(categoryRow.getByRole("button", { name: "حذف" })).toBeDisabled();

  await page.goto("/admin/products");
  const productRow = page.getByRole("row").filter({ hasText: productName });
  page.once("dialog", dialog => dialog.accept());
  await productRow.getByRole("button", { name: "حذف" }).click();
  await expect(page.getByRole("row").filter({ hasText: productName })).toHaveCount(0);

  await page.goto("/admin/categories");
  const emptyCategoryRow = page.getByRole("row").filter({ hasText: categoryName });
  await expect(emptyCategoryRow.getByRole("button", { name: "حذف" })).toBeEnabled();
  page.once("dialog", dialog => dialog.accept());
  await emptyCategoryRow.getByRole("button", { name: "حذف" }).click();
  await expect(page.getByRole("row").filter({ hasText: categoryName })).toHaveCount(0);
});
