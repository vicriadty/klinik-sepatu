import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { fetchOrders, type ApiOrder } from "../../../api/orders";
import OrdersScreen from "../OrdersScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("../../../api/orders", () => {
  const actual = jest.requireActual("../../../api/orders");
  return { ...actual, fetchOrders: jest.fn() };
});

const fetchOrdersMock = fetchOrders as jest.MockedFunction<typeof fetchOrders>;

function makeOrder(overrides: Partial<ApiOrder> = {}): ApiOrder {
  return {
    id: 9,
    order_number: "ORD-20260914-0001",
    customer_id: 3,
    customer: {
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
    },
    items_count: 2,
    status: "RECEIVED",
    payment_status: "UNPAID",
    subtotal: 108000,
    discount_id: null,
    discount_value: 0,
    grand_total: 108000,
    paid_total: 0,
    remaining_balance: 108000,
    created_at: new Date(2026, 8, 14, 9, 30).toISOString(),
    ...overrides,
  };
}

function pageOf(orders: ApiOrder[]) {
  return {
    data: orders,
    meta: { page: 1, per_page: 15, total: orders.length, last_page: 1 },
  };
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <OrdersScreen />
    </QueryClientProvider>
  );
}

describe("OrdersScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchOrdersMock.mockResolvedValue(pageOf([makeOrder()]));
  });

  it("renders order rows with status and payment pills", async () => {
    await renderScreen();

    expect(await screen.findByText("ORD-20260914-0001")).toBeTruthy();
    expect(screen.getByText("Emma · 2 sepatu")).toBeTruthy();
    expect(screen.getByText("Rp 108.000")).toBeTruthy();
    expect(screen.getByText("DITERIMA")).toBeTruthy();
    expect(screen.getByText("BELUM DIBAYAR")).toBeTruthy();
  });

  it("filters by status and payment status", async () => {
    await renderScreen();
    await screen.findByText("ORD-20260914-0001");

    await fireEvent.press(screen.getByLabelText("Status"));
    await fireEvent.press(screen.getByLabelText("Diproses"));
    await waitFor(() =>
      expect(fetchOrdersMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: "ON_PROCESS" })
      )
    );

    await fireEvent.press(screen.getByLabelText("Pembayaran"));
    await fireEvent.press(screen.getByLabelText("Lunas"));
    await waitFor(() =>
      expect(fetchOrdersMock).toHaveBeenCalledWith(
        expect.objectContaining({ payment_status: "PAID" })
      )
    );
  });

  it("opens the detail screen from a row", async () => {
    await renderScreen();

    await fireEvent.press(
      await screen.findByLabelText("Order ORD-20260914-0001")
    );

    expect(mockNavigate).toHaveBeenCalledWith("OrderDetail", { orderId: 9 });
  });

  it("shows an empty state", async () => {
    fetchOrdersMock.mockResolvedValue(pageOf([]));

    await renderScreen();

    expect(await screen.findByText("Belum ada order.")).toBeTruthy();
  });
});
