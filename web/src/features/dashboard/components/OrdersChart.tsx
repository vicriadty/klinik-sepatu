import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { formatDateID } from "../../../utils/format";
import type { OrdersPoint } from "../../../services/dashboardApi";

export default function OrdersChart({ data }: { data: OrdersPoint[] }) {
  const options: ApexOptions = {
    legend: { show: false },
    colors: ["#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      toolbar: { show: false },
    },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    tooltip: {
      y: { formatter: (value: number) => `${value} order` },
    },
    xaxis: {
      categories: data.map((point) => formatDateID(point.date)),
      labels: { rotate: -30 },
    },
  };

  return (
    <Chart
      options={options}
      series={[{ name: "Order", data: data.map((point) => point.orders) }]}
      type="bar"
      height={310}
    />
  );
}
