export const formatCurrency = (value) => {
  const amount = Number(value ?? 0);
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatSignedCurrency = (value) => {
  const amount = Number(value ?? 0);
  const prefix = amount >= 0 ? "+" : "-";
  return `${prefix}${formatCurrency(Math.abs(amount))}`;
};

export const formatCents = (value) => {
  const cents = Math.round(Number(value ?? 0));
  return `${cents}¢`;
};

export const formatEndsAt = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export const chartTickFormatter = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export const parseSide = (value) => {
  if (typeof value === "string") return value.toUpperCase() === "YES";
  if (typeof value === "number") return value > 0;
  return Boolean(value);
};
