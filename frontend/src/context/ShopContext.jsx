import { createContext, useContext } from "react";
import { useResource } from "../utils/useResource";
const ShopContext = createContext(null);
export function ShopProvider({ children }) {
  const resource = useResource("/settings/public");
  const settings = resource.data || {
    shopName: "Honeybee Frames & Gifts",
    heroTitle: "Make memories feel at home.",
    heroSubtitle:
      "A thoughtful frame turns a favourite moment into something you live with. Find the perfect home for yours.",
  };
  return (
    <ShopContext.Provider value={{ settings, ...resource }}>
      {children}
    </ShopContext.Provider>
  );
}
export const useShop = () => useContext(ShopContext);
