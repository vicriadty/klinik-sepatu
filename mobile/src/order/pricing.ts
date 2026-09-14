export interface PricedService {
  id: number;
  price: number;
}

export interface PricedItem {
  serviceIds: number[];
}

export interface PricedDiscount {
  type: "PERCENT" | "FIXED";
  value: number;
  min_order_subtotal: number | null;
}

export function itemSubtotal(
  item: PricedItem,
  services: PricedService[]
): number {
  const prices = new Map(services.map((service) => [service.id, service.price]));
  return item.serviceIds.reduce(
    (sum, serviceId) => sum + (prices.get(serviceId) ?? 0),
    0
  );
}

export function orderSubtotal(
  items: PricedItem[],
  services: PricedService[]
): number {
  return items.reduce((sum, item) => sum + itemSubtotal(item, services), 0);
}

/**
 * Mirrors OrderService::discountValue: integer rupiah, percent rounded down,
 * fixed capped at the subtotal (ADR-0004).
 */
export function discountValueFor(
  discount: PricedDiscount | null,
  subtotal: number
): number {
  if (!discount) {
    return 0;
  }

  if (discount.type === "PERCENT") {
    return Math.floor((subtotal * discount.value) / 100);
  }

  return Math.min(discount.value, subtotal);
}

export function discountMeetsMinimum(
  discount: PricedDiscount,
  subtotal: number
): boolean {
  return (
    discount.min_order_subtotal === null ||
    subtotal >= discount.min_order_subtotal
  );
}

export function grandTotalFor(
  subtotal: number,
  discount: PricedDiscount | null
): number {
  return subtotal - discountValueFor(discount, subtotal);
}
