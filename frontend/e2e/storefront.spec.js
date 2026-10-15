import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
const shots = path.resolve("../docs/screenshots");
test("desktop home uses the live backend and loads its decorative photographs", async ({
  page,
  request,
}) => {
  const settings = await (await request.get("/api/settings/public")).json();
  const categories = await (await request.get("/api/categories")).json();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name:
        settings.heroTitle === "Make memories feel at home."
          ? /Beautiful Frames\./
          : settings.heroTitle,
      exact: true,
    }),
  ).toBeVisible();
  if (categories.length) {
    await expect(
      page
        .getByRole("heading", { name: categories[0].name, exact: true })
        .first(),
    ).toBeVisible();
  } else {
    await expect(
      page.getByRole("heading", { name: "A collection worth waiting for." }),
    ).toBeVisible();
  }
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "All Frames" }),
  ).toBeVisible();
  expect(await page.locator('a[href="/login"]').count()).toBe(0);
  await expect(page.locator(".hero img").first()).toBeVisible();
  await expect
    .poll(
      async () =>
        await page
          .locator(".hero img")
          .evaluateAll((images) =>
            images.every((i) => i.complete && i.naturalWidth > 0),
          ),
    )
    .toBe(true);
  await fs.mkdir(shots, { recursive: true });
  await page.screenshot({
    path: path.join(shots, "home-desktop.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("mobile navigation works and layouts do not overflow", async ({
  page,
  request,
}) => {
  const settings = await (await request.get("/api/settings/public")).json();
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name:
          settings.heroTitle === "Make memories feel at home."
            ? /Beautiful Frames\./
            : settings.heroTitle,
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "All Frames" })
    .click();
  await expect(page).toHaveURL(/\/frames$/);
  await expect(
    page.getByRole("heading", { name: "A Frame for Every Memory" }),
  ).toBeVisible();
  await page.goto("/");
  await page.screenshot({
    path: path.join(shots, "home-mobile.png"),
    fullPage: true,
  });
});
test("private admin pages redirect and no contact details are fabricated", async ({
  page,
  request,
}) => {
  await page.goto("/admin/frames");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: "Sign in securely" }),
  ).toBeVisible();
  const unauthorized = await request.get("/api/admin/dashboard");
  expect(unauthorized.status()).toBe(401);
  const csrf = await request.post("/api/auth/login", {
    data: { username: "unknown", password: "invalid" },
  });
  expect(csrf.status()).toBe(403);
  await page.route("**/api/settings/public", (route) =>
    route.fulfill({
      json: {
        shopName: "Honeybee Frames & Gifts",
        whatsappNumber: "",
        address: "",
      },
    }),
  );
  await page.goto("/contact");
  await expect(page.getByText("Our address will be shared soon")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Start a conversation/ }),
  ).toBeDisabled();
});
test("filter changes are sent to the catalog API", async ({ page }) => {
  await page.route("**/api/categories", (route) =>
    route.fulfill({
      json: [
        { id: 1, name: "Wooden Frames", slug: "wooden", description: "" },
        { id: 2, name: "Wedding Frames", slug: "wedding", description: "" },
      ],
    }),
  );
  await page.route("**/api/frames?*", (route) =>
    route.fulfill({
      json: { content: [], page: 0, size: 12, totalPages: 0, totalElements: 0 },
    }),
  );
  await page.goto("/frames");
  await page.getByRole("button", { name: "Wedding Frames" }).click();
  const sorted = page.waitForRequest(
    (r) =>
      r.url().includes("/api/frames?") &&
      r.url().includes("categoryId=2") &&
      r.url().includes("sort=price-asc"),
  );
  await page.getByLabel("Sort frames").selectOption("price-asc");
  await sorted;
  const searched = page.waitForRequest((r) => r.url().includes("keyword=oak"));
  await page.getByLabel("Search frames").fill("oak");
  await searched;
  await expect(
    page.getByRole("heading", { name: "No frames found." }),
  ).toBeVisible();
});
test("gallery and WhatsApp use the selected backend frame", async ({
  page,
}) => {
  const frame = {
    id: 77,
    name: "Oak Frame (test fixture)",
    description: "Test-only API response",
    price: 2500,
    size: "8 x 12 inches, 10 x 12 inches",
    available: true,
    featured: false,
    category: { id: 1, name: "Wooden Frames" },
    images: [
      { id: 1, imageUrl: "/images/hero-landscape.jpg" },
      { id: 2, imageUrl: "/images/hero-botanical.jpg" },
    ],
  };
  await page.route("**/api/settings/public", (route) =>
    route.fulfill({
      json: { shopName: "Honeybee Frame Shop", whatsappNumber: "94770000000" },
    }),
  );
  await page.route("**/api/frames/77", (route) =>
    route.fulfill({ json: frame }),
  );
  await page.route("**/api/frames?*", (route) =>
    route.fulfill({
      json: {
        content: [frame],
        page: 0,
        size: 5,
        totalPages: 1,
        totalElements: 1,
      },
    }),
  );
  await page.goto("/frames/77");
  await expect(page.getByRole("heading", { name: frame.name })).toBeVisible();
  await page.getByRole("button", { name: "View image 2" }).click();
  await expect(page.locator(".gallery-main>img")).toHaveAttribute(
    "src",
    "/images/hero-botanical.jpg",
  );
  await page.getByRole("button", { name: "10 x 12 inches" }).click();
  const link = page.getByRole("link", { name: "Order via WhatsApp" });
  const url = new URL(await link.getAttribute("href"));
  expect(url.searchParams.get("text")).toContain("Size: 10 x 12 inches");
  expect(url.searchParams.get("text")).toContain("LKR 2,500.00");
  expect(url.searchParams.get("text")).toContain("/frames/77");
  await expect(link).toHaveAttribute("target", "_blank");
});
test("admin can sign in with the securely initialized account and sign out", async ({
  page,
}) => {
  test.skip(
    !process.env.HONEYBEE_QA_PASSWORD ||
      process.env.HONEYBEE_QA_ALLOW_CATALOG_WRITES !== "true",
    "Set QA credentials only for an isolated test database.",
  );
  await page.goto("/login");
  await page
    .getByLabel("Username or email")
    .fill(process.env.HONEYBEE_QA_USERNAME);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.HONEYBEE_QA_PASSWORD);
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Recently added frames" }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(shots, "admin-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".admin-sidebar")).toHaveCSS(
    "visibility",
    "hidden",
  );
  await page.screenshot({
    path: path.join(shots, "admin-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle admin menu" }).click();
  await page
    .getByRole("navigation", { name: "Admin navigation" })
    .getByRole("link", { name: "Frame Categories", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Create a category" }),
  ).toBeVisible();
  await page.getByLabel("Category name *").fill("QA category");
  await page
    .getByRole("button", { name: "Create category", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "QA category", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit QA category", exact: true })
    .click();
  await page.getByLabel("Category name *").fill("QA renamed category");
  await page
    .getByRole("button", { name: "Save category", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "QA renamed category", exact: true }),
  ).toBeVisible();
  const publicPage = await page.context().newPage();
  await publicPage.goto("/categories");
  await expect(
    publicPage.getByRole("heading", {
      name: "QA renamed category",
      exact: true,
    }),
  ).toBeVisible();
  await publicPage.close();
  await page
    .getByRole("button", { name: "Delete QA renamed category", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "QA renamed category", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
