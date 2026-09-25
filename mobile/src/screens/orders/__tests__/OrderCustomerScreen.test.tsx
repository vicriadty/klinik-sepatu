import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import { searchCustomers, type ApiCustomer } from "../../../api/customers";
import { useOrderWizardStore } from "../../../order/orderWizardStore";
import { deletePhotoFiles } from "../../../order/photoFiles";
import { usePhotoStore } from "../../../order/photoStore";
import OrderCustomerScreen from "../OrderCustomerScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

jest.mock("../../../api/customers", () => {
  const actual = jest.requireActual("../../../api/customers");
  return {
    ...actual,
    searchCustomers: jest.fn(),
  };
});

const searchMock = searchCustomers as jest.MockedFunction<typeof searchCustomers>;

jest.mock("../../../order/photoFiles", () => ({
  deletePhotoFiles: jest.fn(),
}));

const deleteFilesMock = deletePhotoFiles as jest.MockedFunction<
  typeof deletePhotoFiles
>;

const customer = {
  id: 3,
  name: "Emma",
  phone: "6281234567890",
  phone_display: "+6281234567890",
  email: null,
  address: null,
  notes: null,
  wa_opt_out: false,
  created_at: null,
  updated_at: null,
};

function pageOf(customers: ApiCustomer[], lastPage = 1) {
  return {
    data: customers,
    meta: {
      page: 1,
      per_page: 20,
      total: customers.length,
      last_page: lastPage,
    },
  };
}

function seedDraft() {
  useOrderWizardStore.setState({
    customer,
    items: [
      {
        id: "item-1",
        brand: "Nike",
        model: "",
        color: "",
        shoeType: "Sneakers",
        customerNote: "",
        serviceIds: [1],
      },
    ],
    discountId: null,
    idempotencyKey: null,
  });
  usePhotoStore.setState({
    drafts: {
      "item-1": [
        {
          id: "photo-1",
          uri: "file:///document/order-photos/photo-1.jpg",
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
        uri: "file:///document/order-photos/upload.jpg",
        type: "BEFORE",
        status: "failed",
        error: "Gagal mengunggah foto.",
      },
    ],
  });
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <OrderCustomerScreen />
    </QueryClientProvider>
  );
}

describe("OrderCustomerScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchMock.mockResolvedValue(pageOf([]));
    useOrderWizardStore.setState({
      customer: null,
      items: [],
      discountId: null,
      idempotencyKey: null,
    });
    usePhotoStore.setState({ drafts: {}, queue: [] });
  });

  it("restores the persisted draft with a notice", async () => {
    seedDraft();

    await renderScreen();

    expect(
      await screen.findByText("Draft order tersimpan dan dipulihkan otomatis.")
    ).toBeTruthy();
    expect(screen.getByText("Emma")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mulai Baru" })).toBeTruthy();
  });

  it("discards the draft, its photos and the wizard state", async () => {
    seedDraft();
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation(() => undefined);

    await renderScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Mulai Baru" }));

    const buttons = (
      alertSpy.mock.calls[0] as unknown as [
        string,
        string,
        { text: string; onPress?: () => void }[],
      ]
    )[2];
    const confirm = buttons.find((button) => button.text === "Ya, mulai baru");

    await act(async () => {
      confirm?.onPress?.();
    });

    expect(deleteFilesMock).toHaveBeenCalledWith([
      "file:///document/order-photos/photo-1.jpg",
    ]);
    expect(useOrderWizardStore.getState().customer).toBeNull();
    expect(useOrderWizardStore.getState().items).toHaveLength(0);
    expect(usePhotoStore.getState().drafts).toEqual({});
    expect(usePhotoStore.getState().queue).toHaveLength(1);
    expect(screen.queryByText("Draft order tersimpan dan dipulihkan otomatis.")).toBeNull();

    alertSpy.mockRestore();
  });

  it("offers no draft actions without a draft", async () => {
    await renderScreen();

    expect(screen.queryByRole("button", { name: "Mulai Baru" })).toBeNull();
    expect(await screen.findByText("Belum ada pelanggan dipilih.")).toBeTruthy();
  });

  it("selects a customer into the order draft", async () => {
    searchMock.mockResolvedValue(pageOf([customer]));

    await renderScreen();
    await fireEvent.press(
      await screen.findByRole("button", { name: "Pilih Emma" })
    );

    expect(useOrderWizardStore.getState().customer?.id).toBe(3);
  });

  it("opens customer creation in select mode", async () => {
    await renderScreen();
    await fireEvent.press(
      screen.getByRole("button", { name: "Tambah pelanggan baru" })
    );

    expect(mockNavigate).toHaveBeenCalledWith("CustomerForm", { select: true });
  });

  it("keeps the next step disabled until a customer is selected", async () => {
    await renderScreen();

    expect(
      screen.getByRole("button", { name: "Lanjut: pilih sepatu" }).props
        .accessibilityState.disabled
    ).toBe(true);
  });
});
