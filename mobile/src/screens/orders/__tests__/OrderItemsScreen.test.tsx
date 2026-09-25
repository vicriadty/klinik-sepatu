import { fireEvent, render, screen } from "@testing-library/react-native";
import { useOrderWizardStore } from "../../../order/orderWizardStore";
import OrderItemsScreen from "../OrderItemsScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

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
  return render(<OrderItemsScreen />);
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
  });

  it("lists shoe details and preserves the selected customer", async () => {
    useOrderWizardStore.getState().setCustomer(customer);
    seedItem([]);

    await renderScreen();

    expect(screen.getByText("Sepatu 1")).toBeTruthy();
    expect(screen.getByText("Emma")).toBeTruthy();
    expect(screen.getByText("Nike")).toBeTruthy();
    expect(screen.getByText("Air Max")).toBeTruthy();
    expect(screen.getByText("Putih")).toBeTruthy();
    expect(screen.getByText("Sneakers")).toBeTruthy();
    expect(screen.getByText("• 1 item")).toBeTruthy();
  });

  it("disables continuation when no shoes have been added", async () => {
    await renderScreen();

    const button = screen.getByRole("button", {
      name: "Lanjut: pilih layanan",
    });

    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it("continues to the first incomplete shoe service picker", async () => {
    useOrderWizardStore.getState().setCustomer(customer);
    const itemId = seedItem([]);

    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Lanjut: pilih layanan" })
    );

    expect(mockNavigate).toHaveBeenCalledWith("OrderItemServices", { itemId });
  });

  it("navigates to review when every item is ready", async () => {
    useOrderWizardStore.getState().setCustomer(customer);
    seedItem([1]);

    await renderScreen();
    await fireEvent.press(
      screen.getByRole("button", { name: "Lanjut: pilih layanan" })
    );

    expect(mockNavigate).toHaveBeenCalledWith("OrderReview");
  });

  it("opens the shoe form and the service picker", async () => {
    useOrderWizardStore.getState().setCustomer(customer);
    const itemId = seedItem([1]);

    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Ubah pelanggan Emma" })
    );
    expect(mockNavigate).toHaveBeenCalledWith("OrderCustomer");

    await fireEvent.press(
      screen.getByRole("button", { name: "Tambah sepatu" })
    );
    expect(mockNavigate).toHaveBeenCalledWith("OrderItemForm");

    await fireEvent.press(screen.getByLabelText("Atur layanan Nike Air Max"));
    expect(mockNavigate).toHaveBeenCalledWith("OrderItemServices", {
      itemId,
    });
  });
});
