import { useState, useCallback } from "react";
import { CartItem, MenuItem } from "@/lib/menu-data"; // Removed 'Order' from here

// 1. Define exactly what the receipt needs locally
export interface LocalOrder {
  id: string;
  customerName: string;
  items: CartItem[];
  total: number;
  tokenNumber: number;
  status: string; // This fixes the "pending" error!
  timestamp: string;
}

export function useCheckout() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [order, setOrder] = useState<LocalOrder | null>(null); // Use LocalOrder here

  // ADD ITEM: Strict numeric enforcement
  const addItem = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: Number(c.quantity) + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  // UPDATE QUANTITY: Absolute Math prevents jumping
  const updateQuantity = useCallback((id: string, newQuantity: number) => {
    setCart((prev) => {
      const targetQty = Number(newQuantity);
      if (isNaN(targetQty) || targetQty <= 0) {
        return prev.filter((c) => c.id !== id);
      }
      return prev.map((c) =>
        c.id === id ? { ...c, quantity: Math.floor(targetQty) } : c
      );
    });
  }, []);

  const totalItems = cart.reduce((sum, c) => sum + Number(c.quantity), 0);
  const totalPrice = cart.reduce((sum, c) => sum + (Number(c.price) * Number(c.quantity)), 0);

  // PLACE ORDER: Synchronized with Admin
  const placeOrder = useCallback((customerName: string, sharedOrderId: string) => {
    if (cart.length === 0) return;

    // Extract numbers for the receipt token
    const numericToken = Number(sharedOrderId.replace(/\D/g, '')) || Math.floor(Math.random() * 999) + 1;

    const newOrder: LocalOrder = {
      id: sharedOrderId,
      customerName: customerName || "Guest",
      items: [...cart],
      total: totalPrice,
      tokenNumber: numericToken,
      status: "pending", // No more error here!
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setOrder(newOrder);
    setStep(3);
  }, [cart, totalPrice]);

  const reset = useCallback(() => {
    setCart([]);
    setOrder(null);
    setStep(1);
  }, []);

  return {
    step,
    setStep,
    cart,
    addItem,
    updateQuantity,
    totalItems,
    totalPrice,
    order,
    placeOrder,
    reset,
  };
}