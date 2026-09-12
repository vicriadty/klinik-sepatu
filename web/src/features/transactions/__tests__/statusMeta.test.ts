import { describe, expect, it } from "vitest";
import {
  ALL_ORDER_STATUSES,
  ALL_PAYMENT_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "../statusMeta";

describe("statusMeta", () => {
  it("covers every order status in Indonesian", () => {
    expect(ALL_ORDER_STATUSES).toEqual([
      "RECEIVED",
      "ON_PROCESS",
      "READY_FOR_PICKUP",
      "COMPLETED",
      "CANCELLED",
    ]);
    expect(ORDER_STATUS_LABELS.RECEIVED).toBe("Diterima");
    expect(ORDER_STATUS_LABELS.READY_FOR_PICKUP).toBe("Siap Diambil");
    expect(ORDER_STATUS_LABELS.COMPLETED).toBe("Selesai");
  });

  it("covers every payment status in Indonesian", () => {
    expect(ALL_PAYMENT_STATUSES).toEqual(["UNPAID", "PARTIAL", "PAID"]);
    expect(PAYMENT_STATUS_LABELS.UNPAID).toBe("Belum Bayar");
    expect(PAYMENT_STATUS_LABELS.PAID).toBe("Lunas");
  });
});
