import { usePhotoStore } from "../photoStore";

describe("usePhotoStore", () => {
  beforeEach(() => {
    usePhotoStore.setState({ drafts: {}, queue: [] });
  });

  it("adds and removes drafts per item", () => {
    usePhotoStore
      .getState()
      .addDraft("item-1", { uri: "file:///a.jpg", angle: "front", type: "BEFORE" });
    usePhotoStore
      .getState()
      .addDraft("item-1", { uri: "file:///b.jpg", angle: "damage", type: "DAMAGE" });
    usePhotoStore
      .getState()
      .addDraft("item-2", { uri: "file:///c.jpg", angle: "back", type: "BEFORE" });

    expect(usePhotoStore.getState().drafts["item-1"]).toHaveLength(2);

    const firstId = usePhotoStore.getState().drafts["item-1"]![0]!.id;
    usePhotoStore.getState().removeDraft("item-1", firstId);

    expect(usePhotoStore.getState().drafts["item-1"]).toHaveLength(1);
    expect(usePhotoStore.getState().drafts["item-1"]![0]!.angle).toBe("damage");
    expect(usePhotoStore.getState().drafts["item-2"]).toHaveLength(1);
  });

  it("moves drafts into the upload queue after order creation", () => {
    usePhotoStore
      .getState()
      .addDraft("item-1", { uri: "file:///a.jpg", angle: "front", type: "BEFORE" });
    usePhotoStore
      .getState()
      .addDraft("item-2", { uri: "file:///b.jpg", angle: "damage", type: "DAMAGE" });

    usePhotoStore.getState().enqueueFromOrder([
      { itemId: "item-1", orderItemId: 101 },
      { itemId: "item-2", orderItemId: 102 },
    ]);

    const queue = usePhotoStore.getState().queue;
    expect(queue).toHaveLength(2);
    expect(queue.map((entry) => entry.orderItemId)).toEqual([101, 102]);
    expect(queue.every((entry) => entry.status === "pending")).toBe(true);
    expect(usePhotoStore.getState().drafts).toEqual({});
  });

  it("keeps uploads from earlier orders when enqueueing a new order", () => {
    usePhotoStore.setState({
      drafts: {},
      queue: [
        {
          id: "photo-old",
          orderItemId: 99,
          orderId: 8,
          uri: "file:///old.jpg",
          type: "BEFORE",
          status: "failed",
          error: "Gagal mengunggah foto.",
        },
      ],
    });
    usePhotoStore
      .getState()
      .addDraft("item-1", { uri: "file:///a.jpg", angle: "front", type: "BEFORE" });

    usePhotoStore
      .getState()
      .enqueueFromOrder([{ itemId: "item-1", orderItemId: 101 }], 9);

    expect(usePhotoStore.getState().queue).toEqual([
      expect.objectContaining({ id: "photo-old", orderId: 8 }),
      expect.objectContaining({ orderItemId: 101, orderId: 9 }),
    ]);
  });

  it("tracks upload status per entry", () => {
    usePhotoStore
      .getState()
      .addDraft("item-1", { uri: "file:///a.jpg", angle: "front", type: "BEFORE" });
    usePhotoStore
      .getState()
      .enqueueFromOrder([{ itemId: "item-1", orderItemId: 101 }]);

    const entryId = usePhotoStore.getState().queue[0]!.id;

    usePhotoStore.getState().setStatus(entryId, "uploading");
    expect(usePhotoStore.getState().queue[0]!.status).toBe("uploading");

    usePhotoStore
      .getState()
      .setStatus(entryId, "failed", "Gagal mengunggah foto.");
    expect(usePhotoStore.getState().queue[0]).toMatchObject({
      status: "failed",
      error: "Gagal mengunggah foto.",
    });

    usePhotoStore.getState().setStatus(entryId, "uploaded");
    expect(usePhotoStore.getState().queue[0]).toMatchObject({
      status: "uploaded",
      error: null,
    });
  });

  it("clears drafts and queue", () => {
    usePhotoStore
      .getState()
      .addDraft("item-1", { uri: "file:///a.jpg", angle: "front", type: "BEFORE" });
    usePhotoStore.getState().clear();

    expect(usePhotoStore.getState().drafts).toEqual({});
    expect(usePhotoStore.getState().queue).toEqual([]);
  });

  it("clears only drafts when starting a new order", () => {
    usePhotoStore.setState({
      drafts: {
        "item-1": [
          {
            id: "photo-draft",
            uri: "file:///draft.jpg",
            angle: "front",
            type: "BEFORE",
          },
        ],
      },
      queue: [
        {
          id: "photo-upload",
          orderItemId: 101,
          orderId: 9,
          uri: "file:///upload.jpg",
          type: "BEFORE",
          status: "failed",
          error: "Gagal mengunggah foto.",
        },
      ],
    });

    usePhotoStore.getState().clearDrafts();

    expect(usePhotoStore.getState().drafts).toEqual({});
    expect(usePhotoStore.getState().queue).toHaveLength(1);
  });
});
