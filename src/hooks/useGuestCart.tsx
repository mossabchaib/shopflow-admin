import { useState, useEffect, useCallback } from "react";

export interface GuestCartItem {
  product_id: string;
  size_id: string | null;
  color_id: string | null;
  quantity: number;
}

const STORAGE_KEY = "guest-cart";

function readCart(): GuestCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items: GuestCartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useGuestCart() {
  const [items, setItems] = useState<GuestCartItem[]>(readCart);

  useEffect(() => {
    writeCart(items);
    window.dispatchEvent(new Event("guest-cart-change"));
  }, [items]);

  useEffect(() => {
    const handler = () => setItems(readCart());
    window.addEventListener("guest-cart-change", handler);
    return () => window.removeEventListener("guest-cart-change", handler);
  }, []);

  const addItem = useCallback((product_id: string, size_id: string | null, quantity: number = 1, color_id: string | null = null) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product_id && i.size_id === size_id && i.color_id === color_id);
      if (existing) {
        return prev.map(i =>
          i.product_id === product_id && i.size_id === size_id && i.color_id === color_id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product_id, size_id, color_id, quantity }];
    });
  }, []);

  const removeItem = useCallback((product_id: string, size_id: string | null, color_id: string | null = null) => {
    setItems(prev => prev.filter(i => !(i.product_id === product_id && i.size_id === size_id && i.color_id === color_id)));
  }, []);

  const updateQuantity = useCallback((product_id: string, size_id: string | null, quantity: number, color_id: string | null = null) => {
    if (quantity < 1) return;
    setItems(prev =>
      prev.map(i =>
        i.product_id === product_id && i.size_id === size_id && i.color_id === color_id ? { ...i, quantity } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, addItem, removeItem, updateQuantity, clearCart, count };
}

export function getGuestCartItems(): GuestCartItem[] {
  return readCart();
}

export function clearGuestCart() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("guest-cart-change"));
}
