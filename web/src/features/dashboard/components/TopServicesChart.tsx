import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { formatAxisIDR, formatIDR } from "../../../utils/format";
import type { TopService } from "../../../services/dashboardApi";

export default function TopServicesChart({ data }: { data: TopService[] }) {
  const options: ApexOptions = {
    legend: { show: false },
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      toolbar: { show: false },
    },
    plotOptions: { bar: { borderRadius: 4, horizontal: true } },
    grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    dataLabels: { enabled: false },
    tooltip: {
      y: { formatter: (value: number) => formatIDR(value) },
    },
    xaxis: {
      categories: data.map((service) => service.service_name),
      labels: { formatter: (value: string) => formatAxisIDR(Number(value)) },
    },
  };

  return (
    <Chart
      options={options}
      series={[{ name: "Revenue", data: data.map((s) => s.revenue) }]}
      type="bar"
      height={Math.max(220, data.length * 64)}
    />
  );
}
