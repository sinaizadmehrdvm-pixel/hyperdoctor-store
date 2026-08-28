export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAYMENT_REVIEW: "پرداخت تأیید؛ نیازمند بررسی",
  PAID: "پرداخت شده",
  FAILED: "ناموفق",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال شده",
  COMPLETED: "تکمیل شده",
  CANCELLED: "لغو شده",
  REFUNDED: "بازپرداخت شده",
};

export const ORDER_STATUS_BADGE: Record<string, "success" | "accent" | "muted" | "primary"> = {
  PENDING_PAYMENT: "muted",
  PAYMENT_REVIEW: "accent",
  PAID: "success",
  FAILED: "accent",
  PROCESSING: "primary",
  SHIPPED: "primary",
  COMPLETED: "success",
  CANCELLED: "accent",
  REFUNDED: "muted",
};
