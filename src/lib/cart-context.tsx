"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartLine = {
  key: string; // `${type}:${id}:${preferredDate ?? ""}`
  type: "product" | "service";
  id: string;
  nameFa: string;
  nameEn: string;
  price: number;
  image?: string | null;
  quantity: number;
  preferredDate?: string;
};

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  add: (line: Omit<CartLine, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "hyperdoctor.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Reading localStorage must happen post-hydration (not in a lazy useState
    // initializer) or the client's first render would diverge from the
    // server-rendered empty-cart markup and trigger a hydration mismatch.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt local storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const add: CartContextValue["add"] = (line) => {
      const key = `${line.type}:${line.id}:${line.preferredDate ?? ""}`;
      setLines((prev) => {
        const existing = prev.find((l) => l.key === key);
        if (existing) {
          return prev.map((l) =>
            l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l
          );
        }
        return [...prev, { ...line, key }];
      });
    };
    const updateQuantity: CartContextValue["updateQuantity"] = (key, quantity) => {
      setLines((prev) =>
        quantity <= 0
          ? prev.filter((l) => l.key !== key)
          : prev.map((l) => (l.key === key ? { ...l, quantity } : l))
      );
    };
    const remove: CartContextValue["remove"] = (key) => {
      setLines((prev) => prev.filter((l) => l.key !== key));
    };
    const clear = () => setLines([]);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);

    return { lines, hydrated, add, updateQuantity, remove, clear, subtotal, count };
  }, [lines, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
