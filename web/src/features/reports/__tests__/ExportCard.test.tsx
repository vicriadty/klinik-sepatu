import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExportCard from "../components/ExportCard";

describe("ExportCard", () => {
  it("shows progress states without a download action", () => {
    const { getByText, queryByText, rerender } = render(
      <ExportCard
        status="PROCESSING"
        error={null}
        downloading={false}
        onDownload={() => {}}
      />
    );
    expect(getByText("Diproses")).toBeInTheDocument();
    expect(queryByText("Download Excel")).not.toBeInTheDocument();

    rerender(
      <ExportCard
        status="PENDING"
        error={null}
        downloading={false}
        onDownload={() => {}}
      />
    );
    expect(getByText("Menunggu")).toBeInTheDocument();
  });

  it("offers download when completed", async () => {
    const onDownload = vi.fn();
    const { getByText } = render(
      <ExportCard
        status="COMPLETED"
        error={null}
        downloading={false}
        onDownload={onDownload}
      />
    );
    await userEvent.click(getByText("Download Excel"));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("shows the failure reason without a download action", () => {
    const { getByText, queryByText } = render(
      <ExportCard
        status="FAILED"
        error="Koneksi vendor terputus."
        downloading={false}
        onDownload={() => {}}
      />
    );
    expect(getByText("Gagal")).toBeInTheDocument();
    expect(getByText(/Koneksi vendor terputus/)).toBeInTheDocument();
    expect(queryByText("Download Excel")).not.toBeInTheDocument();
  });
});
