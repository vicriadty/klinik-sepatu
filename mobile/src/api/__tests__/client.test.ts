import {
  ApiError,
  apiFetch,
  setAuthToken,
  setUnauthorizedHandler,
} from "../client";

const fetchMock = jest.fn();

function jsonResponse(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

describe("apiFetch", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = "http://test.local/api/v1";
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    setAuthToken(null);
    setUnauthorizedHandler(null);
  });

  it("sends the auth header and parses JSON", async () => {
    setAuthToken("tok-123");
    fetchMock.mockResolvedValue(jsonResponse(200, { data: { id: 1 } }));

    const result = await apiFetch<{ data: { id: number } }>("/auth/me");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test.local/api/v1/auth/me",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: "Bearer tok-123",
        }),
      })
    );
    expect(result).toEqual({ data: { id: 1 } });
  });

  it("serializes the body and sets content type", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { data: 1 }));

    await apiFetch("/auth/login", {
      method: "POST",
      body: { username: "owner" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test.local/api/v1/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ username: "owner" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("throws ApiError with status and field errors", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        message: "The given data was invalid.",
        errors: { username: ["The username field is required."] },
      })
    );

    await expect(apiFetch("/auth/login", { method: "POST" })).rejects.toMatchObject(
      {
        status: 422,
        fields: { username: ["The username field is required."] },
      }
    );
  });

  it("calls the unauthorized handler on 401", async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockResolvedValue(jsonResponse(401, { message: "Unauthenticated." }));

    await expect(apiFetch("/auth/me")).rejects.toBeInstanceOf(ApiError);

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("skips the unauthorized handler when asked", async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockResolvedValue(jsonResponse(401, { message: "Invalid credentials." }));

    await expect(
      apiFetch("/auth/login", { method: "POST", skipUnauthorizedHandler: true })
    ).rejects.toBeInstanceOf(ApiError);

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("maps network failures to an Indonesian ApiError", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(apiFetch("/auth/me")).rejects.toMatchObject({
      message: "Tidak dapat terhubung ke server.",
      status: undefined,
    });
  });

  it("returns undefined for 204 responses", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => null });

    await expect(apiFetch("/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });
});
