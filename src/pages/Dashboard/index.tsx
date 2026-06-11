import ReactECharts from 'echarts-for-react';
import {
  Car,
  CheckCircle,
  Clock,
  Calendar,
  Wallet,
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import StatCard from '@/components/Card/StatCard';
import { useAppStore } from '@/store';
import { hourlyOccupancy, revenueSummary } from '@/mock/data';
import {
  formatCurrency,
  deviceStatusMap,
  exceptionStatusMap,
  exceptionTypeMap,
} from '@/utils';

export default function Dashboard() {
  const { dashboardStats, devices, exceptionOrders } = useAppStore();

  const statCards = [
    {
      title: '总车位',
      value: dashboardStats.totalSpaces,
      icon: <Car size={24} />,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      suffix: '个',
    },
    {
      title: '空闲车位',
      value: dashboardStats.availableSpaces,
      icon: <CheckCircle size={24} />,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      suffix: '个',
    },
    {
      title: '占用车位',
      value: dashboardStats.occupiedSpaces,
      icon: <Clock size={24} />,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      suffix: '个',
    },
    {
      title: '预约车位',
      value: dashboardStats.reservedSpaces,
      icon: <Calendar size={24} />,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      suffix: '个',
    },
    {
      title: '今日收入',
      value: formatCurrency(dashboardStats.todayRevenue),
      icon: <Wallet size={24} />,
      iconBg: 'bg-accent-50',
      iconColor: 'text-accent-600',
    },
    {
      title: '今日订单',
      value: dashboardStats.todayOrders,
      icon: <FileText size={24} />,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      suffix: '单',
    },
    {
      title: '今日入场',
      value: dashboardStats.todayEntry,
      icon: <ArrowDownCircle size={24} />,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      suffix: '辆',
    },
    {
      title: '今日出场',
      value: dashboardStats.todayExit,
      icon: <ArrowUpCircle size={24} />,
      iconBg: 'bg-pink-50',
      iconColor: 'text-pink-600',
      suffix: '辆',
    },
  ];

  const occupancyOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: hourlyOccupancy.map((d) => `${d.hour}:00`),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      axisLabel: { color: '#6b7280', formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: hourlyOccupancy.map((d) => d.rate.toFixed(1)),
        lineStyle: { width: 3, color: '#6366f1' },
        itemStyle: { color: '#6366f1' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(99, 102, 241, 0.35)' },
              { offset: 1, color: 'rgba(99, 102, 241, 0.02)' },
            ],
          },
        },
      },
    ],
  };

  const last7Days = revenueSummary.slice(-7);
  const revenueOption = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['临时收入', '月卡收入', '订单数'],
      right: 0,
      top: 0,
      textStyle: { color: '#6b7280', fontSize: 12 },
    },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: last7Days.map((d) => d.date.slice(5)),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    yAxis: [
      {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#6b7280', formatter: '¥{value}' },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#6b7280', formatter: '{value}单' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '临时收入',
        type: 'bar',
        stack: 'revenue',
        barWidth: 20,
        data: last7Days.map((d) => d.tempRevenue),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#6366f1' },
              { offset: 1, color: '#a5b4fc' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: '月卡收入',
        type: 'bar',
        stack: 'revenue',
        barWidth: 20,
        data: last7Days.map((d) => d.monthlyRevenue),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#fcd34d' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: '订单数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: last7Days.map((d) => d.orderCount),
        lineStyle: { width: 2, color: '#10b981' },
        itemStyle: { color: '#10b981' },
      },
    ],
  };

  const pendingExceptions = exceptionOrders
    .filter((e) => e.status !== 'resolved')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <StatCard key={idx} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="text-base font-semibold text-gray-800 mb-4">24小时车位占用率趋势</div>
          <ReactECharts option={occupancyOption} style={{ height: 280 }} />
        </div>
        <div className="card p-5">
          <div className="text-base font-semibold text-gray-800 mb-4">近7日收入趋势</div>
          <ReactECharts option={revenueOption} style={{ height: 280 }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-base font-semibold text-gray-800">设备状态</div>
            <div className="text-sm text-gray-500">
              共 {devices.length} 台，在线 {devices.filter((d) => d.status === 'online').length} 台
            </div>
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {devices.map((device) => {
              const status = deviceStatusMap[device.status];
              return (
                <div
                  key={device.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{device.name}</div>
                      <div className="text-xs text-gray-400">{device.location}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${status.color}`}>{status.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-base font-semibold text-gray-800">异常提醒</div>
            <div className="text-sm text-red-600">待处理 {pendingExceptions.length} 条</div>
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {pendingExceptions.map((ex) => {
              const status = exceptionStatusMap[ex.status];
              return (
                <div
                  key={ex.id}
                  className="py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {exceptionTypeMap[ex.type]}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {ex.plateNumber && <span className="mr-3">{ex.plateNumber}</span>}
                        {ex.createTime}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color} shrink-0`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{ex.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
