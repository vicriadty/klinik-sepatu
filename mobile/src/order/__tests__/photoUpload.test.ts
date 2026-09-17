import { uploadItemPhoto } from "../../api/photos";
import { deletePhotoFile } from "../photoFiles";
import { usePhotoStore, type UploadEntry } from "../photoStore";
import { uploadQueuedPhotos } from "../photoUpload";

jest.mock("../../api/photos", () => ({
  uploadItemPhoto: jest.fn(),
}));

jest.mock("../photoFiles", () => ({
  deletePhotoFile: jest.fn(),
}));

const uploadMock = uploadItemPhoto as jest.MockedFunction<
  typeof uploadItemPhoto
>;
const deleteFileMock = deletePhotoFile as jest.MockedFunction<
  typeof deletePhotoFile
>;

function makeEntry(overrides: Partial<UploadEntry> = {}): UploadEntry {
  return {
    id: "photo-1",
    orderItemId: 101,
    uri: "file:///document/order-photos/photo-1.jpg",
    type: "BEFORE",
    status: "pending",
    error: null,
    ...overrides,
  };
}

describe("uploadQueuedPhotos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePhotoStore.setState({ drafts: {}, queue: [] });
    uploadMock.mockResolvedValue({
      id: 1,
      order_item_id: 101,
      type: "BEFORE",
      url: "http://example.test/photo.jpg",
      thumbnail_url: null,
      mime: "image/jpeg",
      size: 1000,
      created_at: null,
    });
  });

  it("uploads pending entries and deletes the local copies", async () => {
    usePhotoStore.setState({
      drafts: {},
      queue: [
        makeEntry(),
        makeEntry({ id: "photo-2", orderItemId: 102 }),
      ],
    });

    await uploadQueuedPhotos();

    expect(uploadMock).toHaveBeenCalledTimes(2);
    expect(usePhotoStore.getState().queue.every((e) => e.status === "uploaded")).toBe(true);
    expect(deleteFileMock).toHaveBeenCalledWith(
      "file:///document/order-photos/photo-1.jpg"
    );
  });

  it("keeps failed entries retryable", async () => {
    uploadMock.mockRejectedValueOnce(new Error("network"));
    usePhotoStore.setState({ drafts: {}, queue: [makeEntry()] });

    await uploadQueuedPhotos();

    expect(usePhotoStore.getState().queue[0]).toMatchObject({
      status: "failed",
      error: "Gagal mengunggah foto.",
    });
    expect(deleteFileMock).not.toHaveBeenCalled();

    await uploadQueuedPhotos();

    expect(usePhotoStore.getState().queue[0]?.status).toBe("uploaded");
  });

  it("scopes uploads to the given order items", async () => {
    usePhotoStore.setState({
      drafts: {},
      queue: [
        makeEntry(),
        makeEntry({ id: "photo-2", orderItemId: 999 }),
      ],
    });

    await uploadQueuedPhotos({ onlyItemIds: [999] });

    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(uploadMock).toHaveBeenCalledWith(999, {
      uri: "file:///document/order-photos/photo-1.jpg",
      type: "BEFORE",
    });
  });

  it("does not run two upload batches at once", async () => {
    let resolveUpload: () => void = () => {};
    uploadMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = () =>
            resolve({
              id: 1,
              order_item_id: 101,
              type: "BEFORE",
              url: "http://example.test/photo.jpg",
              thumbnail_url: null,
              mime: "image/jpeg",
              size: 1000,
              created_at: null,
            });
        })
    );
    usePhotoStore.setState({ drafts: {}, queue: [makeEntry()] });

    const first = uploadQueuedPhotos();
    await uploadQueuedPhotos();

    expect(uploadMock).toHaveBeenCalledTimes(1);

    resolveUpload();
    await first;
  });
});
