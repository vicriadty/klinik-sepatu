import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import SettingsPage from "../SettingsPage";

vi.mock("../../../services/settingsApi", () => ({
  fetchSettings: vi.fn(async () => ({
    settings: {
      store_name: "Klinik Sepatu",
      store_phone: null,
      store_address: null,
      receipt_footer: null,
      timezone: "Asia/Jakarta",
    },
    notifications: {
      whatsapp: {
        enabled: false,
        configured: false,
        last_24h: { sent: 3, failed: 1 },
      },
    },
  })),
  updateSettings: vi.fn(),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/settings"]}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SettingsPage", () => {
  it("renders stored values and notification health", async () => {
    const { getByText, findByText, findByDisplayValue } = renderPage();

    expect(await findByText("Pengaturan")).toBeInTheDocument();
    expect(await findByDisplayValue("Klinik Sepatu")).toBeInTheDocument();
    expect(getByText("Mati")).toBeInTheDocument();
    expect(getByText("Belum dikonfigurasi")).toBeInTheDocument();
  });

  it("shows validation errors on empty store name", async () => {
    const { getByLabelText, getByText, findByText } = renderPage();

    await findByText("Simpan Pengaturan");

    const nameInput = getByLabelText(/Nama toko/);
    await userEvent.clear(nameInput);
    await userEvent.click(getByText("Simpan Pengaturan"));

    expect(await findByText("Nama toko wajib diisi.")).toBeInTheDocument();
  });
});
