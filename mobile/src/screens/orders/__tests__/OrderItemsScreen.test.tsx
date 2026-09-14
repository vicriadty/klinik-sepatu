import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { fetchServices } from "../../../api/services";
import { useOrderWizardStore } from "../../../order/orderWizardStore";
import OrderItemsScreen from "../OrderItemsScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("../../../api/services", () => ({
  fetchServices: jest.fn(),
}));

const servicesMock = fetchServices as jest.MockedFunction<typeof fetchServices>;

const services = [
  {
    id: 1,
    name: "Fast Clean",
    category_id: 1,
    category: { id: 1, name: "Cleaning" },
    description: null,
    price: 25000,
    estimated_duration_days: 1,
    active: true,
  },
];

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

function seedItem(serviceIds: number[]) {
  const id = useOrderWizardStore.getState().addItem({
    brand: "Nike",
    model: "Air Max",
    color: "Putih",
    shoeType: "Sneakers",
    customerNote: "",
  });
  useOrderWizardStore.getState().setItemServices(id, serviceIds);
  return id;
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <OrderItemsScreen />
    </QueryClientProvider>
  );
}

describe("OrderItemsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOrderWizardStore.setState({
      customer: null,
      items: [],
      discountId: null,
      idempotencyKey: null,
    });
    servicesMock.mockResolvedValue(services);
  });

  it("lists items with their service subtotal", async () => {
    useOrderWizardStore.getState().setCustomer(customer);
    seedItem([1]);

    await renderScreen();

    expect(await screen.findByText("#1 Nike Air Max")).toBeTruthy();
    expect(screen.getByText("1 layanan")).toBeTruthy();
    expect(screen.getByText("Rp25.000")).toBeTruthy();
  });

  it("blocks review until every item has a service", async () => {
    useOrderWizardStore.getState().setCustomer(customer);
    seedItem([]);

    await renderScreen();

    expect(
      await screen.findByText("Belum ada layanan — tap untuk memilih")
    ).toBeTruthy();
    expect(
      screen.getByText("Setiap sepatu harus memiliki minimal satu layanan.")
    ).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("button", { name: "Lanjut ke Review" })
    );

    expect(mockNavigate).not.toHaveBeenCalledWith("OrderReview");
  });

  it("navigates to review when every item is ready", async () => {
    useOrderWizardStore.getState().setCustomer(customer);
    seedItem([1]);

    await renderScreen();
    await fireEvent.press(
      screen.getByRole("button", { name: "Lanjut ke Review" })
    );

    expect(mockNavigate).toHaveBeenCalledWith("OrderReview");
  });

  it("opens the shoe form and the service picker", async () => {
    useOrderWizardStore.getState().setCustomer(customer);
    const itemId = seedItem([1]);

    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Tambah Sepatu" })
    );
    expect(mockNavigate).toHaveBeenCalledWith("OrderItemForm");

    await fireEvent.press(screen.getByLabelText("Atur layanan Nike Air Max"));
    expect(mockNavigate).toHaveBeenCalledWith("OrderItemServices", {
      itemId,
    });
  });
});
