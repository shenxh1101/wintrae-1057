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
import BaseModal from '@/components/Modal/BaseModal';
import { useAppStore } from '@/store';
import { formatCurrency, formatDuration, paymentMethodMap, orderStatusMap } from '@/utils';
import type { RevenueSummary, ParkingOrder, PaymentMethod } from '@/types';

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

  const [drillModal, setDrillModal] = useState<{ open: boolean; date: string | null }>({ open: false, date: null });
  const [drillLotId, setDrillLotId] = useState('');
  const [drillBuildingId, setDrillBuildingId] = useState('');
  const [drillPaymentMethod, setDrillPaymentMethod] = useState('');

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

  const hourlyData = useMemo(() => {
    let start: dayjs.Dayjs, end: dayjs.Dayjs;
    switch (timeRange) {
      case 'today': start = dayjs().startOf('day'); end = dayjs().endOf('day'); break;
      case '7days': start = dayjs().subtract(6, 'day').startOf('day'); end = dayjs().endOf('day'); break;
      case '30days': start = dayjs().subtract(29, 'day').startOf('day'); end = dayjs().endOf('day'); break;
      case 'custom': start = startDate ? dayjs(startDate).startOf('day') : dayjs(0); end = endDate ? dayjs(endDate).endOf('day') : dayjs(); break;
    }

    const relatedOrders = parkingOrders.filter(o => {
      const enterDate = dayjs(o.enterTime);
      if (enterDate.isBefore(start) || enterDate.isAfter(end)) return false;
      if (lotId && o.lotId !== lotId) return false;
      if (buildingId && o.buildingName !== buildingName) return false;
      return true;
    });

    const hourCounts = new Array(24).fill(0);
    relatedOrders.forEach(o => {
      const hour = dayjs(o.enterTime).hour();
      hourCounts[hour]++;
    });

    return hourCounts;
  }, [parkingOrders, timeRange, startDate, endDate, lotId, buildingId, buildingName]);

  const drillFilteredBuildings = useMemo(() => {
    if (!drillLotId) return buildings;
    return buildings.filter(b => b.lotId === drillLotId);
  }, [drillLotId, buildings]);

  const drillLotName = useMemo(() => {
    if (!drillLotId) return '';
    return parkingLots.find(l => l.id === drillLotId)?.name ?? '';
  }, [drillLotId, parkingLots]);

  const drillBuildingName = useMemo(() => {
    if (!drillBuildingId) return '';
    return buildings.find(b => b.id === drillBuildingId)?.name ?? '';
  }, [drillBuildingId, buildings]);

  const drillOrders = useMemo(() => {
    if (!drillModal.date) return [] as ParkingOrder[];
    const targetDate = drillModal.date;
    return parkingOrders.filter(o => {
      const orderDate = dayjs(o.enterTime).format('YYYY-MM-DD');
      if (orderDate !== targetDate) return false;
      if (drillLotId && o.lotId !== drillLotId) return false;
      if (drillBuildingId && o.buildingName !== drillBuildingName) return false;
      if (drillPaymentMethod && o.paymentMethod !== drillPaymentMethod) return false;
      return true;
    });
  }, [parkingOrders, drillModal.date, drillLotId, drillBuildingId, drillPaymentMethod, drillBuildingName]);

  const drillTotals = useMemo(() => {
    const orderCount = drillOrders.length;
    const totalFee = drillOrders.reduce((s, o) => s + o.totalFee, 0);
    const paidFee = drillOrders.reduce((s, o) => s + o.paidFee, 0);
    const unpaidFee = totalFee - paidFee;
    return { orderCount, totalFee, paidFee, unpaidFee };
  }, [drillOrders]);

  const openDrillModal = (date: string) => {
    setDrillModal({ open: true, date });
    setDrillLotId(lotId);
    setDrillBuildingId(buildingId);
    setDrillPaymentMethod('');
  };

  const handleDrillLotChange = (newLotId: string) => {
    setDrillLotId(newLotId);
    setDrillBuildingId('');
  };

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
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        return `${p.axisValue}<br/>订单数: ${p.value}单`;
      },
    },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: hourlyData.map((_, i) => `${String(i).padStart(2, '0')}:00`), axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280', fontSize: 11 } },
    yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#6b7280', formatter: '{value}单' }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
    series: [{ type: 'bar', barWidth: 16, data: hourlyData, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#6ee7b7' }] }, borderRadius: [4, 4, 0, 0] } }],
  };

  const getTimeRangeText = () => {
    switch (timeRange) {
      case 'today': return '今日';
      case '7days': return '近7日';
      case '30days': return '近30日';
      case 'custom':
        if (startDate && endDate) return `${startDate} 至 ${endDate}`;
        if (startDate) return `${startDate} 起`;
        if (endDate) return `至 ${endDate}`;
        return '自定义';
      default: return '';
    }
  };

  const handleExport = () => {
    const filterInfo = `筛选范围: ${lotName || '全部车场'} / ${buildingName || '全部楼栋'} / ${getTimeRangeText()}`;
    const headers = ['日期', '订单数', '临停收入', '月卡收入', '总收入', '平均时长(分钟)'];
    const rows = filteredData.map(d => [d.date, d.orderCount, d.tempRevenue, d.monthlyRevenue, d.totalRevenue, d.avgDuration]);
    const csv = [[filterInfo], headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    let fileName = 'revenue_report';
    if (lotName) fileName += `_${lotName}`;
    if (buildingName) fileName += `_${buildingName}`;
    fileName += `_${dayjs().format('YYYYMMDD')}.csv`;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDrillExport = () => {
    if (!drillModal.date) return;
    const dateStr = drillModal.date;
    const filterInfo = `筛选范围: ${drillLotName || '全部车场'} / ${drillBuildingName || '全部楼栋'} / ${drillPaymentMethod ? paymentMethodMap[drillPaymentMethod as PaymentMethod] : '全部支付方式'} / ${dateStr}`;
    const headers = ['订单号', '车牌号', '车位', '楼栋', '入场时间', '出场时间', '费用', '已付', '支付方式', '状态'];
    const rows = drillOrders.map(o => [
      o.id,
      o.plateNumber,
      o.spaceNo,
      o.buildingName,
      o.enterTime,
      o.exitTime || '',
      o.totalFee,
      o.paidFee,
      o.paymentMethod ? paymentMethodMap[o.paymentMethod] : '',
      orderStatusMap[o.status].label,
    ]);
    const csv = [[filterInfo], headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    let fileName = `orders_${dateStr}`;
    if (drillLotId) fileName += `_${drillLotId}`;
    if (drillBuildingName) fileName += `_${drillBuildingName}`;
    fileName += '.csv';
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'date', title: '日期', width: '120px' },
    { key: 'orderCount', title: '订单数', width: '100px', align: 'right' as const, render: (r: RevenueSummary) => (
      <button
        className="cursor-pointer hover:text-accent-600 hover:underline transition-colors"
        onClick={() => openDrillModal(r.date)}
      >
        {r.orderCount} 单
      </button>
    ) },
    { key: 'tempRevenue', title: '临停收入', width: '120px', align: 'right' as const, render: (r: RevenueSummary) => formatCurrency(r.tempRevenue) },
    { key: 'monthlyRevenue', title: '月卡收入', width: '120px', align: 'right' as const, render: (r: RevenueSummary) => formatCurrency(r.monthlyRevenue) },
    { key: 'totalRevenue', title: '总收入', width: '120px', align: 'right' as const, render: (r: RevenueSummary) => (
      <button
        className="cursor-pointer font-semibold text-accent-600 hover:text-accent-700 hover:underline transition-colors"
        onClick={() => openDrillModal(r.date)}
      >
        {formatCurrency(r.totalRevenue)}
      </button>
    ) },
    { key: 'avgDuration', title: '平均时长', width: '120px', align: 'right' as const, render: (r: RevenueSummary) => formatDuration(r.avgDuration) },
  ];

  const drillColumns = [
    { key: 'id', title: '订单号', width: '140px' },
    { key: 'plateNumber', title: '车牌号', width: '100px' },
    { key: 'spaceNo', title: '车位', width: '80px' },
    { key: 'buildingName', title: '楼栋', width: '80px' },
    { key: 'enterTime', title: '入场时间', width: '160px', render: (r: ParkingOrder) => dayjs(r.enterTime).format('YYYY-MM-DD HH:mm:ss') },
    { key: 'exitTime', title: '出场时间', width: '160px', render: (r: ParkingOrder) => r.exitTime ? dayjs(r.exitTime).format('YYYY-MM-DD HH:mm:ss') : '-' },
    { key: 'totalFee', title: '费用', width: '90px', align: 'right' as const, render: (r: ParkingOrder) => formatCurrency(r.totalFee) },
    { key: 'paidFee', title: '已付', width: '90px', align: 'right' as const, render: (r: ParkingOrder) => formatCurrency(r.paidFee) },
    { key: 'paymentMethod', title: '支付方式', width: '90px', render: (r: ParkingOrder) => r.paymentMethod ? paymentMethodMap[r.paymentMethod] : '-' },
    { key: 'status', title: '状态', width: '90px', render: (r: ParkingOrder) => {
      const s = orderStatusMap[r.status];
      return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${s.bg} ${s.color}`}>{s.label}</span>;
    } },
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

      <BaseModal
        open={drillModal.open}
        title={`${drillModal.date || ''} 订单明细`}
        size="lg"
        onClose={() => setDrillModal({ open: false, date: null })}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select className="input w-auto" value={drillLotId} onChange={e => handleDrillLotChange(e.target.value)}>
              <option value="">全部车场</option>
              {parkingLots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select className="input w-auto" value={drillBuildingId} onChange={e => setDrillBuildingId(e.target.value)}>
              <option value="">全部楼栋</option>
              {drillFilteredBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="input w-auto" value={drillPaymentMethod} onChange={e => setDrillPaymentMethod(e.target.value)}>
              <option value="">全部支付方式</option>
              {Object.entries(paymentMethodMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="flex-1" />
            <button className="btn btn-accent" onClick={handleDrillExport}>
              <Download size={16} className="mr-1.5" />导出明细
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500">当前筛选：</span>
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              车场: {drillLotName || '全部车场'}
            </span>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              楼栋: {drillBuildingName || '全部楼栋'}
            </span>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              支付方式: {drillPaymentMethod ? paymentMethodMap[drillPaymentMethod as PaymentMethod] : '全部'}
            </span>
          </div>

          <div className="max-h-96 overflow-auto">
            <DataTable<ParkingOrder> columns={drillColumns} data={drillOrders} rowKey={r => r.id} emptyText="暂无订单数据" />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-gray-100 text-sm">
            <div>
              <span className="text-gray-500">订单总数：</span>
              <span className="font-semibold text-gray-800">{drillTotals.orderCount} 单</span>
            </div>
            <div>
              <span className="text-gray-500">总费用：</span>
              <span className="font-semibold text-gray-800">{formatCurrency(drillTotals.totalFee)}</span>
            </div>
            <div>
              <span className="text-gray-500">已付总额：</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(drillTotals.paidFee)}</span>
            </div>
            <div>
              <span className="text-gray-500">未付总额：</span>
              <span className="font-semibold text-red-600">{formatCurrency(drillTotals.unpaidFee)}</span>
            </div>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
