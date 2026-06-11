import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Download,
  Filter,
  Calendar,
  TrendingUp,
  BarChart3,
  Wallet,
  CreditCard,
  FileText,
  Clock,
  PieChart,
} from 'lucide-react';
import dayjs from 'dayjs';
import StatCard from '@/components/Card/StatCard';
import DataTable from '@/components/Table/DataTable';
import { useAppStore } from '@/store';
import { formatCurrency, formatDuration } from '@/utils';
import { hourlyOccupancy } from '@/mock/data';
import type { RevenueSummary } from '@/types';

type TimeRange = 'today' | '7days' | '30days' | 'custom';

const TIME_PRESETS: { key: TimeRange; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: '7days', label: '近7日' },
  { key: '30days', label: '近30日' },
  { key: 'custom', label: '自定义' },
];

export default function Reports() {
  const { revenueSummary, buildings, dashboardStats, parkingOrders, parkingSpaces, parkingLots } = useAppStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lotId, setLotId] = useState('');
  const [buildingId, setBuildingId] = useState('');

  const lotName = useMemo(() => {
    if (!lotId) return '';
    return parkingLots.find(l => l.id === lotId)?.name ?? '';
  }, [lotId, parkingLots]);

  const filteredBuildings = useMemo(() => {
    if (!lotId) return buildings;
    return buildings.filter(b => b.lotId === lotId);
  }, [lotId, buildings]);

  const handleLotChange = (newLotId: string) => {
    setLotId(newLotId);
    setBuildingId('');
  };

  const buildingName = useMemo(() => {
    if (!buildingId) return '';
    return buildings.find(b => b.id === buildingId)?.name ?? '';
  }, [buildingId, buildings]);

  const filteredData = useMemo(() => {
    let start: dayjs.Dayjs, end: dayjs.Dayjs;
    switch (timeRange) {
      case 'today': start = dayjs().startOf('day'); end = dayjs().endOf('day'); break;
      case '7days': start = dayjs().subtract(6, 'day').startOf('day'); end = dayjs().endOf('day'); break;
      case '30days': start = dayjs().subtract(29, 'day').startOf('day'); end = dayjs().endOf('day'); break;
      case 'custom': start = startDate ? dayjs(startDate).startOf('day') : dayjs(0); end = endDate ? dayjs(endDate).endOf('day') : dayjs(); break;
    }

    if (!buildingId && !lotId) {
      return revenueSummary.filter(d => {
        const date = dayjs(d.date);
        return !date.isBefore(start) && !date.isAfter(end);
      });
    }

    const filtered = parkingOrders.filter(o => {
      const enterDate = dayjs(o.enterTime);
      if (enterDate.isBefore(start) || enterDate.isAfter(end)) return false;
      if (lotId && o.lotId !== lotId) return false;
      if (buildingId && o.buildingName !== buildingName) return false;
      return true;
    });

    const grouped = new Map<string, typeof filtered>();
    filtered.forEach(o => {
      const dateKey = dayjs(o.enterTime).format('YYYY-MM-DD');
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
      grouped.get(dateKey)!.push(o);
    });

    const result: RevenueSummary[] = [];
    const sortedKeys = [...grouped.keys()].sort();
    sortedKeys.forEach(date => {
      const orders = grouped.get(date)!;
      const tempRevenue = orders.filter(o => o.paymentMethod !== 'monthly').reduce((s, o) => s + o.totalFee, 0);
      const monthlyRevenue = orders.filter(o => o.paymentMethod === 'monthly').reduce((s, o) => s + o.totalFee, 0);
      const totalRevenue = tempRevenue + monthlyRevenue;
      const orderCount = orders.length;
      const avgDuration = orderCount > 0 ? Math.round(orders.reduce((s, o) => s + o.duration, 0) / orderCount) : 0;
      result.push({ date, totalRevenue, tempRevenue, monthlyRevenue, orderCount, avgDuration, buildingId, buildingName });
    });

    return result;
  }, [revenueSummary, parkingOrders, timeRange, startDate, endDate, lotId, buildingId, buildingName]);

  const totals = useMemo(() => {
    const totalRevenue = filteredData.reduce((s, d) => s + d.totalRevenue, 0);
    const tempRevenue = filteredData.reduce((s, d) => s + d.tempRevenue, 0);
    const monthlyRevenue = filteredData.reduce((s, d) => s + d.monthlyRevenue, 0);
    const orderCount = filteredData.reduce((s, d) => s + d.orderCount, 0);
    const avgDuration = filteredData.length ? Math.round(filteredData.reduce((s, d) => s + d.avgDuration, 0) / filteredData.length) : 0;
    let utilization: number;
    if (buildingId) {
      const bSpaces = parkingSpaces.filter(s => s.buildingId === buildingId);
      const bOccupied = bSpaces.filter(s => s.status === 'occupied').length;
      utilization = bSpaces.length > 0 ? Math.round((bOccupied / bSpaces.length) * 100) : 0;
    } else if (lotId) {
      const lotBuildingIds = buildings.filter(b => b.lotId === lotId).map(b => b.id);
      const lSpaces = parkingSpaces.filter(s => lotBuildingIds.includes(s.buildingId));
      const lOccupied = lSpaces.filter(s => s.status === 'occupied').length;
      utilization = lSpaces.length > 0 ? Math.round((lOccupied / lSpaces.length) * 100) : 0;
    } else {
      utilization = dashboardStats.totalSpaces ? Math.round((dashboardStats.occupiedSpaces / dashboardStats.totalSpaces) * 100) : 0;
    }
    return { totalRevenue, tempRevenue, monthlyRevenue, orderCount, avgDuration, utilization };
  }, [filteredData, dashboardStats, lotId, buildingId, parkingSpaces, buildings]);

  const statCards = [
    { title: '总收入', value: formatCurrency(totals.totalRevenue), icon: <Wallet size={24} />, iconBg: 'bg-accent-50', iconColor: 'text-accent-600' },
    { title: '临停收入', value: formatCurrency(totals.tempRevenue), icon: <TrendingUp size={24} />, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: '月卡收入', value: formatCurrency(totals.monthlyRevenue), icon: <CreditCard size={24} />, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { title: '订单总数', value: totals.orderCount, icon: <FileText size={24} />, iconBg: 'bg-purple-50', iconColor: 'text-purple-600', suffix: '单' },
    { title: '平均停车时长', value: formatDuration(totals.avgDuration), icon: <Clock size={24} />, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { title: '车位利用率', value: totals.utilization, icon: <PieChart size={24} />, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', suffix: '%' },
  ];

  const revenueOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['临停收入', '月卡收入'], right: 0, top: 0, textStyle: { color: '#6b7280', fontSize: 12 } },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', boundaryGap: false, data: filteredData.map(d => d.date.slice(5)), axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280', fontSize: 11 } },
    yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#6b7280', formatter: '¥{value}' }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
    series: [
      { name: '临停收入', type: 'line', stack: 'total', smooth: true, symbol: 'circle', symbolSize: 6, data: filteredData.map(d => d.tempRevenue), lineStyle: { width: 2, color: '#6366f1' }, itemStyle: { color: '#6366f1' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(99, 102, 241, 0.45)' }, { offset: 1, color: 'rgba(99, 102, 241, 0.02)' }] } } },
      { name: '月卡收入', type: 'line', stack: 'total', smooth: true, symbol: 'circle', symbolSize: 6, data: filteredData.map(d => d.monthlyRevenue), lineStyle: { width: 2, color: '#f59e0b' }, itemStyle: { color: '#f59e0b' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(245, 158, 11, 0.45)' }, { offset: 1, color: 'rgba(245, 158, 11, 0.02)' }] } } },
    ],
  };

  const hourlyOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: hourlyOccupancy.map(d => `${d.hour}:00`), axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280', fontSize: 11 } },
    yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#6b7280', formatter: '{value}单' }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
    series: [{ type: 'bar', barWidth: 16, data: hourlyOccupancy.map(d => Math.round(d.rate * 2 + Math.random() * 30)), itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#6ee7b7' }] }, borderRadius: [4, 4, 0, 0] } }],
  };

  const handleExport = () => {
    const headers = ['日期', '订单数', '临停收入', '月卡收入', '总收入', '平均时长(分钟)'];
    const rows = filteredData.map(d => [d.date, d.orderCount, d.tempRevenue, d.monthlyRevenue, d.totalRevenue, d.avgDuration]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    let fileName = 'revenue_report';
    if (lotId) fileName += `_${lotId}`;
    if (buildingId) fileName += `_${buildingId}`;
    fileName += `_${dayjs().format('YYYYMMDD')}.csv`;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'date', title: '日期', width: '120px' },
    { key: 'orderCount', title: '订单数', width: '100px', align: 'right' as const, render: (r: RevenueSummary) => `${r.orderCount} 单` },
    { key: 'tempRevenue', title: '临停收入', width: '120px', align: 'right' as const, render: (r: RevenueSummary) => formatCurrency(r.tempRevenue) },
    { key: 'monthlyRevenue', title: '月卡收入', width: '120px', align: 'right' as const, render: (r: RevenueSummary) => formatCurrency(r.monthlyRevenue) },
    { key: 'totalRevenue', title: '总收入', width: '120px', align: 'right' as const, render: (r: RevenueSummary) => <span className="font-semibold text-accent-600">{formatCurrency(r.totalRevenue)}</span> },
    { key: 'avgDuration', title: '平均时长', width: '120px', align: 'right' as const, render: (r: RevenueSummary) => formatDuration(r.avgDuration) },
  ];

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">筛选：</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {TIME_PRESETS.map(p => (
              <button key={p.key} onClick={() => setTimeRange(p.key)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${timeRange === p.key ? 'bg-white text-accent-600 font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
                {p.label}
              </button>
            ))}
          </div>
          {timeRange === 'custom' && (
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <input type="date" className="input w-auto" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span className="text-gray-400">至</span>
              <input type="date" className="input w-auto" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          )}
          <select className="input w-auto" value={lotId} onChange={e => handleLotChange(e.target.value)}>
            <option value="">全部车场</option>
            {parkingLots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          {lotId && lotName && (
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">当前车场: {lotName}</span>
          )}
          <select className="input w-auto" value={buildingId} onChange={e => setBuildingId(e.target.value)}>
            <option value="">全部楼栋</option>
            {filteredBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {buildingId && buildingName && (
            <span className="inline-flex items-center rounded-md bg-accent-50 px-2 py-1 text-xs font-medium text-accent-600">当前: {buildingName}</span>
          )}
          <div className="flex-1" />
          <button className="btn btn-accent" onClick={handleExport}>
            <Download size={16} className="mr-1.5" />导出 Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => <StatCard key={idx} {...card} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-accent-600" />
            <div className="text-base font-semibold text-gray-800">收入趋势</div>
          </div>
          <ReactECharts option={revenueOption} style={{ height: 300 }} />
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-emerald-600" />
            <div className="text-base font-semibold text-gray-800">订单时段分布</div>
          </div>
          <ReactECharts option={hourlyOption} style={{ height: 300 }} />
        </div>
      </div>

      <div className="card p-5">
        <div className="text-base font-semibold text-gray-800 mb-4">对账明细</div>
        <DataTable<RevenueSummary> columns={columns} data={filteredData} rowKey={r => r.date} emptyText="暂无对账数据" />
      </div>
    </div>
  );
}
