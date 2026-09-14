import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";
import { ApiError } from "../../../api/client";
import { createCustomer } from "../../../api/customers";
import CustomerFormScreen from "../CustomerFormScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: {} }),
}));

jest.mock("../../../api/customers", () => {
  const actual = jest.requireActual("../../../api/customers");
  return {
    ...actual,
    createCustomer: jest.fn(),
  };
});

const createMock = createCustomer as jest.MockedFunction<typeof createCustomer>;

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CustomerFormScreen />
    </QueryClientProvider>
  );
}

async function fillAndSubmit(name: string, phone: string) {
  await fireEvent.changeText(
    screen.getByPlaceholderText("cth: Budi Santoso"),
    name
  );
  await fireEvent.changeText(
    screen.getByPlaceholderText("cth: 0812-3456-7890"),
    phone
  );
  await fireEvent.press(screen.getByRole("button", { name: "Simpan" }));
}

describe("CustomerFormScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows Indonesian validation errors on empty submit", async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Nama wajib diisi.")).toBeTruthy();
    expect(await screen.findByText("Nomor telepon wajib diisi.")).toBeTruthy();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid phone number", async () => {
    await renderScreen();

    await fillAndSubmit("Budi", "021-555");

    expect(
      await screen.findByText(
        "Nomor tidak valid. Gunakan format Indonesia (cth: 0812…)."
      )
    ).toBeTruthy();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("previews the normalized phone", async () => {
    await renderScreen();

    await fireEvent.changeText(
      screen.getByPlaceholderText("cth: 0812-3456-7890"),
      "0812-3456-7890"
    );

    expect(await screen.findByText("Nomor tersimpan: +6281234567890")).toBeTruthy();
  });

  it("creates the customer and returns to the list", async () => {
    createMock.mockResolvedValue({
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
    });

    await renderScreen();
    await fillAndSubmit("Budi", "0812-3456-7890");

    expect(createMock).toHaveBeenCalledWith({
      name: "Budi",
      phone: "6281234567890",
    });
    expect(mockNavigate).toHaveBeenCalledWith("Customers", {
      created: "Budi",
      search: "6281234567890",
    });
  });

  it("offers the existing customer on a 409 duplicate", async () => {
    createMock.mockRejectedValue(
      new ApiError("Customer with this phone number already exists.", 409, {}, {
        data: {
          customer: {
            id: 7,
            name: "Budi Lama",
            phone: "6281234567890",
            phone_display: "+6281234567890",
          },
        },
      })
    );

    await renderScreen();
    await fillAndSubmit("Budi", "0812-3456-7890");

    expect(await screen.findByText("Nomor sudah terdaftar")).toBeTruthy();
    expect(screen.getByText("Budi Lama · +6281234567890")).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("button", { name: "Cari pelanggan ini" })
    );

    expect(mockNavigate).toHaveBeenCalledWith("Customers", {
      search: "6281234567890",
    });
  });
});
