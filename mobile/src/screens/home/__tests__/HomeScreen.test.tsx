import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react-native";
import { fetchDashboardSummary } from "../../../api/dashboard";
import { fetchOrders } from "../../../api/orders";
import HomeScreen from "../HomeScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock("../../../api/dashboard", () => ({
  fetchDashboardSummary: jest.fn(),
}));

jest.mock("../../../api/orders", () => ({
  ...jest.requireActual("../../../api/orders"),
  fetchOrders: jest.fn(),
}));

const summaryMock = fetchDashboardSummary as jest.MockedFunction<
  typeof fetchDashboardSummary
>;
const ordersMock = fetchOrders as jest.MockedFunction<typeof fetchOrders>;

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <HomeScreen />
    </QueryClientProvider>
  );
}

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ordersMock.mockResolvedValue({
      data: [],
      meta: { page: 1, per_page: 2, total: 0, last_page: 1 },
    });
  });

  it("shows operational counts without revenue for cashiers", async () => {
    summaryMock.mockResolvedValue({
      orders_today: 3,
      in_progress: 1,
      ready_for_pickup: 2,
      outstanding_payment: 54000,
    });

    await renderScreen();

    expect(await screen.findByText("Pesanan hari ini")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("Siap diambil")).toBeTruthy();
    expect(screen.getByText("Rp 54.000")).toBeTruthy();
    expect(screen.queryByText("Pendapatan hari ini")).toBeNull();
  });

  it("shows revenue for owner/admin responses", async () => {
    summaryMock.mockResolvedValue({
      revenue_today: 150000,
      orders_today: 1,
      in_progress: 0,
      ready_for_pickup: 0,
      outstanding_payment: 0,
    });

    await renderScreen();

    expect(await screen.findByText("Pendapatan hari ini")).toBeTruthy();
    expect(screen.getByText("Rp 150.000")).toBeTruthy();
  });

  it("shows an error state when the summary fails", async () => {
    summaryMock.mockRejectedValue(new Error("network"));

    await renderScreen();

    expect(await screen.findByText("Gagal memuat ringkasan.")).toBeTruthy();
  });
});
