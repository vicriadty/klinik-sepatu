import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { formatIDR, formatNumberID } from "../../../utils/format";
import type { PaymentMethodStat } from "../../../services/dashboardApi";

const METHOD_COLORS = ["#465FFF", "#9CB9FF", "#12B76A", "#F79009", "#F04438"];

export default function PaymentMethodsChart({
  data,
}: {
  data: PaymentMethodStat[];
}) {
  const options: ApexOptions = {
    legend: { position: "bottom" },
    colors: METHOD_COLORS,
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
    },
    labels: data.map((row) => row.method),
    dataLabels: { enabled: false },
    tooltip: {
      y: {
        formatter: (value: number, opts?: { seriesIndex?: number }) => {
          const row = data[opts?.seriesIndex ?? 0];
          const count = row ? ` · ${formatNumberID(row.transactions)} transaksi` : "";
          return `${formatIDR(value)}${count}`;
        },
      },
    },
  };

  return (
    <Chart
      options={options}
      series={data.map((row) => row.total)}
      type="donut"
      height={300}
    />
  );
}
