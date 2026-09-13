import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DateField from "../DateField";

describe("DateField", () => {
  it("renders the value and clears it on demand", async () => {
    const onChange = vi.fn();
    const { getByLabelText, getByRole, queryByRole, rerender } = render(
      <DateField
        id="probe-date"
        label="Tanggal"
        value="2026-09-12"
        onChange={onChange}
      />
    );

    expect(getByLabelText("Tanggal")).toBeInTheDocument();
    expect(
      (getByLabelText("Tanggal") as HTMLInputElement).value
    ).toBe("2026-09-12");

    await userEvent.click(getByRole("button", { name: "Hapus tanggal" }));
    expect(onChange).toHaveBeenCalledWith("");

    rerender(
      <DateField id="probe-date" label="Tanggal" value="" onChange={onChange} />
    );
    expect(
      queryByRole("button", { name: "Hapus tanggal" })
    ).toBeNull();
  });
});
