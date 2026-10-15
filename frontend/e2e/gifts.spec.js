import { test, expect } from "@playwright/test";
import path from "node:path";

const frameCategory = {
  id: 10,
  name: "Wooden Frames",
  description: "Natural frame styles",
};
const giftCategory = {
  id: 20,
  name: "Birthday Gifts",
  description: "For their special day",
};
const gift = {
  id: 7,
  name: "Personalized Mug",
  description: "A thoughtful gift made for you.",
  price: 1500,
  available: true,
  featured: true,
  category: giftCategory,
  images: [
    { id: 1, imageUrl: "/images/hero-landscape.jpg" },
    { id: 2, imageUrl: "/images/hero-botanical.jpg" },
  ],
};
const paged = (items) => ({
  content: items,
  page: 0,
  size: 12,
  totalPages: items.length ? 1 : 0,
  totalElements: items.length,
});
const shots = path.resolve("../docs/screenshots");

test("gift browsing, category separation and WhatsApp work on desktop and mobile", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/settings/public")
      return route.fulfill({
        json: {
          shopName: "Honeybee Frames & Gifts",
          whatsappNumber: "94770000000",
        },
      });
    if (url.pathname === "/api/auth/me")
      return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/categories")
      return route.fulfill({ json: [frameCategory] });
    if (url.pathname === "/api/gift-categories")
      return route.fulfill({ json: [giftCategory] });
    if (url.pathname === "/api/gifts/7") return route.fulfill({ json: gift });
    if (url.pathname.startsWith("/api/gifts"))
      return route.fulfill({ json: paged([gift]) });
    if (url.pathname.startsWith("/api/frames"))
      return route.fulfill({ json: paged([]) });
    return route.fulfill({ json: {} });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/gifts");
  expect(
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link")
      .allTextContents(),
  ).toEqual(["Home", "All Frames", "All Gifts", "Categories", "Contact Us"]);
  await expect(
    page.getByRole("heading", { name: "Personalized Mug" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Wooden Frames" })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Birthday Gifts", exact: true })
    .click();
  await expect(page).toHaveURL(/category=20/);
  await page.getByLabel("Sort gifts").selectOption("price-desc");
  await expect(page).toHaveURL(/sort=price-desc/);
  await page.getByLabel("Search gifts").fill("Mug");
  await expect(page).toHaveURL(/keyword=Mug/);
  await page.screenshot({
    path: path.join(shots, "gifts-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "View details" }).click();
  await expect(page).toHaveURL(/\/gifts\/7$/);
  await expect(page.locator(".size-picker")).toHaveCount(0);
  await page.getByRole("button", { name: "View image 2" }).click();
  await expect(page.locator(".gallery-main > img")).toHaveAttribute(
    "src",
    "/images/hero-botanical.jpg",
  );
  const order = new URL(
    await page
      .getByRole("link", { name: "Order via WhatsApp" })
      .getAttribute("href"),
  );
  expect(order.searchParams.get("text")).toContain(
    "Gift Name: Personalized Mug",
  );
  expect(order.searchParams.get("text")).toContain("Category: Birthday Gifts");
  expect(order.searchParams.get("text")).toContain("/gifts/7");
  expect(order.searchParams.get("text")).not.toContain("Size:");
  await page.screenshot({
    path: path.join(shots, "gift-details-desktop.png"),
    fullPage: true,
  });
  await page.goto("/categories");
  await expect(
    page.getByRole("heading", { name: "Frame Categories", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Gift Categories", exact: true }),
  ).toBeVisible();
  await expect(page.locator('a[href="/gifts?category=20"]')).toBeVisible();
  await expect(page.locator('a[href="/frames?category=10"]')).toBeVisible();
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const url of ["/gifts", "/gifts/7", "/categories"]) {
      await page.goto(url);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/gifts");
  await page.screenshot({
    path: path.join(shots, "gifts-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "All Gifts" })
    .click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Gifts That Make Every Moment Special",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore Gifts", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("admin can create a gift category, add, edit and delete a gift", async ({
  page,
}) => {
  let categories = [];
  let products = [];
  let edited = false;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (url === "/api/auth/me")
      return route.fulfill({ json: { username: "owner" } });
    if (url === "/api/auth/csrf")
      return route.fulfill({
        json: { token: "test", headerName: "X-CSRF-TOKEN" },
      });
    if (url === "/api/settings/public")
      return route.fulfill({ json: { shopName: "Honeybee Frames & Gifts" } });
    if (url === "/api/admin/dashboard")
      return route.fulfill({
        json: {
          totalFrames: 3,
          totalCategories: 4,
          availableFrames: 3,
          unavailableFrames: 0,
          recentFrames: [],
          totalGifts: products.length,
          totalGiftCategories: categories.length,
          recentGifts: [],
        },
      });
    if (url === "/api/categories")
      return route.fulfill({ json: [frameCategory] });
    if (url === "/api/gift-categories")
      return route.fulfill({ json: categories });
    if (url === "/api/admin/gift-categories" && method === "POST") {
      categories = [giftCategory];
      return route.fulfill({ status: 201, json: giftCategory });
    }
    if (url === "/api/admin/gifts" && method === "POST") {
      products = [gift];
      return route.fulfill({ status: 201, json: gift });
    }
    if (url === "/api/admin/gifts/7" && method === "PUT") {
      edited = true;
      products = [{ ...gift, ...route.request().postDataJSON() }];
      return route.fulfill({ json: products[0] });
    }
    if (url === "/api/admin/gifts/7" && method === "DELETE") {
      products = [];
      return route.fulfill({ status: 204 });
    }
    if (url === "/api/gifts/7") return route.fulfill({ json: products[0] });
    if (url === "/api/gifts") return route.fulfill({ json: paged(products) });
    return route.fulfill({ json: {} });
  });
  await page.goto("/admin/dashboard");
  await expect(
    page
      .locator(".dashboard-add-actions")
      .getByRole("link", { name: "Add Frame", exact: true }),
  ).toHaveAttribute("href", "/admin/frames/add");
  await page
    .locator(".dashboard-add-actions")
    .getByRole("link", { name: "Add Gift", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/gifts\/add$/);
  await page.getByRole("link", { name: "Create Gift Category" }).click();
  await page.getByLabel("Category name *").fill("Birthday Gifts");
  await page
    .getByRole("button", { name: "Create gift category", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Birthday Gifts", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/gifts/add");
  await page.getByLabel("Gift name *").fill("Personalized Mug");
  await page.getByLabel("Gift category *").selectOption("20");
  await expect(page.getByRole("option", { name: "Wooden Frames" })).toHaveCount(
    0,
  );
  await page.getByLabel("Price in LKR *").fill("1500");
  await page.getByLabel("Upload gift images").setInputFiles({
    name: "mug.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aEXsAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.screenshot({
    path: path.join(shots, "add-gift-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Publish gift" }).click();
  await expect(page).toHaveURL(/\/admin\/gifts$/);
  await expect(
    page.getByText("Personalized Mug", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit Personalized Mug" }).click();
  await page.getByLabel("Price in LKR *").fill("1750");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(/Gift updated/)).toBeVisible();
  expect(edited).toBe(true);
  await page.goto("/admin/gifts");
  await page.getByRole("button", { name: "Delete Personalized Mug" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page.getByText("Your first gift belongs here.")).toBeVisible();
  expect(errors).toEqual([]);
});
