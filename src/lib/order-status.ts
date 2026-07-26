export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت شده",
  FAILED: "ناموفق",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال شده",
  COMPLETED: "تکمیل شده",
  CANCELLED: "لغو شده",
};

export const ORDER_STATUS_BADGE: Record<string, "success" | "accent" | "muted" | "primary"> = {
  PENDING_PAYMENT: "muted",
  PAID: "success",
  FAILED: "accent",
  PROCESSING: "primary",
  SHIPPED: "primary",
  COMPLETED: "success",
  CANCELLED: "accent",
};
