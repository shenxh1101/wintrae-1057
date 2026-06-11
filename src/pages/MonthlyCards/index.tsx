import { useState, useMemo } from 'react';
import { Plus, Search, RefreshCw, CreditCard, Tag, Pause, Play, FileText, History } from 'lucide-react';
import dayjs from 'dayjs';
import DataTable from '@/components/Table/DataTable';
import BaseModal from '@/components/Modal/BaseModal';
import { useAppStore } from '@/store';
import { cardTypeMap, cardStatusMap, listTypeMap, formatDate } from '@/utils';
import type { MonthlyCard, CardType, RenewalRecord } from '@/types';

const PAGE_SIZE = 10;
const EXPIRY_TABS = [
  { key: 'all', label: '全部' },
  { key: 'expiring', label: '快到期' },
  { key: 'expired', label: '已过期' },
  { key: 'suspended', label: '已暂停' },
];
const LIST_TABS = [
  { key: 'all', label: '全部' },
  { key: 'whitelist', label: '白名单' },
  { key: 'blacklist', label: '黑名单' },
];
const RENEW_OPTIONS = [
  { days: 30, label: '30天' },
  { days: 90, label: '90天' },
  { days: 365, label: '365天' },
];

const getExpiryStatus = (c: MonthlyCard) => {
  const today = dayjs();
  if (c.status === 'suspended') return 'suspended';
  if (dayjs(c.endTime).isBefore(today, 'day')) return 'expired';
  if (dayjs(c.endTime).isBefore(today.add(7, 'day'), 'day') && c.status === 'active') return 'expiring';
  return 'normal';
};

