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
  key: string;
  type: "product" | "service";
  id: string;
  nameFa: string;
  nameTr?: string;
  nameEn: string;
  nameAr?: string;
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
const STORAGE_KEY = "hyperdoctor.cart.v2";
const LEGACY_STORAGE_KEY = "hyperdoctor.cart.v1";

function normalizeStoredLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((line) => line && typeof line === "object")
    .map((line) => line as Partial<CartLine>)
    .filter((line) => line.id && line.type && line.nameFa && line.nameEn)
    .map((line) => ({
      key: String(line.key || `${line.type}:${line.id}:${line.preferredDate ?? ""}`),
      type: line.type as "product" | "service",
      id: String(line.id),
      nameFa: String(line.nameFa),
      nameTr: line.nameTr ? String(line.nameTr) : undefined,
      nameEn: String(line.nameEn),
      nameAr: line.nameAr ? String(line.nameAr) : undefined,
      price: Number(line.price || 0),
      image: line.image ?? null,
      quantity: Math.max(1, Number(line.quantity || 1)),
      preferredDate: line.preferredDate ? String(line.preferredDate) : undefined,
    }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const parsed = normalizeStoredLines(JSON.parse(raw));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLines(parsed);
        if (!localStorage.getItem(STORAGE_KEY)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch {
      // Ignore corrupt local storage and start with an empty cart.
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
            l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l,
          );
        }
        return [...prev, { ...line, key }];
      });
    };

    const updateQuantity: CartContextValue["updateQuantity"] = (key, quantity) => {
      setLines((prev) =>
        quantity <= 0
          ? prev.filter((l) => l.key !== key)
          : prev.map((l) => (l.key === key ? { ...l, quantity } : l)),
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
