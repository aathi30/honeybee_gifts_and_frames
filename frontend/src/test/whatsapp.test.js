import { describe, it, expect } from "vitest";
import { whatsappUrl, money } from "../utils/whatsapp";
describe("WhatsApp ordering", () => {
  it("uses gift details and the gift URL without a frame size", () => {
    const url = new URL(
      whatsappUrl(
        "94770000000",
        {
          id: 4,
          name: "Personalized Mug",
          price: 1500,
          category: { name: "Birthday Gifts" },
        },
        null,
        "http://localhost:5173",
        "Honeybee Frames & Gifts",
        "gift",
      ),
    );
    const text = url.searchParams.get("text");
    expect(text).toContain("Gift Name: Personalized Mug");
    expect(text).toContain("Category: Birthday Gifts");
    expect(text).toContain("LKR 1,500.00");
    expect(text).toContain("http://localhost:5173/gifts/4");
    expect(text).not.toContain("Size:");
    expect(text).not.toContain("/frames/");
  });
  it("uses the selected frame, size, LKR price and canonical product link", () => {
    const url = new URL(
      whatsappUrl(
        "94770000000",
        { id: 7, name: "Oak & Gold", size: "8 x 12 inches", price: 2500 },
        "10 x 12 inches",
        "https://shop.example",
      ),
    );
    expect(url.pathname).toBe("/94770000000");
    expect(url.searchParams.get("text")).toContain("Frame: Oak & Gold");
    expect(url.searchParams.get("text")).toContain("Size: 10 x 12 inches");
    expect(url.searchParams.get("text")).toContain("LKR 2,500.00");
    expect(url.searchParams.get("text")).toContain(
      "https://shop.example/frames/7",
    );
    expect(url.searchParams.get("text")).not.toContain("Size: 8 x 12 inches");
  });
  it("disables invalid or missing shop numbers", () => {
    expect(whatsappUrl("", null)).toBeNull();
    expect(whatsappUrl("+94770000000", null)).toBeNull();
  });
  it("formats two decimal places in LKR", () =>
    expect(money(999.5)).toBe("LKR 999.50"));
});
