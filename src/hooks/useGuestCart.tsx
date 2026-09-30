import { useState, useEffect, useCallback } from "react";

export interface GuestCartItem {
  product_id: string;
  size_id: string | null;
  color_id: string | null;
  quantity: number;
}

const STORAGE_KEY = "guest-cart";
const EVENT_NAME = "guest-cart-change";

function readCart(): GuestCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: GuestCartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useGuestCart() {
  const [items, setItems] = useState<GuestCartItem[]>(() => readCart());

  /*
   * Persist cart.
   *
   * IMPORTANT:
   * We do NOT dispatch the event here.
   * Otherwise this effect would trigger its own listener forever.
   */
  useEffect(() => {
    writeCart(items);
  }, [items]);

  /*
   * Listen for cart changes made by another component.
   */
  useEffect(() => {
    const handler = () => {
      const next = readCart();

      setItems((current) => {
        const currentSerialized = JSON.stringify(current);
        const nextSerialized = JSON.stringify(next);

        if (currentSerialized === nextSerialized) {
          return current;
        }

        return next;
      });
    };

    window.addEventListener(EVENT_NAME, handler);

    return () => {
      window.removeEventListener(EVENT_NAME, handler);
    };
  }, []);

  /*
   * Add item
   */
  const addItem = useCallback(
    (
      product_id: string,
      size_id: string | null,
      quantity: number = 1,
      color_id: string | null = null
    ) => {
      setItems((prev) => {
        const existing = prev.find(
          (item) =>
            item.product_id === product_id &&
            item.size_id === size_id &&
            item.color_id === color_id
        );

        if (existing) {
          return prev.map((item) =>
            item.product_id === product_id &&
            item.size_id === size_id &&
            item.color_id === color_id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                }
              : item
          );
        }

        return [
          ...prev,
          {
            product_id,
            size_id,
            color_id,
            quantity,
          },
        ];
      });
    },
    []
  );

  /*
   * Remove item
   */
  const removeItem = useCallback(
    (
      product_id: string,
      size_id: string | null,
      color_id: string | null = null
    ) => {
      setItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item.product_id === product_id &&
              item.size_id === size_id &&
              item.color_id === color_id
            )
        )
      );
    },
    []
  );

  /*
   * Update quantity
   */
  const updateQuantity = useCallback(
    (
      product_id: string,
      size_id: string | null,
      quantity: number,
      color_id: string | null = null
    ) => {
      if (quantity < 1) return;

      setItems((prev) =>
        prev.map((item) =>
          item.product_id === product_id &&
          item.size_id === size_id &&
          item.color_id === color_id
            ? {
                ...item,
                quantity,
              }
            : item
        )
      );
    },
    []
  );

  /*
   * Clear cart
   */
  const clearCart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  const count = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    count,
  };
}

export function getGuestCartItems(): GuestCartItem[] {
  return readCart();
}

export function clearGuestCart() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}