import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

test("admin management works on desktop and mobile", async ({ page }) => {
  let admins = [
    {
      id: 1,
      username: "owner",
      email: "owner@example.test",
      role: "ADMIN",
      createdAt: "2026-09-01T00:00:00Z",
    },
    {
      id: 2,
      username: "colleague",
      email: "colleague@example.test",
      role: "ADMIN",
      createdAt: "2026-10-02T00:00:00Z",
    },
  ];
  const passwords = [];
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
      return route.fulfill({ json: { shopName: "Honeybee Frame Shop" } });
    if (url === "/api/admin/admins" && method === "GET")
      return route.fulfill({ json: admins });
    if (url === "/api/admin/admins" && method === "POST") {
      const body = route.request().postDataJSON();
      const admin = {
        id: 3,
        username: body.username,
        email: body.email,
        role: "ADMIN",
      };
      admins = [...admins, admin];
      return route.fulfill({ status: 201, json: admin });
    }
    if (method === "PUT") {
      const body = route.request().postDataJSON();
      passwords.push(body.password);
      const id = Number(url.split("/").pop());
      admins = admins.map((admin) =>
        admin.id === id
          ? { ...admin, username: body.username, email: body.email }
          : admin,
      );
      return route.fulfill({ json: admins.find((admin) => admin.id === id) });
    }
    if (method === "DELETE") {
      admins = admins.filter(
        (admin) => admin.id !== Number(url.split("/").pop()),
      );
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: {} });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin/admins");
  await expect(
    page.getByRole("heading", { name: "Admin Management", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Admin Management" }),
  ).toHaveClass(/active/);
  await expect(
    page.getByRole("button", { name: "Delete admin owner" }),
  ).toBeDisabled();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Add Admin", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Username *").fill("new-admin");
  await page.getByLabel("Email *").fill("new@example.test");
  await page
    .getByLabel("Password *", { exact: true })
    .fill("browser-test-password");
  await page.getByLabel("Confirm password *").fill("browser-test-password");
  await page.getByRole("button", { name: "Create admin", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "new-admin", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit admin new-admin" }).click();
  await page
    .getByLabel("New password", { exact: true })
    .fill("updated-browser-password");
  await page
    .getByLabel("Confirm new password")
    .fill("updated-browser-password");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByText(/Admin new-admin updated successfully/),
  ).toBeVisible();
  expect(passwords).toEqual(["updated-browser-password"]);
  await page
    .getByRole("searchbox", { name: "Search admins" })
    .fill("colleague");
  await expect(
    page.getByRole("heading", { name: "new-admin", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "colleague", exact: true }),
  ).toBeVisible();
  await page.getByRole("searchbox", { name: "Search admins" }).fill("");
  const shots = path.resolve("../docs/screenshots");
  await fs.mkdir(shots, { recursive: true });
  await page.screenshot({
    path: path.join(shots, "admin-management-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Add Admin", exact: true }).click();
  await page.screenshot({
    path: path.join(shots, "admin-management-form-desktop.png"),
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole("button", { name: "Toggle admin menu" }).click();
  await page.getByRole("link", { name: "Admin Management" }).click();
  await expect(page.locator(".admin-sidebar")).toHaveCSS(
    "visibility",
    "hidden",
  );
  await page.screenshot({
    path: path.join(shots, "admin-management-mobile.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Add Admin", exact: true }).click();
  await expect(page.getByLabel("Username *")).toBeFocused();
  await page.screenshot({
    path: path.join(shots, "admin-management-form-mobile.png"),
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Delete admin new-admin" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "new-admin", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete admin new-admin" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "new-admin", exact: true }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
