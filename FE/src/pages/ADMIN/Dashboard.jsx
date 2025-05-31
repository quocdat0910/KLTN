import React from 'react';
import '../../Component.css';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const Dashboard = () => {
  const data = {
    labels: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        label: '',
        data: [500, 300, 400, 480, 150, 400, 370],
        backgroundColor: '#1814F3',
        borderRadius: 6,
        barThickness: 20,
      },
      {
        label: '',
        data: [230, 100, 290, 390, 180, 280, 320],
        backgroundColor: '#16DBCC',
        borderRadius: 6,
        barThickness: 20,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 100,
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className='h2'>Tổng quan</h2>
      </div>

      <div className="dashboard-events">
        <div className="events-header">
          <h3>Thống kê</h3>
          <span>Xem tất cả</span>
        </div>

        <div className="chart-card">
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
