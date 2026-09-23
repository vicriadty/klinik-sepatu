import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { searchCustomers, type ApiCustomer } from "../../../api/customers";
import CustomersScreen from "../CustomersScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const mockNavigate = jest.fn();
const mockSetParams = jest.fn();
const mockSetOptions = jest.fn();
let mockSelectMode = false;

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    setParams: mockSetParams,
    setOptions: mockSetOptions,
  }),
  useRoute: () => ({ params: mockSelectMode ? { select: true } : {} }),
}));

jest.mock("../../../api/customers", () => ({
  searchCustomers: jest.fn(),
}));

const searchMock = searchCustomers as jest.MockedFunction<
  typeof searchCustomers
>;

function makeCustomer(overrides: Partial<ApiCustomer> = {}): ApiCustomer {
  return {
    id: 1,
    name: "Budi",
    phone: "6281234567890",
    phone_display: "+6281234567890",
    email: null,
    address: null,
    notes: null,
    wa_opt_out: false,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

function pageOf(customers: ApiCustomer[], lastPage = 1) {
  return {
    data: customers,
    meta: {
      page: 1,
      per_page: 20,
      total: customers.length,
      last_page: lastPage,
    },
  };
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CustomersScreen />
    </QueryClientProvider>
  );
}

describe("CustomersScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectMode = false;
  });

  it("lists customers returned by the API", async () => {
    searchMock.mockResolvedValue(
      pageOf([
        makeCustomer({ name: "Budi Santoso" }),
      ])
    );

    await renderScreen();

    expect(await screen.findByText("Budi Santoso")).toBeTruthy();
    expect(screen.getByText("+6281234567890")).toBeTruthy();
  });

  it("shows an empty state when nothing matches", async () => {
    searchMock.mockResolvedValue(pageOf([]));

    await renderScreen();

    expect(await screen.findByText("Pelanggan tidak ditemukan.")).toBeTruthy();
  });

  it("debounces typing into the search query", async () => {
    searchMock.mockResolvedValue(pageOf([]));

    await renderScreen();
    await fireEvent.changeText(
      screen.getByLabelText("Cari pelanggan"),
      "budi"
    );

    await waitFor(
      () =>
        expect(searchMock).toHaveBeenCalledWith(
          expect.objectContaining({ search: "budi" })
        ),
      { timeout: 2000 }
    );
  });

  it("opens the create form from the header action", async () => {
    searchMock.mockResolvedValue(pageOf([]));

    await renderScreen();
    await fireEvent.press(
      screen.getByRole("button", { name: "Tambah Pelanggan" })
    );

    expect(mockNavigate).toHaveBeenCalledWith("CustomerForm");
  });

  it("keeps order selection mode when creating a customer", async () => {
    mockSelectMode = true;
    searchMock.mockResolvedValue(pageOf([]));

    await renderScreen();
    await fireEvent.press(
      screen.getByRole("button", { name: "Tambah Pelanggan" })
    );

    expect(mockNavigate).toHaveBeenCalledWith("CustomerForm", { select: true });
  });
});
