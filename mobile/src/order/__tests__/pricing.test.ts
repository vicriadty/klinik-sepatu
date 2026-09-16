import {
  discountMeetsMinimum,
  discountValueFor,
  grandTotalFor,
  itemSubtotal,
  orderSubtotal,
  type PricedDiscount,
} from "../pricing";

const services = [
  { id: 1, price: 25000 },
  { id: 2, price: 35000 },
  { id: 3, price: 80000 },
];

describe("pricing", () => {
  it("sums service prices per item and per order", () => {
    const items = [
      { serviceIds: [1, 2] },
      { serviceIds: [3] },
      { serviceIds: [] },
    ];

    expect(itemSubtotal(items[0], services)).toBe(60000);
    expect(orderSubtotal(items, services)).toBe(140000);
  });

  it("ignores unknown service ids", () => {
    expect(itemSubtotal({ serviceIds: [999] }, services)).toBe(0);
  });

  it("rounds percent discounts down (ADR-0004)", () => {
    const discount: PricedDiscount = {
      type: "PERCENT",
      value: 10,
      min_order_subtotal: null,
    };

    expect(discountValueFor(discount, 54000)).toBe(5400);
    expect(discountValueFor(discount, 55555)).toBe(5555);
    expect(
      discountValueFor({ ...discount, value: 33 }, 100)
    ).toBe(33);
  });

  it("caps fixed discounts at the subtotal", () => {
    const discount: PricedDiscount = {
      type: "FIXED",
      value: 20000,
      min_order_subtotal: null,
    };

    expect(discountValueFor(discount, 50000)).toBe(20000);
    expect(discountValueFor(discount, 15000)).toBe(15000);
  });

  it("returns zero without a discount", () => {
    expect(discountValueFor(null, 50000)).toBe(0);
    expect(grandTotalFor(50000, null)).toBe(50000);
  });

  it("checks the minimum subtotal gate", () => {
    const discount: PricedDiscount = {
      type: "PERCENT",
      value: 10,
      min_order_subtotal: 100000,
    };

    expect(discountMeetsMinimum(discount, 99999)).toBe(false);
    expect(discountMeetsMinimum(discount, 100000)).toBe(true);
    expect(
      discountMeetsMinimum({ ...discount, min_order_subtotal: null }, 0)
    ).toBe(true);
  });
});
