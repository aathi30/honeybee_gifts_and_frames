import { vi, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminManagement from "../admin/AdminManagement";

const mocks = vi.hoisted(() => ({
  api: { post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  reload: vi.fn(),
  admins: [
    { id: 1, username: "owner", email: "owner@example.test" },
    { id: 2, username: "colleague", email: "colleague@example.test" },
  ],
}));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { username: "owner" } }),
}));
vi.mock("../utils/useResource", () => ({
  useResource: () => ({
    data: mocks.admins,
    loading: false,
    error: "",
    reload: mocks.reload,
  }),
}));
vi.mock("../services/api", async () => ({
  ...(await vi.importActual("../services/api")),
  api: mocks.api,
}));
beforeEach(() => {
  vi.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
  mocks.api.post.mockResolvedValue({ data: {} });
  mocks.api.put.mockResolvedValue({ data: {} });
  mocks.api.delete.mockResolvedValue({});
});

it("adds an admin only after matching passwords and clears the password fields", async () => {
  const user = userEvent.setup();
  render(<AdminManagement />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Add Admin", exact: true }),
  );
  await user.type(screen.getByLabelText("Username *"), "new-admin");
  await user.type(screen.getByLabelText("Email *"), "new@example.test");
  await user.type(screen.getByLabelText("Password *"), "new-test-password");
  await user.type(
    screen.getByLabelText("Confirm password *"),
    "different-password",
  );
  await user.click(screen.getByRole("button", { name: "Create admin" }));
  expect(screen.getByText("Passwords do not match.")).toBeVisible();
  expect(mocks.api.post).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText("Confirm password *"));
  await user.type(
    screen.getByLabelText("Confirm password *"),
    "new-test-password",
  );
  await user.click(screen.getByRole("button", { name: "Create admin" }));
  await waitFor(() =>
    expect(mocks.api.post).toHaveBeenCalledWith("/admin/admins", {
      username: "new-admin",
      email: "new@example.test",
      password: "new-test-password",
    }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(mocks.reload).toHaveBeenCalled();
});

it("changes the selected admin password and shows server errors", async () => {
  const user = userEvent.setup();
  mocks.api.put.mockRejectedValueOnce({
    response: { data: { message: "Password update failed" } },
  });
  render(<AdminManagement />);
  await user.click(
    screen.getByRole("button", { name: "Edit admin colleague" }),
  );
  await user.type(
    screen.getByLabelText("New password"),
    "replacement-password",
  );
  await user.type(
    screen.getByLabelText("Confirm new password"),
    "replacement-password",
  );
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByText("Password update failed")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(mocks.api.put).toHaveBeenCalledWith("/admin/admins/2", {
      username: "colleague",
      email: "colleague@example.test",
      password: "replacement-password",
    }),
  );
  expect(
    await screen.findByText(/Admin colleague updated successfully/),
  ).toBeVisible();
});

it("searches accounts and edits details without changing the password", async () => {
  const user = userEvent.setup();
  render(<AdminManagement />);
  await user.type(
    screen.getByRole("searchbox", { name: "Search admins" }),
    "colleague",
  );
  expect(
    screen.queryByRole("heading", { name: /owner/ }),
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Edit admin colleague" }),
  );
  await user.clear(screen.getByLabelText("Email *"));
  await user.type(screen.getByLabelText("Email *"), "updated@example.test");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(mocks.api.put).toHaveBeenCalledWith("/admin/admins/2", {
      username: "colleague",
      email: "updated@example.test",
    }),
  );
});

it("protects the signed-in admin and requires confirmation before deleting another admin", async () => {
  const user = userEvent.setup();
  render(<AdminManagement />);
  expect(
    screen.getByRole("button", { name: "Delete admin owner" }),
  ).toBeDisabled();
  await user.click(
    screen.getByRole("button", { name: "Delete admin colleague" }),
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(mocks.api.delete).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(mocks.api.delete).not.toHaveBeenCalled();
  await user.click(
    screen.getByRole("button", { name: "Delete admin colleague" }),
  );
  await user.click(screen.getByRole("button", { name: "Delete", exact: true }));
  await waitFor(() =>
    expect(mocks.api.delete).toHaveBeenCalledWith("/admin/admins/2"),
  );
  expect(await screen.findByText("Admin colleague deleted.")).toBeVisible();
});
