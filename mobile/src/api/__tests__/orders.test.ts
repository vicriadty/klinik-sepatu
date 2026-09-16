import { createOrder, fetchOrder, recordPayment } from "../orders";

const fetchMock = jest.fn();

function jsonResponse(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

describe("orders api", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = "http://test.local/api/v1";
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it("posts the order with the idempotency key header", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, {
        data: { id: 9, order_number: "ORD-20260914-0001", grand_total: 54000 },
      })
    );

    const order = await createOrder(
      {
        customer_id: 3,
        discount_id: 5,
        items: [
          {
            brand: "Nike",
            model: "Air Max",
            shoe_type: "Sneakers",
            services: [1, 2],
          },
        ],
      },
      "key-123"
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test.local/api/v1/orders",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "key-123" }),
        body: JSON.stringify({
          customer_id: 3,
          discount_id: 5,
          items: [
            {
              brand: "Nike",
              model: "Air Max",
              shoe_type: "Sneakers",
              services: [1, 2],
            },
          ],
        }),
      })
    );
    expect(order.order_number).toBe("ORD-20260914-0001");
  });

  it("accepts an idempotent replay (200)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { data: { id: 9, order_number: "ORD-1" } })
    );

    await expect(
      createOrder({ customer_id: 1, items: [] }, "key-1")
    ).resolves.toMatchObject({ id: 9 });
  });

  it("fetches an order with its payments", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        data: {
          id: 9,
          order_number: "ORD-1",
          payment_status: "PARTIAL",
          remaining_balance: 27000,
          payments: [{ id: 1, method: "CASH", amount: 27000 }],
        },
      })
    );

    const order = await fetchOrder(9);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test.local/api/v1/orders/9",
      expect.objectContaining({ method: "GET" })
    );
    expect(order.payment_status).toBe("PARTIAL");
    expect(order.payments).toHaveLength(1);
  });

  it("records a payment with the idempotency key header", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, {
        data: { id: 5, method: "QRIS", amount: 54000, type: "payment" },
      })
    );

    const payment = await recordPayment(
      9,
      { method: "QRIS", amount: 54000, note: "Diterima" },
      "pay-key-1"
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test.local/api/v1/orders/9/payments",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "pay-key-1" }),
        body: JSON.stringify({
          method: "QRIS",
          amount: 54000,
          note: "Diterima",
        }),
      })
    );
    expect(payment).toMatchObject({ id: 5, method: "QRIS" });
  });
});
