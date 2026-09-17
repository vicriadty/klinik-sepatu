import { blockedTransitionHint, legalTransitions } from "../status";

describe("legalTransitions", () => {
  it("offers the forward step and cancel for RECEIVED", () => {
    const transitions = legalTransitions({
      status: "RECEIVED",
      payment_status: "UNPAID",
      paid_total: 0,
    });

    expect(transitions).toEqual([
      { status: "ON_PROCESS", label: "Mulai Proses" },
      { status: "CANCELLED", label: "Batalkan" },
    ]);
  });

  it("blocks COMPLETED until the order is paid", () => {
    const unpaid = legalTransitions({
      status: "READY_FOR_PICKUP",
      payment_status: "PARTIAL",
      paid_total: 10000,
    });
    expect(unpaid).toEqual([]);

    const paid = legalTransitions({
      status: "READY_FOR_PICKUP",
      payment_status: "PAID",
      paid_total: 54000,
    });
    expect(paid).toEqual([{ status: "COMPLETED", label: "Selesaikan" }]);
  });

  it("blocks CANCELLED while payments are recorded", () => {
    const transitions = legalTransitions({
      status: "ON_PROCESS",
      payment_status: "PARTIAL",
      paid_total: 25000,
    });

    expect(transitions).toEqual([
      { status: "READY_FOR_PICKUP", label: "Siap Diambil" },
    ]);
  });

  it("offers nothing for terminal statuses", () => {
    expect(
      legalTransitions({
        status: "COMPLETED",
        payment_status: "PAID",
        paid_total: 54000,
      })
    ).toEqual([]);
    expect(
      legalTransitions({
        status: "CANCELLED",
        payment_status: "UNPAID",
        paid_total: 0,
      })
    ).toEqual([]);
  });
});

describe("blockedTransitionHint", () => {
  it("explains the payment requirement before completing", () => {
    expect(
      blockedTransitionHint({
        status: "READY_FOR_PICKUP",
        payment_status: "UNPAID",
        paid_total: 0,
      })
    ).toBe("Pelunasan diperlukan sebelum order bisa diselesaikan.");
  });

  it("explains the refund requirement before cancelling a paid order", () => {
    expect(
      blockedTransitionHint({
        status: "RECEIVED",
        payment_status: "PARTIAL",
        paid_total: 25000,
      })
    ).toBe("Refund diperlukan sebelum order berbayar bisa dibatalkan.");
  });

  it("returns null when nothing is blocked", () => {
    expect(
      blockedTransitionHint({
        status: "RECEIVED",
        payment_status: "UNPAID",
        paid_total: 0,
      })
    ).toBeNull();
  });
});
