import { deleteItemPhoto, fetchItemPhotos, uploadItemPhoto } from "../photos";

const fetchMock = jest.fn();

function jsonResponse(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

describe("photos api", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = "http://test.local/api/v1";
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it("lists the photos of an order item", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { data: [{ id: 1, type: "BEFORE" }] })
    );

    const photos = await fetchItemPhotos(7);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test.local/api/v1/order-items/7/photos",
      expect.objectContaining({ method: "GET" })
    );
    expect(photos).toHaveLength(1);
  });

  it("uploads a multipart photo with its type", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, { data: { id: 3, type: "DAMAGE" } })
    );

    const parts: Array<[string, unknown]> = [];
    const originalFormData = globalThis.FormData;
    class RecordingFormData {
      append(name: string, value: unknown) {
        parts.push([name, value]);
      }
    }
    (globalThis as { FormData: unknown }).FormData =
      RecordingFormData as never;

    try {
      await uploadItemPhoto(7, {
        uri: "file:///tmp/a.jpg",
        type: "DAMAGE",
        fileName: "a.jpg",
        mimeType: "image/jpeg",
      });
    } finally {
      (globalThis as { FormData: unknown }).FormData = originalFormData;
    }

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://test.local/api/v1/order-items/7/photos");
    expect(init.method).toBe("POST");
    expect(
      (init.headers as Record<string, string>)["Content-Type"]
    ).toBeUndefined();
    expect(parts).toEqual([
      ["type", "DAMAGE"],
      [
        "photo",
        { uri: "file:///tmp/a.jpg", name: "a.jpg", type: "image/jpeg" },
      ],
    ]);
  });

  it("deletes a photo", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => null,
    });

    await deleteItemPhoto(3);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test.local/api/v1/order-item-photos/3",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
