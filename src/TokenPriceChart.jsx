// TokenPriceChart.jsx
import React from "react";
import Chart from "react-apexcharts";

const TokenPriceChart = () => {
  const chartOptions = {
    chart: {
      id: "token-price-chart",
      type: "line",
      zoom: {
        enabled: true,
      },
    },
    xaxis: { type: "datetime" },
    title: {
      text: "Token Price (USD)",
      align: "left",
    },
    tooltip: { x: { format: "HH:mm dd MMM" } },
  };

  const chartSeries = [
    {
      name: "Price",
      data: [
        {
            x: new Date(),
            y: 1
        },
        {
            x: new Date(),
            y: 1
        },
        {
            x: new Date(),
            y: 1
        },
        {
            x: new Date(),
            y: 1
        },
        
      ], // your token price values
    },
  ];

  return (
    <div>
      <Chart
        options={chartOptions}
        series={chartSeries}
        type="line"
        height="350"
      />
    </div>
  );
};

export default TokenPriceChart;
