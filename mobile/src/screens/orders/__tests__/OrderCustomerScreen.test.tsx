import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { searchCustomers, type ApiCustomer } from "../../../api/customers";
import { useOrderWizardStore } from "../../../order/orderWizardStore";
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
  });

  it("restores the persisted customer and keeps the next action fixed", async () => {
    seedDraft();

    await renderScreen();

    expect(await screen.findByText("Emma")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pilih Sepatu" })).toBeTruthy();
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
      screen.getByRole("button", { name: "Pilih Sepatu" }).props
        .accessibilityState.disabled
    ).toBe(true);
  });
});
