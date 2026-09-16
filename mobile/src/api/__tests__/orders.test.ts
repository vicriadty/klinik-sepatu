import { createOrder } from "../orders";

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
});
