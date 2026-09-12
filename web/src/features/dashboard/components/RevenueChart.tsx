import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { formatAxisIDR, formatDateID, formatIDR } from "../../../utils/format";
import type { RevenuePoint } from "../../../services/dashboardApi";

export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const options: ApexOptions = {
    legend: { show: false },
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      toolbar: { show: false },
    },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } },
    markers: { size: 0, hover: { size: 6 } },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    tooltip: {
      y: { formatter: (value: number) => formatIDR(value) },
    },
    xaxis: {
      categories: data.map((point) => formatDateID(point.date)),
      labels: { rotate: -30 },
    },
    yaxis: { labels: { formatter: (value: number) => formatAxisIDR(value) } },
  };

  return (
    <Chart
      options={options}
      series={[{ name: "Revenue", data: data.map((point) => point.revenue) }]}
      type="area"
      height={310}
    />
  );
}
