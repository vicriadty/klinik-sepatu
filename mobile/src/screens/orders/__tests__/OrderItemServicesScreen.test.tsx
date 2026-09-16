import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { fetchServices } from "../../../api/services";
import { useOrderWizardStore } from "../../../order/orderWizardStore";
import OrderItemServicesScreen from "../OrderItemServicesScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: { itemId: "item-1" } }),
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
  {
    id: 2,
    name: "Deep Clean",
    category_id: 1,
    category: { id: 1, name: "Cleaning" },
    description: null,
    price: 35000,
    estimated_duration_days: 2,
    active: true,
  },
];

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <OrderItemServicesScreen />
    </QueryClientProvider>
  );
}

describe("OrderItemServicesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    servicesMock.mockResolvedValue(services);
    useOrderWizardStore.setState({
      customer: null,
      items: [
        {
          id: "item-1",
          brand: "Nike",
          model: "",
          color: "",
          shoeType: "Sneakers",
          customerNote: "",
          serviceIds: [],
        },
      ],
      discountId: null,
      idempotencyKey: null,
    });
  });

  it("toggles services and saves the selection", async () => {
    await renderScreen();

    expect(await screen.findByText("Fast Clean")).toBeTruthy();
    expect(screen.getByText("0 layanan · Rp0")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Layanan Fast Clean"));
    expect(screen.getByText("1 layanan · Rp25.000")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Layanan Deep Clean"));
    expect(screen.getByText("2 layanan · Rp60.000")).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("button", { name: "Simpan Layanan" })
    );

    expect(
      useOrderWizardStore.getState().items[0]?.serviceIds
    ).toEqual([1, 2]);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("cannot save without a selection", async () => {
    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Simpan Layanan" })
    );

    expect(mockGoBack).not.toHaveBeenCalled();
  });
});
