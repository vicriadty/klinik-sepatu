import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmModal from "../../common/ConfirmModal";
import ActionAlert from "../../common/ActionAlert";

describe("ConfirmModal", () => {
  it("renders nothing when closed", () => {
    const { queryByText } = render(
      <ConfirmModal
        isOpen={false}
        title="Hapus?"
        message="Yakin?"
        onConfirm={() => {}}
        onClose={() => {}}
      />
    );
    expect(queryByText("Hapus?")).toBeNull();
  });

  it("confirms and cancels", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const { getByText } = render(
      <ConfirmModal
        isOpen={true}
        title="Hapus?"
        message="Yakin?"
        confirmLabel="Ya, hapus"
        danger
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );

    await userEvent.click(getByText("Ya, hapus"));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await userEvent.click(getByText("Batal"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        title="Hapus?"
        message="Yakin?"
        onConfirm={() => {}}
        onClose={onClose}
      />
    );

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});

describe("ActionAlert", () => {
  it("renders the message and dismisses", async () => {
    const onClose = vi.fn();
    const { getByText, getByRole } = render(
      <ActionAlert
        variant="success"
        title="Berhasil"
        message="Data tersimpan."
        onClose={onClose}
      />
    );

    expect(getByText("Data tersimpan.")).toBeInTheDocument();

    await userEvent.click(getByRole("button", { name: "Tutup notifikasi" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
