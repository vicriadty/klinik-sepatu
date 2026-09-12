import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KpiCard from "../components/KpiCard";
import QueryState from "../components/QueryState";
import PeriodFilter from "../components/PeriodFilter";
import type { PeriodFilter as PeriodFilterValue } from "../period";

describe("KpiCard", () => {
  it("renders the label and value", () => {
    const { getByText } = render(
      <KpiCard label="Revenue hari ini" value="Rp1.350.000" icon={<span />} />
    );
    expect(getByText("Revenue hari ini")).toBeInTheDocument();
    expect(getByText("Rp1.350.000")).toBeInTheDocument();
  });
});

describe("QueryState", () => {
  it("shows loading, error with retry, and empty states", async () => {
    const onRetry = vi.fn();
    const { rerender, getByText, queryByText } = render(
      <QueryState
        isLoading={true}
        isError={false}
        isEmpty={false}
        emptyText="Kosong."
        onRetry={onRetry}
      >
        <div>Konten</div>
      </QueryState>
    );
    expect(getByText("Memuat…")).toBeInTheDocument();

    rerender(
      <QueryState
        isLoading={false}
        isError={true}
        isEmpty={false}
        emptyText="Kosong."
        onRetry={onRetry}
      >
        <div>Konten</div>
      </QueryState>
    );
    await userEvent.click(getByText("Coba lagi"));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(
      <QueryState
        isLoading={false}
        isError={false}
        isEmpty={true}
        emptyText="Kosong."
        onRetry={onRetry}
      >
        <div>Konten</div>
      </QueryState>
    );
    expect(getByText("Kosong.")).toBeInTheDocument();
    expect(queryByText("Konten")).not.toBeInTheDocument();
  });
});

describe("PeriodFilter", () => {
  const base: PeriodFilterValue = { preset: "30d" };

  it("emits preset changes and reveals date inputs for custom", async () => {
    const onChange = vi.fn();
    const { getByText, rerender, getByLabelText } = render(
      <PeriodFilter value={base} onChange={onChange} />
    );

    await userEvent.click(getByText("7 hari"));
    expect(onChange).toHaveBeenCalledWith({ preset: "7d" });

    rerender(<PeriodFilter value={{ preset: "custom" }} onChange={onChange} />);
    expect(getByLabelText("Tanggal mulai")).toBeInTheDocument();
    expect(getByLabelText("Tanggal selesai")).toBeInTheDocument();
  });
});
