import { describe, expect, it, vi } from "vitest";
import { findByText, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import ServiceFormPage from "../ServiceFormPage";

vi.mock("../../../services/serviceApi", () => ({
  fetchCategories: vi.fn(async () => [{ id: 1, name: "Cleaning" }]),
  fetchService: vi.fn(async () => ({
    id: 1,
    name: "Deep Clean",
    category_id: 1,
    category: { id: 1, name: "Cleaning" },
    description: null,
    price: 35000,
    estimated_duration_days: 2,
    active: true,
    created_at: "",
    updated_at: "x",
  })),
  createService: vi.fn(),
  updateService: vi.fn(),
}));

function renderAt(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/services/new" element={<ServiceFormPage />} />
          <Route path="/services/:id/edit" element={<ServiceFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ServiceFormPage", () => {
  it("shows validation errors on empty submit", async () => {
    const { getByText } = renderAt("/services/new");

    await userEvent.click(getByText("Tambah"));

    expect(
      await findByText(document.body, "Nama layanan wajib diisi.")
    ).toBeInTheDocument();
    expect(getByText("Kategori wajib dipilih.")).toBeInTheDocument();
  });

  it("warns that price changes apply to new orders only", async () => {
    const { getByLabelText, queryByText, findByText } = renderAt("/services/1/edit");

    expect(await findByText("Ubah Layanan")).toBeInTheDocument();
    expect(queryByText(/hanya berlaku untuk order baru/)).toBeNull();

    const priceInput = getByLabelText(/Harga/);
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, "40000");

    expect(
      await findByText(/hanya berlaku untuk order baru/)
    ).toBeInTheDocument();
  });
});
