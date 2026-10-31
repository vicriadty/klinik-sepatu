import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react-native";
import { fetchOrders, type ApiOrder } from "../../../api/orders";
import HistoryScreen from "../HistoryScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock("../../../api/orders", () => {
  const actual = jest.requireActual("../../../api/orders");
  return { ...actual, fetchOrders: jest.fn() };
});

const fetchOrdersMock = fetchOrders as jest.MockedFunction<typeof fetchOrders>;

function makeOrder(status: ApiOrder["status"], id: number): ApiOrder {
  return {
    id,
    order_number: `ORD-${id}`,
    customer_id: 1,
    customer: {
      id: 1,
      name: status === "COMPLETED" ? "Sinta" : "Bima",
      phone: "628123456789",
      phone_display: "+628123456789",
      email: null,
      address: null,
      notes: null,
      wa_opt_out: false,
      created_at: null,
      updated_at: null,
    },
    items_count: 1,
    status,
    payment_status: "PAID",
    subtotal: 100000,
    discount_id: null,
    discount_value: 0,
    grand_total: 100000,
    paid_total: 100000,
    remaining_balance: 0,
    created_at: new Date(2026, 8, id).toISOString(),
  };
}

function pageOf(data: ApiOrder[]) {
  return {
    data,
    meta: { page: 1, per_page: 50, total: data.length, last_page: 1 },
  };
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <HistoryScreen />
    </QueryClientProvider>
  );
}

describe("HistoryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchOrdersMock.mockImplementation(async (params = {}) => {
      const status = params.status;
      return pageOf([
        makeOrder(status ?? "COMPLETED", status === "COMPLETED" ? 1 : 2),
      ]);
    });
  });

  it("shows completed and cancelled orders", async () => {
    await renderScreen();

    expect(await screen.findByText("ORD-1")).toBeTruthy();
    expect(screen.getByText("ORD-2")).toBeTruthy();
    expect(fetchOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "COMPLETED" })
    );
    expect(fetchOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "CANCELLED" })
    );
  });
});
