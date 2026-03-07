export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  items: CartItem[];
  total: number;
  tokenNumber: number;
  status: "paid" | "preparing" | "ready";
  createdAt: Date;
}

export const MENU_CATEGORIES = [
  "All",
  "Mains",
  "Sides",
  "Drinks",
  "Snacks",
] as const;

export const MENU_ITEMS: MenuItem[] = [
  { id: "1", name: "Grilled Chicken Plate", price: 120, category: "Mains" },
  { id: "2", name: "Mutton Biryani", price: 180, category: "Mains" },
  { id: "3", name: "Veg Thali", price: 90, category: "Mains" },
  { id: "4", name: "Paneer Butter Masala", price: 110, category: "Mains" },
  { id: "5", name: "Egg Fried Rice", price: 85, category: "Mains" },
  { id: "6", name: "French Fries", price: 50, category: "Sides" },
  { id: "7", name: "Coleslaw", price: 30, category: "Sides" },
  { id: "8", name: "Raita", price: 25, category: "Sides" },
  { id: "9", name: "Papad Basket", price: 20, category: "Sides" },
  { id: "10", name: "Masala Chai", price: 20, category: "Drinks" },
  { id: "11", name: "Cold Coffee", price: 60, category: "Drinks" },
  { id: "12", name: "Lime Soda", price: 35, category: "Drinks" },
  { id: "13", name: "Buttermilk", price: 25, category: "Drinks" },
  { id: "14", name: "Samosa (2pc)", price: 30, category: "Snacks" },
  { id: "15", name: "Vada Pav", price: 25, category: "Snacks" },
  { id: "16", name: "Spring Roll", price: 45, category: "Snacks" },
];
