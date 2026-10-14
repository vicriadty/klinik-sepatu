import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { formatIDR, formatNumberID } from "../../../utils/format";
import type { PaymentMethodStat } from "../../../services/dashboardApi";
import { useTheme } from "../../../context/ThemeContext";

const LIGHT_METHOD_COLORS = [
  "#465FFF",
  "#0086C9",
  "#039855",
  "#C4320A",
  "#D92D20",
];
const DARK_METHOD_COLORS = [
  "#7592FF",
  "#36BFFA",
  "#32D583",
  "#F79009",
  "#F97066",
];

export default function PaymentMethodsChart({
  data,
}: {
  data: PaymentMethodStat[];
}) {
  const { theme } = useTheme();
  const options: ApexOptions = {
    legend: { position: "bottom" },
    colors: theme === "dark" ? DARK_METHOD_COLORS : LIGHT_METHOD_COLORS,
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
