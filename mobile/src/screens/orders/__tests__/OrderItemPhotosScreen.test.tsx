import { fireEvent, render, screen } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { useOrderWizardStore } from "../../../order/orderWizardStore";
import { type DraftPhoto, usePhotoStore } from "../../../order/photoStore";
import OrderItemPhotosScreen from "../OrderItemPhotosScreen";

jest.setTimeout(60_000);

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({ params: { itemId: "item-1" } }),
}));

const launchCameraMock = ImagePicker.launchCameraAsync as jest.MockedFunction<
  typeof ImagePicker.launchCameraAsync
>;
const cameraPermissionMock =
  ImagePicker.requestCameraPermissionsAsync as jest.MockedFunction<
    typeof ImagePicker.requestCameraPermissionsAsync
  >;
const launchLibraryMock =
  ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
    typeof ImagePicker.launchImageLibraryAsync
  >;
const libraryPermissionMock =
  ImagePicker.requestMediaLibraryPermissionsAsync as jest.MockedFunction<
    typeof ImagePicker.requestMediaLibraryPermissionsAsync
  >;

function seedItem() {
  useOrderWizardStore.setState({
    customer: null,
    items: [
      {
        id: "item-1",
        brand: "Nike",
        model: "Air Max",
        color: "",
        shoeType: "Sneakers",
        customerNote: "",
        serviceIds: [1],
      },
    ],
    discountId: null,
    idempotencyKey: null,
  });
}

describe("OrderItemPhotosScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    seedItem();
    usePhotoStore.setState({ drafts: {}, queue: [] });
    cameraPermissionMock.mockResolvedValue({ granted: true } as never);
    libraryPermissionMock.mockResolvedValue({ granted: true } as never);
    launchCameraMock.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///photo.jpg", width: 100, height: 100 }],
    } as never);
    launchLibraryMock.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///library-photo.jpg", width: 100, height: 100 }],
    } as never);
  });

  it("captures a BEFORE photo for the selected angle", async () => {
    await render(<OrderItemPhotosScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Ambil Foto" }));

    const drafts = usePhotoStore.getState().drafts["item-1"];
    expect(drafts).toHaveLength(1);
    expect(drafts![0]).toMatchObject({
      angle: "front",
      type: "BEFORE",
    });
    expect(drafts![0]!.uri).toContain("/order-photos/");
  });

  it("maps the damage angle to the DAMAGE type", async () => {
    await render(<OrderItemPhotosScreen />);

    await fireEvent.press(screen.getByLabelText("Sudut Kerusakan"));
    await fireEvent.press(screen.getByRole("button", { name: "Ambil Foto" }));

    expect(usePhotoStore.getState().drafts["item-1"]![0]).toMatchObject({
      angle: "damage",
      type: "DAMAGE",
    });
  });

  it("removes a captured photo", async () => {
    await render(<OrderItemPhotosScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Ambil Foto" }));
    await fireEvent.press(screen.getByRole("button", { name: "Hapus Depan" }));

    expect(usePhotoStore.getState().drafts["item-1"]).toHaveLength(0);
    expect(screen.getByText(/Foto tersimpan.*0.*5/)).toBeTruthy();
  });

  it("selects a photo from the gallery", async () => {
    await render(<OrderItemPhotosScreen />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Pilih dari Galeri" })
    );

    expect(libraryPermissionMock).toHaveBeenCalledTimes(1);
    expect(launchLibraryMock).toHaveBeenCalledTimes(1);
    expect(usePhotoStore.getState().drafts["item-1"]).toHaveLength(1);
  });

  it("warns when the camera permission is denied", async () => {
    cameraPermissionMock.mockResolvedValue({ granted: false } as never);
    await render(<OrderItemPhotosScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Ambil Foto" }));

    expect(
      await screen.findByText("Izin kamera diperlukan untuk mengambil foto.")
    ).toBeTruthy();
    expect(usePhotoStore.getState().drafts["item-1"]).toBeUndefined();
  });

  it("rejects photos above the 5 MB limit", async () => {
    launchCameraMock.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///big.jpg",
          width: 100,
          height: 100,
          fileSize: 6 * 1024 * 1024,
        },
      ],
    } as never);

    await render(<OrderItemPhotosScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Ambil Foto" }));

    expect(
      await screen.findByText("Foto terlalu besar (maks 5 MB). Coba ambil ulang.")
    ).toBeTruthy();
    expect(usePhotoStore.getState().drafts["item-1"]).toBeUndefined();
  });

  it("stops adding photos after the five-photo limit", async () => {
    const photos: DraftPhoto[] = Array.from({ length: 5 }, (_, index) => ({
      id: `photo-${index}`,
      uri: `file:///photo-${index}.jpg`,
      angle: "front",
      type: "BEFORE",
    }));
    usePhotoStore.setState({ drafts: { "item-1": photos }, queue: [] });

    await render(<OrderItemPhotosScreen />);

    expect(
      screen.queryByRole("button", { name: "Ambil Foto" })
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Pilih dari Galeri" })
    ).toBeNull();
  });

  it("continues to review and saves the draft locally", async () => {
    await render(<OrderItemPhotosScreen />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Lanjut: tinjau pesanan" })
    );
    expect(mockNavigate).toHaveBeenCalledWith("OrderReview");

    await fireEvent.press(screen.getByRole("button", { name: "Simpan draft" }));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
