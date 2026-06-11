import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, CheckCircle, Users, RefreshCw, Bell, Send, Pencil, FileText } from 'lucide-react';
import DataTable from '@/components/Table/DataTable';
import BaseModal from '@/components/Modal/BaseModal';
import { useAppStore } from '@/store';
import {
  exceptionTypeMap,
  exceptionStatusMap,
  deviceTypeMap,
  deviceStatusMap,
  formatDateTime,
} from '@/utils';
import type { ExceptionOrder, ExceptionStatus, ExceptionType, Device } from '@/types';

const PAGE_SIZE = 10;
const ASSIGNEES = ['客服小王', '客服小李', '运维小张', '管理员'];

export default function Exceptions() {
  const navigate = useNavigate();
  const { exceptionOrders, devices, parkingSpaces, updateExceptionStatus, correctExceptionPlate, setSearchPlate } = useAppStore();

  const [filterType, setFilterType] = useState<ExceptionType | ''>('');
  const [filterStatus, setFilterStatus] = useState<ExceptionStatus | ''>('');
  const [searchPlate, setLocalSearchPlate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [reassignModal, setReassignModal] = useState<{ open: boolean; order: ExceptionOrder | null }>({
    open: false,
    order: null,
  });
  const [selectedAssignee, setSelectedAssignee] = useState('');

  const [plateCorrectModal, setPlateCorrectModal] = useState<{ open: boolean; order: ExceptionOrder | null }>({
    open: false,
    order: null,
  });
  const [correctedPlate, setCorrectedPlate] = useState('');

  const stats = useMemo(
    () => ({
      pending: exceptionOrders.filter((e) => e.status === 'pending').length,
      processing: exceptionOrders.filter((e) => e.status === 'processing').length,
      resolved: exceptionOrders.filter((e) => e.status === 'resolved').length,
    }),
    [exceptionOrders]
  );

  const filteredExceptions = useMemo(() => {
    return exceptionOrders.filter((e) => {
      if (filterType && e.type !== filterType) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      if (searchPlate && !(e.plateNumber || '').includes(searchPlate)) return false;
      return true;
    });
  }, [exceptionOrders, filterType, filterStatus, searchPlate]);

  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredExceptions.slice(start, start + PAGE_SIZE);
  }, [filteredExceptions, currentPage]);

  const alertDevices = useMemo(
    () => devices.filter((d) => d.status === 'offline' || d.status === 'warning'),
    [devices]
  );

  const handleStatClick = (status: ExceptionStatus) => {
    setFilterStatus(filterStatus === status ? '' : status);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilterType('');
    setFilterStatus('');
    setLocalSearchPlate('');
    setCurrentPage(1);
  };

  const openReassignModal = (order: ExceptionOrder) => {
    setReassignModal({ open: true, order });
    setSelectedAssignee(order.assignee || '');
  };

  const openPlateCorrectModal = (order: ExceptionOrder) => {
    setPlateCorrectModal({ open: true, order });
    setCorrectedPlate(order.plateNumber || '');
  };

  const handlePlateCorrect = () => {
    if (plateCorrectModal.order && correctedPlate.trim()) {
      const plate = correctedPlate.trim();
      const orderId = plateCorrectModal.order.id;
      correctExceptionPlate(orderId, plate);
      updateExceptionStatus(orderId, 'processing');
      setTimeout(() => {
        const space = parkingSpaces.find(s => s.spaceNo === plateCorrectModal.order?.spaceNo);
        const synced = space?.plateNumber === plate;
        alert(`补录成功：新车牌已同步到订单、车位地图${synced ? '' : '（车位同步验证中）'}`);
      }, 50);
    }
    setPlateCorrectModal({ open: false, order: null });
  };

  const handleReassign = () => {
    if (reassignModal.order && selectedAssignee) {
      updateExceptionStatus(reassignModal.order.id, reassignModal.order.status, selectedAssignee);
    }
    setReassignModal({ open: false, order: null });
  };

  const handleStatusChange = (order: ExceptionOrder, status: ExceptionStatus) => {
    const action = status === 'processing' ? '标记处理中' : '标记已解决';
    if (window.confirm(`确定${action}异常 ${order.id}？`)) {
      updateExceptionStatus(order.id, status);
    }
  };

  const handleViewOrder = (plateNumber: string) => {
    setSearchPlate(plateNumber);
    navigate('/orders');
  };

  const handleNotify = (device: Device) => {
    alert(`已通知运维人员处理设备：${device.name}`);
  };

  const columns = [
    { key: 'id', title: '异常单号', width: '110px' },
    {
      key: 'type',
      title: '异常类型',
      width: '120px',
      render: (o: ExceptionOrder) => exceptionTypeMap[o.type],
    },
    { key: 'plateNumber', title: '车牌号', width: '100px', align: 'center' as const, render: (o: ExceptionOrder) => {
      if (!o.plateNumber || o.plateNumber === '-') {
        return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">未识别</span>;
      }
      return o.plateNumber;
    }},
    { key: 'spaceNo', title: '车位号', width: '100px', align: 'center' as const, render: (o: ExceptionOrder) => o.spaceNo || '-' },
    { key: 'description', title: '描述', render: (o: ExceptionOrder) => {
      if (o.type === 'unrecognized_plate' && o.plateNumber && o.plateNumber !== '-') {
        return <span className="text-green-600 font-medium">车牌已补录：{o.plateNumber}</span>;
      }
      return o.description;
    }},
    { key: 'createTime', title: '创建时间', width: '160px', render: (o: ExceptionOrder) => formatDateTime(o.createTime) },
    { key: 'assignee', title: '处理人', width: '90px', align: 'center' as const, render: (o: ExceptionOrder) => o.assignee || '-' },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      align: 'center' as const,
      render: (o: ExceptionOrder) => {
        const s = exceptionStatusMap[o.status];
        return (
          <span className={`tag ${s.bg} ${s.color}`}>{s.label}</span>
        );
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: '360px',
      align: 'center' as const,
      render: (o: ExceptionOrder) => (
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {o.type === 'unrecognized_plate' && (
            <button className="btn btn-ghost text-blue-600 hover:text-blue-700" onClick={() => openPlateCorrectModal(o)}>
              <Pencil size={14} className="mr-1" />补录车牌
            </button>
          )}
          {o.plateNumber && o.plateNumber !== '-' && (
            <button className="btn btn-ghost text-indigo-600 hover:text-indigo-700" onClick={() => handleViewOrder(o.plateNumber!)}>
              <FileText size={14} className="mr-1" />查看关联订单
            </button>
          )}
          <button className="btn btn-ghost text-accent-600 hover:text-accent-700" onClick={() => openReassignModal(o)}>
            <Users size={14} className="mr-1" />改派
          </button>
          {o.status === 'pending' && (
            <button className="btn btn-ghost text-warning hover:text-warning" onClick={() => handleStatusChange(o, 'processing')}>
              <Clock size={14} className="mr-1" />处理中
            </button>
          )}
          {o.status !== 'resolved' && (
            <button className="btn btn-ghost text-success hover:text-success" onClick={() => handleStatusChange(o, 'resolved')}>
              <CheckCircle size={14} className="mr-1" />已解决
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => handleStatClick('pending')}
          className={`card p-5 text-left transition-all ${filterStatus === 'pending' ? 'ring-2 ring-red-400' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/80 mb-1">待处理</div>
              <div className="text-3xl font-bold text-white">{stats.pending}</div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="bg-red-500 -mx-5 -mb-5 -mt-5 rounded-t-lg px-5 py-2" />
        </button>
        <button
          onClick={() => handleStatClick('processing')}
          className={`card p-5 text-left transition-all ${filterStatus === 'processing' ? 'ring-2 ring-yellow-400' : 'hover:shadow-md'}`}
        >
          <div className="bg-yellow-500 -mx-5 -mb-5 -mt-5 rounded-t-lg px-5 py-2" />
          <div className="flex items-center justify-between mt-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">处理中</div>
              <div className="text-3xl font-bold text-gray-800">{stats.processing}</div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">
              <Clock size={24} />
            </div>
          </div>
        </button>
        <button
          onClick={() => handleStatClick('resolved')}
          className={`card p-5 text-left transition-all ${filterStatus === 'resolved' ? 'ring-2 ring-green-400' : 'hover:shadow-md'}`}
        >
          <div className="bg-green-500 -mx-5 -mb-5 -mt-5 rounded-t-lg px-5 py-2" />
          <div className="flex items-center justify-between mt-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">已解决</div>
              <div className="text-3xl font-bold text-gray-800">{stats.resolved}</div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle size={24} />
            </div>
          </div>
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-gray-500" />
          <span className="text-sm text-gray-600">筛选：</span>
        </div>
        <select
          className="input w-auto"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value as ExceptionType | '');
            setCurrentPage(1);
          }}
        >
          <option value="">全部异常类型</option>
          {(Object.keys(exceptionTypeMap) as ExceptionType[]).map((t) => (
            <option key={t} value={t}>
              {exceptionTypeMap[t]}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value as ExceptionStatus | '');
            setCurrentPage(1);
          }}
        >
          <option value="">全部状态</option>
          {(Object.keys(exceptionStatusMap) as ExceptionStatus[]).map((s) => (
            <option key={s} value={s}>
              {exceptionStatusMap[s].label}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="input w-40"
          placeholder="搜索车牌号"
          value={searchPlate}
          onChange={(e) => {
            setLocalSearchPlate(e.target.value);
            setCurrentPage(1);
          }}
        />
        <button className="btn btn-secondary" onClick={handleReset}>
          <RefreshCw size={14} className="mr-1" />重置
        </button>
      </div>

      <DataTable<ExceptionOrder>
        columns={columns}
        data={pagedData}
        rowKey={(r) => r.id}
        currentPage={currentPage}
        total={filteredExceptions.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="text-base font-semibold text-gray-800">设备告警</span>
          </div>
          <div className="text-sm text-gray-500">
            共 <span className="font-medium text-red-600">{alertDevices.length}</span> 台异常设备
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alertDevices.map((device) => {
            const status = deviceStatusMap[device.status];
            return (
              <div key={device.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${status.dot}`} />
                    <span className="font-medium text-gray-800">{device.name}</span>
                  </div>
                  <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                </div>
                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400">类型：</span>
                    <span>{deviceTypeMap[device.type]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">位置：</span>
                    <span>{device.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">最后在线：</span>
                    <span>{formatDateTime(device.lastOnlineTime)}</span>
                  </div>
                </div>
                <button
                  className="btn btn-accent w-full mt-3 justify-center"
                  onClick={() => handleNotify(device)}
                >
                  <Send size={14} className="mr-1" />通知运维
                </button>
              </div>
            );
          })}
          {alertDevices.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-400">暂无告警设备</div>
          )}
        </div>
      </div>

      <BaseModal
        open={reassignModal.open}
        title={`改派异常 - ${reassignModal.order?.id || ''}`}
        size="sm"
        onClose={() => setReassignModal({ open: false, order: null })}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setReassignModal({ open: false, order: null })}>
              取消
            </button>
            <button className="btn btn-accent" onClick={handleReassign} disabled={!selectedAssignee}>
              确认改派
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-3">选择处理人：</p>
          {ASSIGNEES.map((a) => (
            <label
              key={a}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                name="assignee"
                value={a}
                checked={selectedAssignee === a}
                onChange={(e) => setSelectedAssignee(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-400" />
                <span className="font-medium text-gray-800">{a}</span>
              </div>
            </label>
          ))}
        </div>
      </BaseModal>

      <BaseModal
        open={plateCorrectModal.open}
        title={`补录车牌 - ${plateCorrectModal.order?.id || ''}`}
        size="sm"
        onClose={() => setPlateCorrectModal({ open: false, order: null })}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setPlateCorrectModal({ open: false, order: null })}>
              取消
            </button>
            <button className="btn btn-accent" onClick={handlePlateCorrect} disabled={!correctedPlate.trim()}>
              确认补录
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">请输入正确的车牌号：</p>
          <input
            type="text"
            className="input w-full"
            placeholder="请输入车牌号，如：京A12345"
            value={correctedPlate}
            onChange={(e) => setCorrectedPlate(e.target.value)}
          />
        </div>
      </BaseModal>
    </div>
  );
}
