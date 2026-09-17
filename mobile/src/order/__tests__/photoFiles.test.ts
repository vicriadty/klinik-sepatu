import { File } from "expo-file-system";
import { deletePhotoFile, persistPhotoFile } from "../photoFiles";

describe("photoFiles", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("copies a picked photo into the app photo directory", async () => {
    const uri = await persistPhotoFile("file:///picker/photo.jpg");

    expect(uri).toContain("/order-photos/");
    expect(uri).not.toBe("file:///picker/photo.jpg");
  });

  it("falls back to the original uri when the copy fails", async () => {
    jest
      .spyOn(File.prototype, "copy")
      .mockRejectedValueOnce(new Error("disk full"));

    await expect(persistPhotoFile("file:///picker/photo.jpg")).resolves.toBe(
      "file:///picker/photo.jpg"
    );
  });

  it("deletes only files inside the app photo directory", () => {
    const deleteSpy = jest.spyOn(File.prototype, "delete");

    deletePhotoFile("file:///document/order-photos/photo-1.jpg");
    expect(deleteSpy).toHaveBeenCalledTimes(1);

    deletePhotoFile("file:///picker/photo.jpg");
    expect(deleteSpy).toHaveBeenCalledTimes(1);
  });
});
