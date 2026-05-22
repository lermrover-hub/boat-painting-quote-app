export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);

export const toNumber = (value: string | number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
