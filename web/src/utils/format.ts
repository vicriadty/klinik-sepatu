export function formatIDR(value: number): string {
  return `Rp${Math.round(value).toLocaleString("id-ID")}`;
}

export function formatNumberID(value: number): string {
  return value.toLocaleString("id-ID");
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export function formatDateID(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00`));
}

export function formatAxisIDR(value: number): string {
  const short = (v: number, suffix: string): string => {
    const rounded =
      v >= 10 ? Math.round(v).toString() : v.toFixed(1).replace(".", ",");
    return `${rounded} ${suffix}`;
  };
  if (value >= 1_000_000) {
    return short(value / 1_000_000, "jt");
  }
  if (value >= 1_000) {
    return short(value / 1_000, "rb");
  }
  return `${value}`;
}
