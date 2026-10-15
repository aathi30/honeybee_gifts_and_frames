import { test, expect } from "@playwright/test";
import path from "node:path";

const shots = path.resolve("../docs/screenshots/redesign");
const widths = [320, 390, 768, 1024, 1440];

async function checkLayout(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const logo = page.locator(".site-header .brand-image");
  if (await logo.count()) {
    expect(
      await logo.evaluate((img) => img.complete && img.naturalWidth > 0),
    ).toBe(true);
    expect(
      await page.locator(".site-header .brand-logo").evaluate((brand) => {
        const box = brand.getBoundingClientRect();
        const nav = brand.closest(".nav-inner").getBoundingClientRect();
        return box.top >= nav.top && box.bottom <= nav.bottom;
      }),
    ).toBe(true);
  }
}

test("branded public pages and live product details fit all viewport sizes", async ({
  page,
  request,
}) => {
  test.setTimeout(120000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const frames = await (await request.get("/api/frames?size=1")).json();
  const gifts = await (await request.get("/api/gifts?size=1")).json();
  const routes = [
    "/",
    "/frames",
    "/gifts",
    "/categories",
    "/contact",
    "/login",
  ];
  if (frames.content?.length) routes.push(`/frames/${frames.content[0].id}`);
  if (gifts.content?.length) routes.push(`/gifts/${gifts.content[0].id}`);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator(".skeleton-grid")).toHaveCount(0);
      await checkLayout(page);
    }
  }
  for (const [width, suffix] of [
    [1440, "desktop"],
    [390, "mobile"],
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [route, name] of [
      ["/", "home"],
      ["/frames", "frames"],
      ["/gifts", "gifts"],
      ["/categories", "categories"],
      ["/contact", "contact"],
      ["/login", "login"],
    ]) {
      await page.goto(route);
      await expect(page.locator(".skeleton-grid")).toHaveCount(0);
      await page.evaluate(async () => {
        await Promise.all(
          [...document.images].map(async (image) => {
            image.loading = "eager";
            try {
              await image.decode();
            } catch {
              /* Preserve failed asset reporting separately from layout checks. */
            }
          }),
        );
      });
      await page.screenshot({
        path: path.join(shots, `${name}-${suffix}.png`),
        fullPage: true,
        animations: "disabled",
      });
      if (name === "home")
        await page.screenshot({
          path: path.join(shots, `home-${suffix}-preview.png`),
          animations: "disabled",
        });
    }
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Site menu" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "All Gifts" })
    .click();
  await expect(page).toHaveURL(/\/gifts$/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => scrollTo(0, 450));
  await expect(page.locator(".site-header")).toHaveClass(/is-scrolled/);
  expect(
    await page
      .locator(".site-header")
      .evaluate((header) => Math.abs(header.getBoundingClientRect().top) < 1),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("live admin authentication and redesigned management pages remain usable", async ({
  page,
}) => {
  test.skip(
    !process.env.HONEYBEE_E2E_LOGIN || !process.env.HONEYBEE_E2E_PASSWORD,
    "Provide local admin credentials to verify live authentication.",
  );
  test.setTimeout(120000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");
  await page
    .getByLabel("Username or email")
    .fill(process.env.HONEYBEE_E2E_LOGIN);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.HONEYBEE_E2E_PASSWORD);
  const login = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in securely" }).click();
  expect((await login).status()).toBe(200);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "dashboard",
      "frames",
      "gifts",
      "categories",
      "gift-categories",
      "frames/add",
      "gifts/add",
      "settings",
      "admins",
    ]) {
      await page.goto(`/admin/${route}`);
      await expect(page.locator("h1").first()).toBeVisible();
      await checkLayout(page);
      if (
        [1440, 390].includes(width) &&
        ["dashboard", "frames/add", "gifts/add", "admins"].includes(route)
      ) {
        await page.evaluate(async () => {
          await Promise.all(
            [...document.images].map(async (image) => {
              image.loading = "eager";
              try {
                await image.decode();
              } catch {
                /* Rendering remains usable when a remote asset fails. */
              }
            }),
          );
        });
        await page.screenshot({
          path: path.join(
            shots,
            `admin-${route.replace("/", "-")}-${width}.png`,
          ),
          fullPage: true,
          animations: "disabled",
        });
      }
    }
  }
  await page.getByRole("button", { name: "Toggle admin menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Admin navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Toggle admin menu" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(errors).toEqual([]);
});
