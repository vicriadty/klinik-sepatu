import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
import { fetchOrder, recordPayment, type ApiOrder } from "../../../api/orders";
import OrderPaymentScreen from "../OrderPaymentScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: { orderId: 9 } }),
}));

jest.mock("../../../api/orders", () => {
  const actual = jest.requireActual("../../../api/orders");
  return {
    ...actual,
    fetchOrder: jest.fn(),
    recordPayment: jest.fn(),
  };
});

const fetchOrderMock = fetchOrder as jest.MockedFunction<typeof fetchOrder>;
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
    status: "RECEIVED",
    payment_status: "UNPAID",
    subtotal: 54000,
    discount_id: null,
    discount_value: 0,
    grand_total: 54000,
    paid_total: 0,
    remaining_balance: 54000,
    payments: [],
    created_at: null,
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
      <OrderPaymentScreen />
    </QueryClientProvider>
  );
}

describe("OrderPaymentScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchOrderMock.mockResolvedValue(makeOrder());
  });

  it("shows the server-derived balance and defaults the amount", async () => {
    await renderScreen();

    expect(await screen.findByText("Rp 54.000")).toBeTruthy();
    expect(await screen.findByText("BELUM DIBAYAR")).toBeTruthy();
    expect((await screen.findByPlaceholderText("0")).props.value).toBe(
      "Rp 54.000"
    );
  });

  it("records a payment with the selected method", async () => {
    recordPaymentMock.mockResolvedValue({
      id: 5,
      order_id: 9,
      type: "payment",
      method: "TRANSFER",
      amount: 54000,
      note: null,
      receiver: null,
      created_at: null,
    });

    await renderScreen();
    await fireEvent.press(
      await screen.findByLabelText("Metode Transfer")
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Catat Pembayaran" })
    );

    expect(recordPaymentMock).toHaveBeenCalledWith(
      9,
      { method: "TRANSFER", amount: 54000 },
      "test-uuid"
    );
    expect(
      await screen.findByText("Pembayaran Rp54.000 tercatat.")
    ).toBeTruthy();
  });

  it("shows QRIS verification instructions", async () => {
    await renderScreen();

    await fireEvent.press(await screen.findByLabelText("Metode QRIS"));

    expect(
      screen.getByText(
        "Minta pelanggan scan QRIS statis, lalu cek aplikasi acquirer."
      )
    ).toBeTruthy();
  });

  it("blocks amounts above the remaining balance", async () => {
    await renderScreen();

    await fireEvent.changeText(
      await screen.findByPlaceholderText("0"),
      "60000"
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Catat Pembayaran" })
    );

    expect(
      await screen.findByText("Jumlah melebihi sisa tagihan.")
    ).toBeTruthy();
    expect(recordPaymentMock).not.toHaveBeenCalled();
  });

  it("shows the paid state and finishes to home", async () => {
    fetchOrderMock.mockResolvedValue(
      makeOrder({
        payment_status: "PAID",
        paid_total: 54000,
        remaining_balance: 0,
      })
    );

    await renderScreen();

    expect(await screen.findByText("Order lunas")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Selesai" }));

    expect(mockNavigate).toHaveBeenCalledWith("Home");
  });

  it("prevents double submission", async () => {
    let resolvePayment: (payment: Awaited<ReturnType<typeof recordPayment>>) => void =
      () => {};
    recordPaymentMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePayment = resolve;
        })
    );

    await renderScreen();
    const button = await screen.findByRole("button", {
      name: "Catat Pembayaran",
    });

    await fireEvent.press(button);
    await fireEvent.press(button);

    expect(recordPaymentMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePayment({
        id: 5,
        order_id: 9,
        type: "payment",
        method: "CASH",
        amount: 54000,
        note: null,
        receiver: null,
        created_at: null,
      });
    });
  });
});
