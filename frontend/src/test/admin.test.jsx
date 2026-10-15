import { vi, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../admin/ProtectedRoute";
import Login from "../admin/Login";
import FrameForm from "../admin/FrameForm";
import GiftForm from "../admin/GiftForm";
const mocks = vi.hoisted(() => ({
  auth: {
    user: null,
    loading: false,
    error: false,
    refresh: vi.fn(),
    login: vi.fn(),
  },
  api: { post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  editing: false,
  categories: [{ id: 1, name: "Wooden" }],
  frame: {
    id: 7,
    name: "Oak",
    description: "Natural finish",
    category: { id: 1 },
    price: 2500,
    size: "8 x 12 inches",
    available: true,
    featured: false,
    images: [{ id: 1, imageUrl: "https://example.test/oak.png" }],
  },
}));
vi.mock("../context/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("../context/ShopContext", () => ({
  useShop: () => ({ settings: { shopName: "Honeybee Frame Shop" } }),
}));
vi.mock("../services/api", async () => {
  const actual = await vi.importActual("../services/api");
  return { ...actual, api: mocks.api };
});
vi.mock("../utils/useResource", () => ({
  useResource: (url) => ({
    loading: false,
    error: "",
    reload: vi.fn(),
    data: ["/categories", "/gift-categories"].includes(url)
      ? mocks.categories
      : url?.startsWith("/frames/")
        ? mocks.frame
        : null,
  }),
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.user = null;
  mocks.api.post.mockResolvedValue({ data: {} });
  mocks.api.put.mockResolvedValue({ data: {} });
});
it("creates gifts without frame sizes using the gift API and category dropdown", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/admin/gifts/add"]}>
      <Routes>
        <Route path="/admin/gifts/add" element={<GiftForm />} />
        <Route path="/admin/gifts" element={<p>Gift list</p>} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.queryByLabelText("Size *")).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Create Gift Category" }),
  ).toHaveAttribute("href", "/admin/gift-categories");
  await user.type(screen.getByLabelText("Gift name *"), "Personalized Mug");
  await user.selectOptions(screen.getByLabelText("Gift category *"), "1");
  await user.type(screen.getByLabelText("Price in LKR *"), "1500");
  await user.upload(
    screen.getByLabelText("Upload gift images"),
    new File(["image"], "mug.png", { type: "image/png" }),
  );
  await user.click(screen.getByRole("button", { name: "Publish gift" }));
  await waitFor(() => expect(mocks.api.post).toHaveBeenCalled());
  const body = mocks.api.post.mock.calls[0][1];
  expect(mocks.api.post.mock.calls[0][0]).toBe("/admin/gifts");
  expect(body.get("gift")).toBeTruthy();
  expect(body.get("frame")).toBeNull();
  expect(await screen.findByText("Gift list")).toBeVisible();
});
it("redirects unauthenticated visitors to /login", async () => {
  render(
    <MemoryRouter initialEntries={["/admin/dashboard"]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<p>Private content</p>} />
        </Route>
        <Route path="/login" element={<p>Sign in page</p>} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText("Sign in page")).toBeVisible();
  expect(screen.queryByText("Private content")).not.toBeInTheDocument();
});
it("submits login and redirects to the requested admin route", async () => {
  const user = userEvent.setup();
  mocks.auth.login.mockResolvedValue({});
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<p>Admin overview</p>} />
      </Routes>
    </MemoryRouter>,
  );
  await user.type(screen.getByLabelText("Username or email"), "administrator");
  await user.type(screen.getByLabelText("Password"), "test-only-password");
  await user.click(screen.getByRole("button", { name: "Sign in securely" }));
  expect(mocks.auth.login).toHaveBeenCalledWith({
    username: "administrator",
    password: "test-only-password",
  });
  expect(await screen.findByText("Admin overview")).toBeVisible();
});
it("creates a frame with validated metadata and an image", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/admin/frames/add"]}>
      <Routes>
        <Route path="/admin/frames/add" element={<FrameForm />} />
        <Route path="/admin/frames" element={<p>Frame list</p>} />
      </Routes>
    </MemoryRouter>,
  );
  await user.type(screen.getByLabelText("Frame name *"), "Oak");
  await user.selectOptions(screen.getByLabelText("Category *"), "1");
  await user.type(screen.getByLabelText("Price in LKR *"), "2500");
  await user.type(screen.getByLabelText("Size *"), "8 x 12 inches");
  await user.upload(
    screen.getByLabelText("Upload frame images"),
    new File(["image"], "oak.png", { type: "image/png" }),
  );
  await user.click(screen.getByRole("button", { name: "Publish frame" }));
  await waitFor(() => expect(mocks.api.post).toHaveBeenCalled());
  expect(mocks.api.post.mock.calls[0][0]).toBe("/admin/frames");
  expect(mocks.api.post.mock.calls[0][1].get("images").name).toBe("oak.png");
  expect(await screen.findByText("Frame list")).toBeVisible();
});
it("edits a persisted frame without requiring a replacement image", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/admin/frames/edit/7"]}>
      <Routes>
        <Route path="/admin/frames/edit/:id" element={<FrameForm />} />
      </Routes>
    </MemoryRouter>,
  );
  const price = screen.getByLabelText("Price in LKR *");
  await user.clear(price);
  await user.type(price, "3000");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(mocks.api.put).toHaveBeenCalledWith(
      "/admin/frames/7",
      expect.objectContaining({ price: "3000", categoryId: 1 }),
    ),
  );
  expect(await screen.findByText(/Frame updated/)).toBeVisible();
});
