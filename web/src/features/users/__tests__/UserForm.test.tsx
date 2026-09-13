import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserForm from "../UserForm";

function renderCreate(props?: Partial<React.ComponentProps<typeof UserForm>>) {
  const onSubmit = vi.fn();
  const utils = render(
    <UserForm
      mode="create"
      initial={{ name: "", email: "", role: "cashier" }}
      roles={["owner", "admin", "cashier"]}
      pending={false}
      submitLabel="Tambah"
      submitError={null}
      onSubmit={onSubmit}
      {...props}
    />
  );
  return { ...utils, onSubmit };
}

describe("UserForm", () => {
  it("shows validation errors on empty submit", async () => {
    const { getByText } = renderCreate();

    await userEvent.click(getByText("Tambah"));

    expect(await getByText("Nama wajib diisi.")).toBeInTheDocument();
    expect(getByText("Username wajib diisi.")).toBeInTheDocument();
  });

  it("renders only the allowed roles", () => {
    const { queryByText, getByText } = renderCreate({
      roles: ["admin", "cashier"],
    });

    expect(getByText("Admin")).toBeInTheDocument();
    expect(queryByText("Owner")).toBeNull();
  });

  it("submits valid values in edit mode without username", async () => {
    const onSubmit = vi.fn();
    const { getByLabelText, getByText, queryByText } = render(
      <UserForm
        mode="edit"
        initial={{ name: "Budi", email: "", role: "cashier" }}
        roles={["owner", "admin", "cashier"]}
        pending={false}
        submitLabel="Simpan Perubahan"
        submitError={null}
        onSubmit={onSubmit}
      />
    );

    expect(queryByText(/Username/)).toBeNull();

    await userEvent.type(getByLabelText(/Nama/), " Santoso");
    await userEvent.click(getByText("Simpan Perubahan"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ name: "Budi Santoso" });
  });
});
