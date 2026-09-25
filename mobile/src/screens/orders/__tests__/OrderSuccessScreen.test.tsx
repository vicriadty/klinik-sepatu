import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { uploadItemPhoto } from "../../../api/photos";
import { usePhotoStore } from "../../../order/photoStore";
import OrderSuccessScreen from "../OrderSuccessScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const mockNavigate = jest.fn();
const mockReplace = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, replace: mockReplace }),
  useRoute: () => ({
    params: {
      orderId: 9,
      orderNumber: "ORD-20260914-0001",
      customerName: "Emma",
      grandTotal: 54000,
    },
  }),
}));

jest.mock("../../../api/photos", () => ({
  uploadItemPhoto: jest.fn(),
}));

const uploadMock = uploadItemPhoto as jest.MockedFunction<
  typeof uploadItemPhoto
>;

function seedQueue(count: number) {
  usePhotoStore.setState({
    drafts: {},
    queue: Array.from({ length: count }, (_, index) => ({
      id: `photo-${index + 1}`,
      orderItemId: 101 + index,
      uri: `file:///photo-${index + 1}.jpg`,
      type: "BEFORE" as const,
      status: "pending" as const,
      error: null,
    })),
  });
}

describe("OrderSuccessScreen", () => {
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

  it("uploads queued photos automatically", async () => {
    seedQueue(2);
    await render(<OrderSuccessScreen />);

    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Foto (2/2 terunggah)")).toBeTruthy();
    expect(uploadMock).toHaveBeenCalledWith(101, {
      uri: "file:///photo-1.jpg",
      type: "BEFORE",
    });
  });

  it("keeps a failed upload retryable without blocking the order", async () => {
    uploadMock.mockRejectedValueOnce(new Error("network"));
    seedQueue(1);
    await render(<OrderSuccessScreen />);

    expect(await screen.findByText("Gagal mengunggah foto.")).toBeTruthy();
    expect(screen.getByText("Foto (0/1 terunggah)")).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("button", { name: "Unggah Ulang" })
    );

    expect(await screen.findByText("Foto (1/1 terunggah)")).toBeTruthy();
  });

  it("links to the payment screen", async () => {
    await render(<OrderSuccessScreen />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Lanjut ke Pembayaran" })
    );

    expect(mockNavigate).toHaveBeenCalledWith("OrderPayment", { orderId: 9 });
  });

  it("links to the order detail and starts a new order", async () => {
    await render(<OrderSuccessScreen />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Lihat pesanan" })
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Pesanan baru" })
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Kembali ke Beranda" })
    );

    expect(mockNavigate).toHaveBeenCalledWith("OrderDetail", { orderId: 9 });
    expect(mockNavigate).toHaveBeenCalledWith("Home");
    expect(mockReplace).toHaveBeenCalledWith("OrderCustomer");
  });
});
