import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
import { fetchDiscounts } from "../../../api/discounts";
import { createOrder } from "../../../api/orders";
import { fetchServices } from "../../../api/services";
import { useOrderWizardStore } from "../../../order/orderWizardStore";
import OrderReviewScreen from "../OrderReviewScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const mockReplace = jest.fn();
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    replace: mockReplace,
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

jest.mock("../../../api/services", () => ({ fetchServices: jest.fn() }));
jest.mock("../../../api/discounts", () => ({ fetchDiscounts: jest.fn() }));
jest.mock("../../../api/orders", () => ({ createOrder: jest.fn() }));

const servicesMock = fetchServices as jest.MockedFunction<typeof fetchServices>;
const discountsMock = fetchDiscounts as jest.MockedFunction<
  typeof fetchDiscounts
>;
const createOrderMock = createOrder as jest.MockedFunction<typeof createOrder>;

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

const discounts = [
  {
    id: 5,
    name: "Promo",
    type: "PERCENT" as const,
    value: 10,
    active: true,
    min_order_subtotal: null,
  },
  {
    id: 6,
    name: "Minimal 100rb",
    type: "FIXED" as const,
    value: 10000,
    active: true,
    min_order_subtotal: 100000,
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

function seedWizard() {
  useOrderWizardStore.setState({
    customer,
    items: [
      {
        id: "item-1",
        brand: "Nike",
        model: "Air Max",
        color: "",
        shoeType: "Sneakers",
        customerNote: "",
        serviceIds: [1, 2],
      },
    ],
    discountId: null,
    idempotencyKey: null,
  });
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <OrderReviewScreen />
    </QueryClientProvider>
  );
}

describe("OrderReviewScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    servicesMock.mockResolvedValue(services);
    discountsMock.mockResolvedValue(discounts);
  });

  it("applies a selected discount to the totals", async () => {
    seedWizard();
    await renderScreen();

    await fireEvent.press(await screen.findByLabelText("Diskon Promo"));

    expect(screen.getByText("-Rp6.000")).toBeTruthy();
    expect(screen.getByText("Rp54.000")).toBeTruthy();
  });

  it("disables discounts below their minimum subtotal", async () => {
    seedWizard();
    await renderScreen();

    const blocked = await screen.findByLabelText("Diskon Minimal 100rb");
    expect(blocked.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("creates the order with an idempotency key and resets the wizard", async () => {
    seedWizard();
    createOrderMock.mockResolvedValue({
      id: 9,
      order_number: "ORD-20260914-0001",
      customer_id: 3,
      customer,
      status: "RECEIVED",
      payment_status: "UNPAID",
      subtotal: 60000,
      discount_id: null,
      discount_value: 0,
      grand_total: 60000,
      paid_total: 0,
      remaining_balance: 60000,
      created_at: null,
    });

    await renderScreen();
    await fireEvent.press(
      await screen.findByRole("button", { name: "Buat Order" })
    );

    expect(createOrderMock).toHaveBeenCalledWith(
      {
        customer_id: 3,
        items: [
          {
            brand: "Nike",
            model: "Air Max",
            shoe_type: "Sneakers",
            services: [1, 2],
          },
        ],
      },
      "test-uuid"
    );
    expect(mockReplace).toHaveBeenCalledWith("OrderSuccess", {
      orderId: 9,
      orderNumber: "ORD-20260914-0001",
      customerName: "Emma",
      grandTotal: 60000,
    });
    expect(useOrderWizardStore.getState().customer).toBeNull();
    expect(useOrderWizardStore.getState().items).toHaveLength(0);
  });

  it("shows an Indonesian error when creation fails", async () => {
    seedWizard();
    createOrderMock.mockRejectedValue(new Error("network"));

    await renderScreen();
    await fireEvent.press(
      await screen.findByRole("button", { name: "Buat Order" })
    );

    expect(
      await screen.findByText("Gagal membuat order. Coba lagi.")
    ).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("prevents double submission", async () => {
    seedWizard();
    let resolveOrder: (order: Awaited<ReturnType<typeof createOrder>>) => void =
      () => {};
    createOrderMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveOrder = resolve;
        })
    );

    await renderScreen();
    const button = await screen.findByRole("button", { name: "Buat Order" });

    await fireEvent.press(button);
    await fireEvent.press(button);

    expect(createOrderMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveOrder({
        id: 9,
        order_number: "ORD-20260914-0001",
        customer_id: 3,
        status: "RECEIVED",
        payment_status: "UNPAID",
        subtotal: 60000,
        discount_id: null,
        discount_value: 0,
        grand_total: 60000,
        paid_total: 0,
        remaining_balance: 60000,
        created_at: null,
      });
    });
  });
});
