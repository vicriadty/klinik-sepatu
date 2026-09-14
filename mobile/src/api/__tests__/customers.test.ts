import { ApiError } from "../client";
import { createCustomer, duplicateCustomerFrom, searchCustomers } from "../customers";

const fetchMock = jest.fn();

function jsonResponse(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

describe("customers api", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = "http://test.local/api/v1";
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it("builds the search query string", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        data: [],
        meta: { page: 1, per_page: 20, total: 0, last_page: 1 },
      })
    );

    await searchCustomers({ search: "budi", page: 2, per_page: 20 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test.local/api/v1/customers?search=budi&page=2&per_page=20",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("omits empty params", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        data: [],
        meta: { page: 1, per_page: 20, total: 0, last_page: 1 },
      })
    );

    await searchCustomers();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test.local/api/v1/customers",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("posts the create payload", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, { data: { id: 1, name: "Budi" } })
    );

    const customer = await createCustomer({
      name: "Budi",
      phone: "6281234567890",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test.local/api/v1/customers",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Budi", phone: "6281234567890" }),
      })
    );
    expect(customer).toEqual({ id: 1, name: "Budi" });
  });

  it("exposes the existing customer from a 409 payload", async () => {
    const existing = { id: 7, name: "Budi", phone: "6281234567890" };
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        message: "Customer with this phone number already exists.",
        data: { customer: existing },
      })
    );

    const error = await createCustomer({
      name: "Budi",
      phone: "6281234567890",
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(duplicateCustomerFrom(error)).toEqual(existing);
  });

  it("returns null when the error has no duplicate payload", () => {
    expect(duplicateCustomerFrom(new ApiError("boom", 500))).toBeNull();
    expect(duplicateCustomerFrom(new Error("boom"))).toBeNull();
  });
});
