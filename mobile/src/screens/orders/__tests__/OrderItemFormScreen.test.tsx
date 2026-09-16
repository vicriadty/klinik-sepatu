import { fireEvent, render, screen } from "@testing-library/react-native";
import { useOrderWizardStore } from "../../../order/orderWizardStore";
import OrderItemFormScreen from "../OrderItemFormScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack, setOptions: mockSetOptions }),
  useRoute: () => ({ params: {} }),
}));

function renderScreen() {
  return render(<OrderItemFormScreen />);
}

describe("OrderItemFormScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOrderWizardStore.setState({
      customer: null,
      items: [],
      discountId: null,
      idempotencyKey: null,
    });
  });

  it("shows Indonesian validation errors on empty submit", async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Merek wajib diisi.")).toBeTruthy();
    expect(await screen.findByText("Jenis sepatu wajib diisi.")).toBeTruthy();
    expect(useOrderWizardStore.getState().items).toHaveLength(0);
  });

  it("adds the shoe to the wizard and returns", async () => {
    await renderScreen();

    await fireEvent.changeText(screen.getByPlaceholderText("cth: Nike"), "Nike");
    await fireEvent.changeText(
      screen.getByPlaceholderText("cth: Air Max 90"),
      "Air Max"
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("cth: Sneakers"),
      "Sneakers"
    );
    await fireEvent.press(screen.getByRole("button", { name: "Simpan" }));

    const items = useOrderWizardStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      brand: "Nike",
      model: "Air Max",
      shoeType: "Sneakers",
      serviceIds: [],
    });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
