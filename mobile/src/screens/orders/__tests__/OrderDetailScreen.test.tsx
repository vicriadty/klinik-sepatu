import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "react-native";
import {
  cancelOrder,
  fetchOrder,
  recordPayment,
  transitionOrder,
  type ApiOrder,
} from "../../../api/orders";
import { useAuthStore } from "../../../auth/useAuthStore";
import OrderDetailScreen from "../OrderDetailScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: { orderId: 9 } }),
}));

function setRole(role: "owner" | "admin" | "cashier") {
  useAuthStore.setState({
    status: "signedIn",
    user: {
      id: 1,
      name: role === "cashier" ? "Kasir" : "Owner",
      username: role,
      email: null,
      role,
      is_active: true,
      last_login_at: null,
      created_at: null,
      updated_at: null,
    } as never,
  });
}

jest.mock("../../../api/orders", () => {
  const actual = jest.requireActual("../../../api/orders");
  return {
    ...actual,
    fetchOrder: jest.fn(),
    transitionOrder: jest.fn(),
    cancelOrder: jest.fn(),
    recordPayment: jest.fn(),
  };
});

const fetchOrderMock = fetchOrder as jest.MockedFunction<typeof fetchOrder>;
const transitionMock = transitionOrder as jest.MockedFunction<
  typeof transitionOrder
>;
const cancelMock = cancelOrder as jest.MockedFunction<typeof cancelOrder>;
const recordPaymentMock = recordPayment as jest.MockedFunction<
  typeof recordPayment
>;

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
    items: [
      {
        id: 101,
        brand: "Nike",
        model: "Air Max",
        color: "Putih",
        shoe_type: "Sneakers",
        customer_note: null,
        item_subtotal: 60000,
        services: [
          { service_id: 1, service_name: "Fast Clean", unit_price: 25000 },
          { service_id: 2, service_name: "Deep Clean", unit_price: 35000 },
        ],
        photos: [
          {
            id: 5,
            order_item_id: 101,
            type: "BEFORE",
            url: "http://localhost:9000/klinik-sepatu/photos/a.jpg",
            thumbnail_url:
              "http://localhost:9000/klinik-sepatu/thumbs/a.jpg",
            mime: "image/jpeg",
            size: 1000,
            created_at: null,
          },
        ],
      },
    ],
    status: "RECEIVED",
    payment_status: "UNPAID",
    subtotal: 60000,
    discount_id: null,
    discount_value: 0,
    grand_total: 60000,
    paid_total: 0,
    remaining_balance: 60000,
    payments: [],
    status_histories: [
      {
        from_status: null,
        to_status: "RECEIVED",
        actor_user_id: 1,
        note: null,
        created_at: new Date(2026, 8, 14, 9, 30).toISOString(),
      },
    ],
    created_at: new Date(2026, 8, 14, 9, 30).toISOString(),
    ...overrides,
  };
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
      <OrderDetailScreen />
    </QueryClientProvider>
  );
}

describe("OrderDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setRole("owner");
    fetchOrderMock.mockResolvedValue(makeOrder());
    transitionMock.mockResolvedValue(makeOrder({ status: "ON_PROCESS" }));
    cancelMock.mockResolvedValue(makeOrder({ status: "CANCELLED" }));
  });

  it("renders items, services, totals and status history", async () => {
    await renderScreen();

    expect(await screen.findByText("ORD-20260914-0001")).toBeTruthy();
    expect(screen.getByText("Emma")).toBeTruthy();
    expect(screen.getByText("#1 Nike Air Max")).toBeTruthy();
    expect(screen.getByText("Fast Clean")).toBeTruthy();
    expect(screen.getByText("Grand total")).toBeTruthy();
    expect(screen.getByText("Riwayat status")).toBeTruthy();
    expect(screen.getAllByText("Diterima")).toHaveLength(2);
  });

  it("runs a legal status transition", async () => {
    await renderScreen();

    await fireEvent.press(
      await screen.findByRole("button", { name: "Mulai Proses" })
    );

    expect(transitionMock).toHaveBeenCalledWith(9, "ON_PROCESS");
    expect(
      await screen.findByText("Status diperbarui: Diproses.")
    ).toBeTruthy();
  });

  it("hides COMPLETED and explains the payment requirement", async () => {
    fetchOrderMock.mockResolvedValue(
      makeOrder({ status: "READY_FOR_PICKUP", payment_status: "UNPAID" })
    );

    await renderScreen();

    expect(
      await screen.findByText(
        "Pelunasan diperlukan sebelum order bisa diselesaikan."
      )
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Selesaikan" })).toBeNull();
  });

  it("confirms before cancelling", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation(() => undefined);

    await renderScreen();
    await fireEvent.press(
      await screen.findByRole("button", { name: "Batalkan" })
    );

    expect(alertSpy).toHaveBeenCalled();

    const buttons = (
      alertSpy.mock.calls[0] as unknown as [
        string,
        string,
        { text: string; onPress?: () => void }[],
      ]
    )[2];
    const confirm = buttons.find((button) => button.text === "Ya, batalkan");

    await act(async () => {
      confirm?.onPress?.();
    });

    expect(cancelMock).toHaveBeenCalledWith(9);

    alertSpy.mockRestore();
  });

  it("blocks the refund form for cashiers", async () => {
    setRole("cashier");
    fetchOrderMock.mockResolvedValue(
      makeOrder({ payment_status: "PARTIAL", paid_total: 25000 })
    );

    await renderScreen();
    await screen.findByText("ORD-20260914-0001");

    expect(screen.queryByRole("button", { name: "Catat Refund" })).toBeNull();
    expect(
      screen.getByText("Refund diperlukan sebelum order berbayar bisa dibatalkan.")
    ).toBeTruthy();
  });

  it("records a full refund for owners", async () => {
    fetchOrderMock.mockResolvedValue(
      makeOrder({ payment_status: "PARTIAL", paid_total: 25000 })
    );
    recordPaymentMock.mockResolvedValue({
      id: 7,
      order_id: 9,
      type: "refund",
      method: "CASH",
      amount: 25000,
      note: null,
      receiver: null,
      created_at: null,
    });

    await renderScreen();
    await fireEvent.press(
      await screen.findByRole("button", { name: "Catat Refund" })
    );

    expect(recordPaymentMock).toHaveBeenCalledWith(
      9,
      { type: "refund", method: "CASH", amount: 25000 },
      "test-uuid"
    );
    await waitFor(() =>
      expect(screen.getByText("Refund Rp25.000 tercatat.")).toBeTruthy()
    );
  });
});
