import { vi, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FrameCard, FilterBar } from "../components/UI";
vi.mock("../context/ShopContext", () => ({
  useShop: () => ({
    settings: {
      shopName: "Honeybee Frame Shop",
      whatsappNumber: "94770000000",
    },
  }),
}));
const wrap = (component) => render(<MemoryRouter>{component}</MemoryRouter>);
it("public navigation contains only the public routes", () => {
  wrap(<Navbar />);
  expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
    "href",
    "/",
  );
  expect(screen.getByRole("link", { name: "All Frames" })).toHaveAttribute(
    "href",
    "/frames",
  );
  expect(screen.getByRole("link", { name: "All Gifts" })).toHaveAttribute(
    "href",
    "/gifts",
  );
  expect(
    screen.queryByRole("link", { name: /login|admin/i }),
  ).not.toBeInTheDocument();
});
it("mobile navigation opens and closes accessibly", async () => {
  const user = userEvent.setup();
  wrap(<Navbar />);
  await user.click(screen.getByRole("button", { name: "Open menu" }));
  expect(
    screen.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Close menu" }));
  expect(
    screen.queryByRole("navigation", { name: "Mobile navigation" }),
  ).not.toBeInTheDocument();
});
it("frame card shows backend fields and WhatsApp link", () => {
  wrap(
    <FrameCard
      frame={{
        id: 3,
        name: "Oak Frame",
        price: 2500,
        size: "8 x 12 inches",
        available: true,
        category: { name: "Wooden" },
        images: [{ imageUrl: "https://example.test/image.jpg" }],
      }}
    />,
  );
  expect(screen.getByText("LKR 2,500.00")).toBeVisible();
  expect(screen.getByText("8 x 12 inches")).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Order via WhatsApp" }),
  ).toHaveAttribute("target", "_blank");
  expect(screen.getByRole("link", { name: /View details/ })).toHaveAttribute(
    "href",
    "/frames/3",
  );
});
it("filter selects the actual database category id", async () => {
  const select = vi.fn();
  const sort = vi.fn();
  wrap(
    <FilterBar
      categories={[{ id: 11, name: "Wedding" }]}
      category=""
      setCategory={select}
      sort="newest"
      setSort={sort}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Wedding" }));
  expect(select).toHaveBeenCalledWith("11");
  await userEvent.selectOptions(
    screen.getByLabelText("Sort frames"),
    "price-desc",
  );
  expect(sort).toHaveBeenCalledWith("price-desc");
});
