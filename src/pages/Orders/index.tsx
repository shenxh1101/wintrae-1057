import { useState, useMemo, useEffect } from 'react';
import { RefreshCw, Filter, DollarSign, FileText, Ticket, Download, History, AlertTriangle, Clock, MessageSquare, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import DataTable from '@/components/Table/DataTable';
import BaseModal from '@/components/Modal/BaseModal';
import { useAppStore } from '@/store';
import { orderStatusMap, paymentMethodMap, formatCurrency, formatDuration, formatDateTime } from '@/utils';
import { couponPlans } from '@/mock/data';
import type { ParkingOrder, OrderStatus, PaymentMethod, ExceptionOrder } from '@/types';

const PAGE_SIZE = 10;

const OPERATION_ACTION_MAP: Record<string, { label: string; className: string }> = {
  refund: { label: '退款', className: 'bg-red-100 text-red-700' },
  pay: { label: '补缴', className: 'bg-green-100 text-green-700' },
  remark: { label: '备注', className: 'bg-gray-100 text-gray-700' },
  coupon: { label: '发券', className: 'bg-purple-100 text-purple-700' },
  plate_correct: { label: '车牌修正', className: 'bg-blue-100 text-blue-700' },
};

export default function Orders() {
  const navigate = useNavigate();
  const { parkingOrders, buildings, exceptionOrders, updateOrderStatus, addOrderRemark, issueCoupon, setSelectedBuilding, setSearchPlate: setStoreSearchPlate } = useAppStore();

  const [buildingId, setBuildingId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchPlate, setLocalSearchPlate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [remarkModal, setRemarkModal] = useState<{ open: boolean; order: ParkingOrder | null }>({ open: false, order: null });
  const [remarkText, setRemarkText] = useState<string>('');
  const [couponModal, setCouponModal] = useState<{ open: boolean; order: ParkingOrder | null }>({ open: false, order: null });
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');
  const [detailModal, setDetailModal] = useState<{ open: boolean; order: ParkingOrder | null }>({ open: false, order: null });
  const [logFilter, setLogFilter] = useState<string>('all');
  const [activeCard, setActiveCard] = useState<string>('');

  useEffect(() => {
    const state = useAppStore.getState();
    if (state.searchPlate) {
      setLocalSearchPlate(state.searchPlate);
    }
    if (state.selectedBuildingId) {
      setBuildingId(state.selectedBuildingId);
    }
  }, []);

  const filteredOrders = useMemo(() => {
    return parkingOrders.filter((o) => {
      if (buildingId) {
        const b = buildings.find((b) => b.id === buildingId);
        if (b?.name !== o.buildingName) return false;
      }
      if (status && o.status !== status) return false;
      if (paymentMethod && o.paymentMethod !== paymentMethod) return false;
      if (startDate && o.enterTime < startDate) return false;
      if (endDate && o.enterTime > endDate + ' 23:59:59') return false;
      if (searchPlate && !o.plateNumber.includes(searchPlate)) return false;
      return true;
    });
  }, [parkingOrders, buildingId, status, paymentMethod, startDate, endDate, searchPlate, buildings]);

  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  const getRelatedException = (order: ParkingOrder): ExceptionOrder | undefined => {
    return exceptionOrders.find((e) =>
      e.orderId === order.id ||
      (e.plateNumber === order.plateNumber && e.spaceNo === order.spaceNo)
    );
  };

  const dashboardStats = useMemo(() => {
    const now = new Date().getTime();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    const pendingRefund = parkingOrders.filter((o) => {
      if (o.status !== 'paid') return false;
      const hasRefund = o.operationLogs?.some((log) => log.action === 'refund');
      return !hasRefund;
    }).length;

    const pendingPay = parkingOrders.filter((o) => o.status === 'pending').length;

    const pendingCoupon = parkingOrders.filter((o) =>
      o.totalFee > 200 && (!o.couponRecords || o.couponRecords.length === 0)
    ).length;

    const pendingRemark = parkingOrders.filter((o) => {
      if (!o.remark || o.remark.trim() === '') return true;
      const hasRecentPlateCorrect = o.operationLogs?.some((log) =>
        log.action === 'plate_correct' && new Date(log.time).getTime() > twentyFourHoursAgo
      );
      return hasRecentPlateCorrect;
    }).length;

    const pendingPlateCorrect = parkingOrders.filter((o) => {
      const hasPlateCorrect = o.operationLogs?.some((log) => log.action === 'plate_correct');
      if (!hasPlateCorrect) return false;
      const relatedException = getRelatedException(o);
      return relatedException && relatedException.status !== 'resolved';
    }).length;

    return [
      { key: 'refund', label: '待退款', count: pendingRefund, color: 'bg-red-50 border-red-200 text-red-600', activeColor: 'bg-red-100 border-red-300', icon: DollarSign },
      { key: 'pay', label: '待补缴', count: pendingPay, color: 'bg-amber-50 border-amber-200 text-amber-600', activeColor: 'bg-amber-100 border-amber-300', icon: Clock },
      { key: 'coupon', label: '待发券', count: pendingCoupon, color: 'bg-purple-50 border-purple-200 text-purple-600', activeColor: 'bg-purple-100 border-purple-300', icon: Ticket },
      { key: 'remark', label: '待备注', count: pendingRemark, color: 'bg-gray-50 border-gray-200 text-gray-600', activeColor: 'bg-gray-100 border-gray-300', icon: MessageSquare },
      { key: 'plate', label: '待车牌修正', count: pendingPlateCorrect, color: 'bg-blue-50 border-blue-200 text-blue-600', activeColor: 'bg-blue-100 border-blue-300', icon: Car },
    ];
  }, [parkingOrders, exceptionOrders]);

  const handleCardClick = (key: string) => {
    setCurrentPage(1);
    setActiveCard(activeCard === key ? '' : key);

    switch (key) {
      case 'refund':
        setStatus('paid');
        setPaymentMethod('');
        setLocalSearchPlate('');
        setStoreSearchPlate('');
        break;
      case 'pay':
        setStatus('pending');
        setPaymentMethod('');
        setLocalSearchPlate('');
        setStoreSearchPlate('');
        break;
      case 'coupon':
        setStatus('');
        setPaymentMethod('');
        setLocalSearchPlate('');
        setStoreSearchPlate('');
        break;
      case 'remark':
        setStatus('');
        setPaymentMethod('');
        setLocalSearchPlate('');
        setStoreSearchPlate('');
        break;
      case 'plate':
        setStatus('');
        setPaymentMethod('');
        break;
      default:
        setStatus('');
        setPaymentMethod('');
        setLocalSearchPlate('');
        setStoreSearchPlate('');
    }
  };

  const handleReset = () => {
    setBuildingId('');
    setStatus('');
    setPaymentMethod('');
    setStartDate('');
    setEndDate('');
    setLocalSearchPlate('');
    setStoreSearchPlate('');
    setCurrentPage(1);
    setActiveCard('');
  };

  const handleExport = () => {
    const headers = ['订单号','车牌号','车位','车场','楼栋','入场时间','出场时间','费用','已付','支付方式','状态','优惠券','备注','操作人汇总','操作时间汇总','操作动作汇总'];
    const rows = filteredOrders.map((o) => {
      const operators = o.operationLogs ? [...new Set(o.operationLogs.map((log) => log.operator))].join(';') : '';
      const timeSummary = o.operationLogs ? o.operationLogs.map((log) => `${log.action}:${dayjs(log.time).format('YYYY-MM-DD HH:mm:ss')}`).join(';') : '';
      const actionSummary = o.operationLogs ? o.operationLogs.map((log) => log.detail).join(';') : '';
      const relatedException = getRelatedException(o);
      const remarkParts: string[] = [];
      if (o.remark) remarkParts.push(o.remark);
      if (relatedException) remarkParts.push(`关联异常单号: ${relatedException.id}`);
      return [
        o.id,
        o.plateNumber,
        o.spaceNo,
        o.lotName || '',
        o.buildingName,
        formatDateTime(o.enterTime),
        o.exitTime ? formatDateTime(o.exitTime) : '',
        o.totalFee,
        o.paidFee,
        o.paymentMethod ? paymentMethodMap[o.paymentMethod] : '',
        orderStatusMap[o.status].label,
        o.couponRecords?.map((r) => r.couponName).join(';') || '',
        remarkParts.join('; '),
        operators,
        timeSummary,
        actionSummary,
      ];
    });
    const infoLine = `导出时间: ${new Date().toLocaleString('zh-CN')}, 共${filteredOrders.length}条订单`;
    const csv = [infoLine, headers, ...rows].map((r) => Array.isArray(r) ? r.join(',') : r).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const filterParts: string[] = [];
    const building = buildings.find((b) => b.id === buildingId);
    if (building) filterParts.push(building.name);
    if (status) filterParts.push(orderStatusMap[status as OrderStatus]?.label || status);
    if (searchPlate) filterParts.push(searchPlate);
    const filterSuffix = filterParts.length > 0 ? `_${filterParts.join('_').replace(/[\\/:*?"<>|]/g, '')}` : '';
    const fileName = `orders_${dayjs().format('YYYYMMDD')}${filterSuffix}.csv`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefund = (order: ParkingOrder) => {
    if (window.confirm(`确定退款订单 ${order.id}？`)) {
      updateOrderStatus(order.id, 'refunded', 0);
    }
  };

  const handlePay = (order: ParkingOrder) => {
    if (window.confirm(`确定补缴订单 ${order.id}，金额 ${formatCurrency(order.totalFee)}？`)) {
      updateOrderStatus(order.id, 'paid', order.totalFee);
    }
  };

  const openRemarkModal = (order: ParkingOrder) => {
    setRemarkModal({ open: true, order });
    setRemarkText('');
  };

  const handleSaveRemark = () => {
    if (remarkModal.order) {
      addOrderRemark(remarkModal.order.id, remarkText);
    }
    setRemarkModal({ open: false, order: null });
  };

  const openCouponModal = (order: ParkingOrder) => {
    setCouponModal({ open: true, order });
    setSelectedCouponId('');
  };

  const openDetailModal = (order: ParkingOrder) => {
    setDetailModal({ open: true, order });
    setLogFilter('all');
  };

  const handleSendCoupon = () => {
    if (selectedCouponId && couponModal.order) {
      const coupon = couponPlans.find((c) => c.id === selectedCouponId);
      if (coupon) {
        issueCoupon(couponModal.order.id, {
          couponId: coupon.id,
          couponName: coupon.name,
          issuedAt: new Date().toISOString(),
        });
      }
    }
    setCouponModal({ open: false, order: null });
  };

  const columns = [
    { key: 'id', title: '订单号', width: '130px' },
    {
      key: 'plateNumber',
      title: '车牌号',
      width: '160px',
      align: 'center' as const,
      render: (o: ParkingOrder) => {
        const hasPlateCorrect = o.operationLogs?.filter((log) => log.action === 'plate_correct').length ?? 0 > 0;
        const relatedException = getRelatedException(o);
        return (
          <div className="flex items-center justify-center gap-1 flex-wrap">
            <span>{o.plateNumber}</span>
            {hasPlateCorrect && (
              <span className="tag bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5">已修正</span>
            )}
            {relatedException && (
              <span className="tag bg-red-100 text-red-700 text-xs px-1.5 py-0.5">关联异常</span>
            )}
          </div>
        );
      },
    },
    { key: 'spaceNo', title: '车位', width: '100px', align: 'center' as const },
    { key: 'buildingName', title: '楼栋', width: '80px', align: 'center' as const },
    { key: 'enterTime', title: '入场时间', width: '160px', render: (o: ParkingOrder) => formatDateTime(o.enterTime) },
    { key: 'exitTime', title: '出场时间', width: '160px', render: (o: ParkingOrder) => formatDateTime(o.exitTime) },
    { key: 'duration', title: '停车时长', width: '100px', align: 'right' as const, render: (o: ParkingOrder) => formatDuration(o.duration) },
    { key: 'totalFee', title: '费用', width: '90px', align: 'right' as const, render: (o: ParkingOrder) => formatCurrency(o.totalFee) },
    { key: 'paidFee', title: '已付', width: '90px', align: 'right' as const, render: (o: ParkingOrder) => formatCurrency(o.paidFee) },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      align: 'center' as const,
      render: (o: ParkingOrder) => {
        const s = orderStatusMap[o.status];
        return <span className={`tag ${s.bg} ${s.color}`}>{s.label}</span>;
      },
    },
    {
      key: 'couponRecords',
      title: '优惠券',
      width: '150px',
      align: 'center' as const,
      render: (o: ParkingOrder) => {
        if (o.couponRecords && o.couponRecords.length > 0) {
          const counts: Record<string, { name: string; count: number }> = {};
          o.couponRecords.forEach((r) => {
            if (!counts[r.couponId]) counts[r.couponId] = { name: r.couponName, count: 0 };
            counts[r.couponId].count++;
          });
          return (
            <div className="flex items-center justify-center gap-1 flex-wrap">
              {Object.values(counts).map((c, i) => (
                <span key={i} className="tag bg-purple-100 text-purple-700">{c.name} x{c.count}</span>
              ))}
            </div>
          );
        }
        return '-';
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: '330px',
      align: 'center' as const,
      render: (o: ParkingOrder) => (
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {o.status === 'paid' && (
            <button className="btn btn-ghost text-danger hover:text-danger" onClick={() => handleRefund(o)}>
              <DollarSign size={14} className="mr-1" />退款
            </button>
          )}
          {o.status === 'pending' && (
            <button className="btn btn-ghost text-accent-600 hover:text-accent-700" onClick={() => handlePay(o)}>
              <DollarSign size={14} className="mr-1" />补缴
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => openRemarkModal(o)}>
            <FileText size={14} className="mr-1" />备注
          </button>
          <button className="btn btn-ghost text-warning hover:text-warning" onClick={() => openCouponModal(o)}>
            <Ticket size={14} className="mr-1" />发券
          </button>
          <button className="btn btn-ghost" onClick={() => openDetailModal(o)}>
            <History size={14} className="mr-1" />详情
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm text-gray-600">筛选：</span>
        </div>
        <select className="input w-auto" value={buildingId} onChange={(e) => { setBuildingId(e.target.value); setCurrentPage(1); }}>
          <option value="">全部楼栋</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setCurrentPage(1); }}>
          <option value="">全部状态</option>
          {(Object.keys(orderStatusMap) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{orderStatusMap[s].label}</option>
          ))}
        </select>
        <select className="input w-auto" value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setCurrentPage(1); }}>
          <option value="">全部支付方式</option>
          {(Object.keys(paymentMethodMap) as PaymentMethod[]).map((m) => (
            <option key={m} value={m}>{paymentMethodMap[m]}</option>
          ))}
        </select>
        <input type="date" className="input w-auto" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} />
        <span className="text-gray-400">至</span>
        <input type="date" className="input w-auto" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} />
        <input
          type="text"
          className="input w-40"
          placeholder="搜索车牌号"
          value={searchPlate}
          onChange={(e) => { setLocalSearchPlate(e.target.value); setCurrentPage(1); }}
        />
        <button className="btn btn-secondary" onClick={handleReset}>
          <RefreshCw size={14} className="mr-1" />重置
        </button>
        <button className="btn btn-accent" onClick={handleExport}>
          <Download size={14} className="mr-1" />导出
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <AlertTriangle size={14} className="text-amber-500" />
          客服跟进看板
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {dashboardStats.map((card) => {
            const Icon = card.icon;
            const isActive = activeCard === card.key;
            return (
              <div
                key={card.key}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isActive ? card.activeColor : card.color
                }`}
                onClick={() => handleCardClick(card.key)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">{card.label}</span>
                  <Icon size={16} className={isActive ? 'opacity-100' : 'opacity-70'} />
                </div>
                <div className="text-2xl font-bold">{card.count}</div>
              </div>
            );
          })}
        </div>
      </div>

      <DataTable<ParkingOrder>
        columns={columns}
        data={pagedData}
        rowKey={(r) => r.id}
        currentPage={currentPage}
        total={filteredOrders.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      <BaseModal
        open={remarkModal.open}
        title={`订单备注 - ${remarkModal.order?.id || ''}`}
        size="sm"
        onClose={() => setRemarkModal({ open: false, order: null })}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRemarkModal({ open: false, order: null })}>取消</button>
            <button className="btn btn-accent" onClick={handleSaveRemark}>保存</button>
          </>
        }
      >
        <div className="space-y-3">
          {remarkModal.order?.remark && (
            <div className="bg-gray-100 rounded-md p-3 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">原有备注：</div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans m-0">{remarkModal.order.remark}</pre>
            </div>
          )}
          <textarea
            className="input min-h-[120px] resize-y"
            placeholder="请输入备注内容（将追加到原有备注末尾）"
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
          />
        </div>
      </BaseModal>

      <BaseModal
        open={couponModal.open}
        title={`发放优惠券 - ${couponModal.order?.plateNumber || ''}`}
        size="sm"
        onClose={() => setCouponModal({ open: false, order: null })}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCouponModal({ open: false, order: null })}>取消</button>
            <button className="btn btn-accent" onClick={handleSendCoupon} disabled={!selectedCouponId}>确认发放</button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-3">选择要发放的优惠券类型：</p>
          {couponPlans.map((c) => (
            <label key={c.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
              <input type="radio" name="coupon" value={c.id} checked={selectedCouponId === c.id} onChange={(e) => setSelectedCouponId(e.target.value)} />
              <div className="flex-1">
                <div className="font-medium text-gray-800">{c.name}</div>
                <div className="text-xs text-gray-500">{c.expireDays}天内有效</div>
              </div>
            </label>
          ))}
        </div>
      </BaseModal>

      <BaseModal
        open={detailModal.open}
        title={`订单详情 - ${detailModal.order?.id || ''}`}
        size="lg"
        onClose={() => { setDetailModal({ open: false, order: null }); setLogFilter('all'); }}
        footer={
          <>
            <button className="btn btn-accent" onClick={() => { setDetailModal({ open: false, order: null }); setLogFilter('all'); }}>关闭</button>
          </>
        }
      >
        {detailModal.order && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">基本信息</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">订单号：</span>
                  <span className="text-gray-800 font-medium">{detailModal.order.id}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">车牌号：</span>
                  <span className="text-gray-800 font-medium">{detailModal.order.plateNumber}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">车位：</span>
                  <span className="text-gray-800">{detailModal.order.spaceNo}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">楼栋：</span>
                  <span className="text-gray-800">{detailModal.order.buildingName}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">车场：</span>
                  <span className="text-gray-800">{detailModal.order.lotName || '-'}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">入场时间：</span>
                  <span className="text-gray-800">{formatDateTime(detailModal.order.enterTime)}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">出场时间：</span>
                  <span className="text-gray-800">{detailModal.order.exitTime ? formatDateTime(detailModal.order.exitTime) : '-'}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">停车时长：</span>
                  <span className="text-gray-800">{formatDuration(detailModal.order.duration)}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">费用：</span>
                  <span className="text-gray-800 font-medium">{formatCurrency(detailModal.order.totalFee)}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">已付：</span>
                  <span className="text-gray-800 font-medium">{formatCurrency(detailModal.order.paidFee)}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">状态：</span>
                  <span className={`tag ${orderStatusMap[detailModal.order.status].bg} ${orderStatusMap[detailModal.order.status].color}`}>
                    {orderStatusMap[detailModal.order.status].label}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">支付方式：</span>
                  <span className="text-gray-800">{detailModal.order.paymentMethod ? paymentMethodMap[detailModal.order.paymentMethod] : '-'}</span>
                </div>
                <div className="flex col-span-2">
                  <span className="text-gray-500 w-20 flex-shrink-0">备注：</span>
                  <span className="text-gray-800">{detailModal.order.remark || '-'}</span>
                </div>
                {(() => {
                  const relatedException = getRelatedException(detailModal.order);
                  if (relatedException) {
                    const building = buildings.find((b) => b.name === detailModal.order.buildingName);
                    return (
                      <div className="flex col-span-2">
                        <span className="text-gray-500 w-20 flex-shrink-0">关联异常：</span>
                        <span
                          className="text-red-600 cursor-pointer hover:underline font-medium"
                          onClick={() => {
                            setStoreSearchPlate(detailModal.order.plateNumber);
                            if (building) {
                              setSelectedBuilding(building.id);
                            }
                            navigate('/exceptions');
                          }}
                        >
                          {relatedException.id}（点击跳转）
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">操作流水</h3>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'refund', label: '退款' },
                    { key: 'pay', label: '补缴' },
                    { key: 'coupon', label: '发券' },
                    { key: 'remark', label: '备注' },
                    { key: 'plate_correct', label: '车牌修正' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        logFilter === tab.key
                          ? 'bg-accent-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => setLogFilter(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              {detailModal.order.operationLogs && detailModal.order.operationLogs.length > 0 ? (
                <div className="space-y-2">
                  {[...detailModal.order.operationLogs]
                    .filter((log) => logFilter === 'all' || log.action === logFilter)
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .map((log) => {
                      const actionInfo = OPERATION_ACTION_MAP[log.action] || { label: log.action, className: 'bg-gray-100 text-gray-700' };
                      return (
                        <div key={log.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                          <div className="w-40 flex-shrink-0 text-sm text-gray-500">{formatDateTime(log.time)}</div>
                          <div className="w-20 flex-shrink-0 text-sm text-gray-600">{log.operator}</div>
                          <span className={`tag ${actionInfo.className} flex-shrink-0`}>{actionInfo.label}</span>
                          <div className="flex-1 text-sm text-gray-800">{log.detail}</div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">暂无操作记录</div>
              )}
            </div>
          </div>
        )}
      </BaseModal>
    </div>
  );
}