export default function MonthlyCards() {
  const { monthlyCards, buildings, addMonthlyCard, renewMonthlyCard, updateCardListType, toggleCardSuspend } = useAppStore();
  const [expiryTab, setExpiryTab] = useState<string>('all');
  const [listTab, setListTab] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [createModal, setCreateModal] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    plateNumber: '', ownerName: '', phone: '', cardType: 'monthly' as CardType,
    buildingName: buildings[0]?.name || '', startTime: dayjs().format('YYYY-MM-DD'),
  });
  const [renewModal, setRenewModal] = useState<{ open: boolean; card: MonthlyCard | null }>({ open: false, card: null });
  const [renewDays, setRenewDays] = useState<number>(30);
  const [recordsModal, setRecordsModal] = useState<{ open: boolean; card: MonthlyCard | null }>({ open: false, card: null });

  const filteredCards = useMemo(() => {
    return monthlyCards.filter((c) => {
      const expiryStatus = getExpiryStatus(c);
      if (expiryTab !== 'all' && expiryStatus !== expiryTab) return false;
      if (listTab === 'whitelist' && c.listType !== 'whitelist') return false;
      if (listTab === 'blacklist' && c.listType !== 'blacklist') return false;
      if (searchText) {
        const s = searchText.toLowerCase();
        if (!c.plateNumber.toLowerCase().includes(s) && !c.ownerName.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [monthlyCards, expiryTab, listTab, searchText]);

  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCards.slice(start, start + PAGE_SIZE);
  }, [filteredCards, currentPage]);

  const resetCreateForm = () => setCreateForm({
    plateNumber: '', ownerName: '', phone: '', cardType: 'monthly',
    buildingName: buildings[0]?.name || '', startTime: dayjs().format('YYYY-MM-DD'),
  });

  const handleCreate = () => {
    if (!createForm.plateNumber || !createForm.ownerName || !createForm.phone || !createForm.buildingName) {
      alert('请填写完整信息');
      return;
    }
    const durationDays = createForm.cardType === 'monthly' ? 30 : createForm.cardType === 'quarterly' ? 90 : 365;
    addMonthlyCard({
      ...createForm,
      endTime: dayjs(createForm.startTime).add(durationDays - 1, 'day').format('YYYY-MM-DD'),
      status: 'active', listType: 'normal',
    });
    setCreateModal(false);
    resetCreateForm();
  };

  const getNewEndDate = () => {
    if (!renewModal.card) return '';
    return dayjs(renewModal.card.endTime).add(renewDays, 'day').format('YYYY-MM-DD');
  };

  const handleRenew = () => {
    if (renewModal.card) renewMonthlyCard(renewModal.card.id, renewDays);
    setRenewModal({ open: false, card: null });
  };

  const handleToggleSuspend = (card: MonthlyCard) => {
    const action = card.status === 'suspended' ? '恢复' : '暂停';
    if (window.confirm(`确定${action}月卡 ${card.plateNumber}？`)) toggleCardSuspend(card.id);
  };

  const columns = [
    { key: 'plateNumber', title: '车牌号', width: '110px', align: 'center' as const },
    { key: 'ownerName', title: '车主姓名', width: '90px', align: 'center' as const },
    { key: 'phone', title: '手机号', width: '120px', align: 'center' as const },
    { key: 'cardType', title: '卡类型', width: '110px', align: 'center' as const, render: (c: MonthlyCard) => (
      <div className="flex items-center justify-center gap-1">
        <span>{cardTypeMap[c.cardType].label}</span>
        {c.renewalRecords && c.renewalRecords.length > 0 && (
          <History size={12} className="text-gray-400" />
        )}
      </div>
    )},
    { key: 'buildingName', title: '所属楼栋', width: '90px', align: 'center' as const },
    { key: 'startTime', title: '有效期起', width: '110px', align: 'center' as const, render: (c: MonthlyCard) => formatDate(c.startTime) },
    { key: 'endTime', title: '有效期止', width: '110px', align: 'center' as const, render: (c: MonthlyCard) => formatDate(c.endTime) },
    { key: 'expiryAlert', title: '到期提醒', width: '90px', align: 'center' as const, render: (c: MonthlyCard) => {
      const status = getExpiryStatus(c);
      if (status === 'expiring') return <span className="tag bg-orange-100 text-orange-700">快到期</span>;
      if (status === 'expired') return <span className="tag bg-red-100 text-red-700">已过期</span>;
      return null;
    }},
    { key: 'status', title: '卡状态', width: '90px', align: 'center' as const, render: (c: MonthlyCard) => {
      const s = cardStatusMap[c.status];
      return <span className={`tag ${s.bg} ${s.color}`}>{s.label}</span>;
    }},
    { key: 'listType', title: '名单类型', width: '90px', align: 'center' as const, render: (c: MonthlyCard) => {
      const s = listTypeMap[c.listType];
      return <span className={`tag ${s.bg} ${s.color}`}>{s.label}</span>;
    }},
    { key: 'actions', title: '操作', width: '400px', align: 'center' as const, render: (c: MonthlyCard) => (
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {c.status !== 'suspended' && (
          <button className="btn btn-ghost text-accent-600 hover:text-accent-700" onClick={() => setRenewModal({ open: true, card: c })}>
            <CreditCard size={14} className="mr-1" />续费
          </button>
        )}
        <button className="btn btn-ghost text-gray-600 hover:text-gray-700" onClick={() => setRecordsModal({ open: true, card: c })}>
          <FileText size={14} className="mr-1" />续费记录
        </button>
        <div className="relative group">
          <button className="btn btn-ghost"><Tag size={14} className="mr-1" />设置名单</button>
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10 hidden group-hover:block min-w-[100px]">
            <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-700" onClick={() => updateCardListType(c.id, 'normal')}>普通</button>
            <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 text-blue-700" onClick={() => updateCardListType(c.id, 'whitelist')}>白名单</button>
            <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-red-50 text-red-700" onClick={() => updateCardListType(c.id, 'blacklist')}>黑名单</button>
          </div>
        </div>
        <button
          className={`btn btn-ghost ${c.status === 'suspended' ? 'text-green-600 hover:text-green-700' : 'text-orange-600 hover:text-orange-700'}`}
          onClick={() => handleToggleSuspend(c)}
        >
          {c.status === 'suspended' ? <Play size={14} className="mr-1" /> : <Pause size={14} className="mr-1" />}
          {c.status === 'suspended' ? '恢复' : '暂停'}
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {EXPIRY_TABS.map((t) => (
              <button
                key={t.key}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  expiryTab === t.key ? 'bg-accent-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
                onClick={() => { setExpiryTab(t.key); setCurrentPage(1); }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex items-center gap-2">
            {LIST_TABS.map((t) => (
              <button
                key={t.key}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  listTab === t.key ? 'bg-accent-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
                onClick={() => { setListTab(t.key); setCurrentPage(1); }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" className="input pl-9 w-56" placeholder="搜索车牌号/车主姓名"
              value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button className="btn btn-secondary" onClick={() => { setSearchText(''); setExpiryTab('all'); setListTab('all'); setCurrentPage(1); }}>
            <RefreshCw size={14} className="mr-1" />重置
          </button>
          <button className="btn btn-accent" onClick={() => { resetCreateForm(); setCreateModal(true); }}>
            <Plus size={16} className="mr-1" />新建月卡
          </button>
        </div>
      </div>

      <DataTable<MonthlyCard> columns={columns} data={pagedData} rowKey={(r) => r.id}
        currentPage={currentPage} total={filteredCards.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />

      <BaseModal open={createModal} title="新建月卡" size="md" onClose={() => setCreateModal(false)}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>取消</button>
          <button className="btn btn-accent" onClick={handleCreate}>确认创建</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">车牌号</label>
            <input type="text" className="input w-full" placeholder="例如：京A12345"
              value={createForm.plateNumber} onChange={(e) => setCreateForm({ ...createForm, plateNumber: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">车主姓名</label>
            <input type="text" className="input w-full" placeholder="请输入车主姓名"
              value={createForm.ownerName} onChange={(e) => setCreateForm({ ...createForm, ownerName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input type="text" className="input w-full" placeholder="请输入手机号"
              value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">卡类型</label>
            <select className="input w-full" value={createForm.cardType} onChange={(e) => setCreateForm({ ...createForm, cardType: e.target.value as CardType })}>
              {(Object.keys(cardTypeMap) as CardType[]).map((t) => (
                <option key={t} value={t}>{cardTypeMap[t].label}（¥{cardTypeMap[t].price}）</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属楼栋</label>
            <select className="input w-full" value={createForm.buildingName} onChange={(e) => setCreateForm({ ...createForm, buildingName: e.target.value })}>
              {buildings.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input type="date" className="input w-full" value={createForm.startTime}
              onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })} />
          </div>
        </div>
      </BaseModal>

      <BaseModal open={renewModal.open} title="续费月卡" size="sm"
        onClose={() => setRenewModal({ open: false, card: null })}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setRenewModal({ open: false, card: null })}>取消</button>
          <button className="btn btn-accent" onClick={handleRenew}>确认续费</button>
        </>}>
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600">车牌号：<span className="font-medium text-gray-800">{renewModal.card?.plateNumber}</span></div>
            <div className="text-sm text-gray-600 mt-1">当前有效期止：<span className="font-medium text-gray-800">{formatDate(renewModal.card?.endTime)}</span></div>
            <div className="text-sm text-gray-600 mt-1">续费后有效期止：<span className="font-medium text-accent-600">{getNewEndDate()}</span></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择续费时长</label>
            <div className="grid grid-cols-3 gap-2">
              {RENEW_OPTIONS.map((opt) => (
                <button key={opt.days}
                  className={`py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
                    renewDays === opt.days ? 'bg-accent-500 text-white border-accent-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setRenewDays(opt.days)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BaseModal>

      <BaseModal open={recordsModal.open} title={`续费记录 - ${recordsModal.card?.plateNumber || ''}`} size="md"
        onClose={() => setRecordsModal({ open: false, card: null })}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setRecordsModal({ open: false, card: null })}>关闭</button>
        </>}>
        {recordsModal.card?.renewalRecords && recordsModal.card.renewalRecords.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {[...recordsModal.card.renewalRecords].sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf()).map((r: RenewalRecord) => (
              <div key={r.id} className="p-4 bg-gray-50 rounded-md border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium text-gray-800">续费时间：{formatDate(r.time)}</div>
                  <div className="text-sm font-medium text-accent-600">¥{r.amount}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>续费时长：<span className="text-gray-800">{r.days}天</span></div>
                  <div>操作员：<span className="text-gray-800">{r.operator}</span></div>
                  <div>原到期日：<span className="text-gray-800">{formatDate(r.previousEndTime)}</span></div>
                  <div>新到期日：<span className="text-gray-800">{formatDate(r.newEndTime)}</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <div>暂无续费记录</div>
          </div>
        )}
      </BaseModal>
    </div>
  );
}
