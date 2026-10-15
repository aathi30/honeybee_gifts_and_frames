export const money = (value) =>
  "LKR " +
  Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export function whatsappUrl(
  number,
  frame,
  selectedSize,
  origin = window.location.origin,
  shopName = "Honeybee Frames & Gifts",
  kind = "frame",
) {
  if (!/^[1-9][0-9]{6,14}$/.test(number || "")) return null;
  const message =
    frame && kind === "gift"
      ? `Hello ${shopName},\n\nI want to order this gift.\n\nGift Name: ${frame.name}\nCategory: ${frame.category.name}\nPrice: ${money(frame.price)}\nProduct Link: ${origin}/gifts/${frame.id}\n\nPlease provide more details.`
      : frame
        ? "Hello " +
          shopName +
          "! I am interested in ordering the " +
          frame.name +
          ".\n\nFrame: " +
          frame.name +
          "\nSize: " +
          (selectedSize || frame.size) +
          "\nPrice: " +
          money(frame.price) +
          "\nProduct Link: " +
          origin +
          "/frames/" +
          frame.id +
          "\n\nPlease share the ordering details."
        : "Hello " +
          shopName +
          "! I would like to enquire about your frames and gifts. Please share the details.";
  return "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
}
