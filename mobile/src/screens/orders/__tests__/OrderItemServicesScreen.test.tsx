import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useOrderWizardStore } from "../../../order/orderWizardStore";
import OrderItemServicesScreen from "../OrderItemServicesScreen";

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

const services = [
  {
    id: 1,
    name: "Fast Clean",
    category_id: 1,
    category: { id: 1, name: "Cleaning" },
    description: "Pembersihan cepat",
    price: 25000,
    estimated_duration_days: 1,
    active: true,
  },
  {
    id: 2,
    name: "Deep Clean",
    category_id: 1,
    category: { id: 1, name: "Cleaning" },
    description: "Cuci menyeluruh",
    price: 35000,
    estimated_duration_days: 2,
    active: true,
  },
];

function seedItems(secondItemServices: number[] = []) {
  const firstItemId = "item-1";
  const secondItemId = "item-2";
  useOrderWizardStore.setState({
    items: [
      {
        id: firstItemId,
        brand: "Nike",
        model: "Air Max",
        color: "Putih",
        shoeType: "Sneakers",
        customerNote: "",
        serviceIds: [],
      },
      {
        id: secondItemId,
        brand: "Adidas",
        model: "Stan Smith",
        color: "Hitam",
        shoeType: "Sneakers",
        customerNote: "",
        serviceIds: secondItemServices,
      },
    ],
  });

  return { firstItemId, secondItemId };
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
    },
  });
  queryClient.setQueryData(["services", "active"], services);
  return render(
    <QueryClientProvider client={queryClient}>
      <OrderItemServicesScreen />
    </QueryClientProvider>
  );
}

describe("OrderItemServicesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOrderWizardStore.setState({
      customer: null,
      items: [],
      discountId: null,
      idempotencyKey: null,
    });
  });

  it("shows service tabs and the active shoe subtotal", async () => {
    seedItems();

    await renderScreen();

    expect(screen.getByText("Fast Clean")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Sepatu 1" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Sepatu 2" })).toBeTruthy();
    expect(screen.getByText("Subtotal sepatu 1")).toBeTruthy();
    expect(screen.getByText("0 layanan")).toBeTruthy();
    expect(screen.getByText("Rp0")).toBeTruthy();
  });

  it("persists selections for every shoe before continuing to photos", async () => {
    const { firstItemId, secondItemId } = seedItems();

    await renderScreen();

    await fireEvent.press(screen.getByLabelText("Layanan Fast Clean"));
    await fireEvent.press(screen.getByRole("tab", { name: "Sepatu 2" }));
    await fireEvent.press(screen.getByLabelText("Layanan Deep Clean"));

    expect(screen.getByText("1 layanan")).toBeTruthy();
    expect(screen.getAllByText("Rp35.000")).toHaveLength(2);

    await fireEvent.press(
      screen.getByRole("button", { name: "Lanjut: ambil foto" })
    );

    expect(useOrderWizardStore.getState().items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: firstItemId, serviceIds: [1] }),
        expect.objectContaining({ id: secondItemId, serviceIds: [2] }),
      ])
    );
    expect(mockNavigate).toHaveBeenCalledWith("OrderItemPhotos", {
      itemId: secondItemId,
    });
  });

  it("blocks photo continuation until every shoe has a service", async () => {
    seedItems([1]);

    await renderScreen();

    const button = screen.getByRole("button", { name: "Lanjut: ambil foto" });

    expect(button.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(button);
    expect(mockNavigate).not.toHaveBeenCalledWith("OrderItemPhotos", expect.anything());
  });

  it("saves the current tab selections when saving the draft", async () => {
    const { firstItemId } = seedItems();

    await renderScreen();
    await fireEvent.press(screen.getByLabelText("Layanan Fast Clean"));
    await fireEvent.press(screen.getByRole("button", { name: "Simpan draft" }));

    expect(
      useOrderWizardStore.getState().items.find((item) => item.id === firstItemId)
        ?.serviceIds
    ).toEqual([1]);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
