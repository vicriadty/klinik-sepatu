import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ServiceForm, { BLANK_SERVICE_FORM } from "../ServiceForm";

const CATEGORIES = [{ id: 1, name: "Cleaning" }];

function renderForm(props?: Partial<React.ComponentProps<typeof ServiceForm>>) {
  const onSubmit = vi.fn();
  const utils = render(
    <ServiceForm
      initial={BLANK_SERVICE_FORM}
      categories={CATEGORIES}
      pending={false}
      submitLabel="Tambah"
      submitError={null}
      onSubmit={onSubmit}
      {...props}
    />
  );
  return { ...utils, onSubmit };
}

describe("ServiceForm", () => {
  it("shows validation errors on empty submit", async () => {
    const { getByText } = renderForm();

    await userEvent.click(getByText("Tambah"));

    expect(await getByText("Nama layanan wajib diisi.")).toBeInTheDocument();
  });

  it("submits valid values", async () => {
    const { getByLabelText, getByText, onSubmit } = renderForm();

    await userEvent.type(getByLabelText(/Nama layanan/), "Deep Clean");
    await userEvent.selectOptions(getByLabelText(/Kategori/), "1");
    await userEvent.clear(getByLabelText(/Harga/));
    await userEvent.type(getByLabelText(/Harga/), "35000");
    await userEvent.click(getByText("Tambah"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      name: "Deep Clean",
      category_id: 1,
      price: 35000,
    });
  });

  it("warns only when the price differs from the original", async () => {
    const { getByLabelText, getByText, queryByText } = renderForm({
      initial: { ...BLANK_SERVICE_FORM, price: 25000 },
      originalPrice: 25000,
    });

    expect(queryByText(/hanya berlaku untuk order baru/)).toBeNull();

    const priceInput = getByLabelText(/Harga/);
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, "30000");

    expect(
      await getByText(/hanya berlaku untuk order baru/)
    ).toBeInTheDocument();
  });
});
