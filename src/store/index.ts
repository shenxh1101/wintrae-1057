import { create } from 'zustand';
import {
  dashboardStats as mockDashboardStats,
  parkingSpaces as mockParkingSpaces,
  parkingOrders as mockParkingOrders,
  monthlyCards as mockMonthlyCards,
  exceptionOrders as mockExceptionOrders,
  devices as mockDevices,
  revenueSummary as mockRevenueSummary,
  buildings as mockBuildings,
  parkingLots,
} from '@/mock/data';
import type {
  ParkingSpace,
  ParkingOrder,
  MonthlyCard,
  ExceptionOrder,
  Device,
  RevenueSummary,
  Building,
  DashboardStats,
  CouponRecord,
  OperationLog,
  RenewalRecord,
  ParkingLot,
} from '@/types';

const STORAGE_KEY = 'smart-parking-state-v2';

interface PersistedState {
  parkingOrders: ParkingOrder[];
  monthlyCards: MonthlyCard[];
  exceptionOrders: ExceptionOrder[];
  parkingSpaces: ParkingSpace[];
  selectedBuildingId: string | null;
  selectedFloor: number | null;
  searchPlate: string;
  lastTraceExceptionId: string | null;
  lastTraceOrderId: string | null;
}

function loadPersisted(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function savePersisted(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

const persisted = loadPersisted();

const CURRENT_OPERATOR = '管理员';

const addLog = (order: ParkingOrder, log: Omit<OperationLog, 'id' | 'orderId' | 'time'>): ParkingOrder => {
  const operationLogs = [...(order.operationLogs || []), {
    ...log,
    id: `LOG${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    orderId: order.id,
    time: new Date().toISOString(),
  }];
  return { ...order, operationLogs };
};

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  dashboardStats: DashboardStats;
  parkingLots: ParkingLot[];
  buildings: Building[];
  parkingSpaces: ParkingSpace[];
  parkingOrders: ParkingOrder[];
  monthlyCards: MonthlyCard[];
  exceptionOrders: ExceptionOrder[];
  devices: Device[];
  revenueSummary: RevenueSummary[];

  selectedBuildingId: string | null;
  selectedFloor: number | null;
  searchPlate: string;
  lastTraceExceptionId: string | null;
  lastTraceOrderId: string | null;

  setSelectedBuilding: (id: string | null) => void;
  setSelectedFloor: (floor: number | null) => void;
  setSearchPlate: (p: string) => void;
  setLastTraceExceptionId: (id: string | null) => void;
  setLastTraceOrderId: (id: string | null) => void;

  updateOrderStatus: (id: string, status: ParkingOrder['status'], paidFee?: number) => void;
  addOrderRemark: (id: string, remark: string) => void;
  issueCoupon: (id: string, record: CouponRecord) => void;
  updateExceptionStatus: (id: string, status: ExceptionOrder['status'], assignee?: string) => void;
  correctExceptionPlate: (id: string, plateNumber: string, matchedOrderId?: string) => void;
  addMonthlyCard: (card: Omit<MonthlyCard, 'id'>) => void;
  renewMonthlyCard: (id: string, days: number) => RenewalRecord | null;
  updateCardListType: (id: string, listType: MonthlyCard['listType']) => void;
  toggleCardSuspend: (id: string) => void;
  resetData: () => void;
}

const getInitialOrders = (): ParkingOrder[] =>
  persisted.parkingOrders ?? mockParkingOrders;
const getInitialCards = (): MonthlyCard[] =>
  persisted.monthlyCards ?? mockMonthlyCards;
const getInitialExceptions = (): ExceptionOrder[] =>
  persisted.exceptionOrders ?? mockExceptionOrders;
const getInitialSpaces = (): ParkingSpace[] =>
  persisted.parkingSpaces ?? mockParkingSpaces;

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),

  dashboardStats: mockDashboardStats,
  parkingLots,
  buildings: mockBuildings,
  parkingSpaces: getInitialSpaces(),
  parkingOrders: getInitialOrders(),
  monthlyCards: getInitialCards(),
  exceptionOrders: getInitialExceptions(),
  devices: mockDevices,
  revenueSummary: mockRevenueSummary,

  selectedBuildingId: persisted.selectedBuildingId ?? null,
  selectedFloor: persisted.selectedFloor ?? null,
  searchPlate: persisted.searchPlate ?? '',
  lastTraceExceptionId: persisted.lastTraceExceptionId ?? null,
  lastTraceOrderId: persisted.lastTraceOrderId ?? null,

  setSelectedBuilding: (id) => {
    set({ selectedBuildingId: id, selectedFloor: null });
    savePersisted({
      parkingOrders: get().parkingOrders,
      monthlyCards: get().monthlyCards,
      exceptionOrders: get().exceptionOrders,
      parkingSpaces: get().parkingSpaces,
      selectedBuildingId: id,
      selectedFloor: null,
      searchPlate: get().searchPlate,
      lastTraceExceptionId: get().lastTraceExceptionId,
      lastTraceOrderId: get().lastTraceOrderId,
    });
  },
  setSelectedFloor: (floor) => {
    set({ selectedFloor: floor });
    savePersisted({
      parkingOrders: get().parkingOrders,
      monthlyCards: get().monthlyCards,
      exceptionOrders: get().exceptionOrders,
      parkingSpaces: get().parkingSpaces,
      selectedBuildingId: get().selectedBuildingId,
      selectedFloor: floor,
      searchPlate: get().searchPlate,
      lastTraceExceptionId: get().lastTraceExceptionId,
      lastTraceOrderId: get().lastTraceOrderId,
    });
  },
  setSearchPlate: (p) => {
    set({ searchPlate: p });
    savePersisted({
      parkingOrders: get().parkingOrders,
      monthlyCards: get().monthlyCards,
      exceptionOrders: get().exceptionOrders,
      parkingSpaces: get().parkingSpaces,
      selectedBuildingId: get().selectedBuildingId,
      selectedFloor: get().selectedFloor,
      searchPlate: p,
      lastTraceExceptionId: get().lastTraceExceptionId,
      lastTraceOrderId: get().lastTraceOrderId,
    });
  },
  setLastTraceExceptionId: (id) => {
    set({ lastTraceExceptionId: id });
    savePersisted({
      parkingOrders: get().parkingOrders,
      monthlyCards: get().monthlyCards,
      exceptionOrders: get().exceptionOrders,
      parkingSpaces: get().parkingSpaces,
      selectedBuildingId: get().selectedBuildingId,
      selectedFloor: get().selectedFloor,
      searchPlate: get().searchPlate,
      lastTraceExceptionId: id,
      lastTraceOrderId: get().lastTraceOrderId,
    });
  },
  setLastTraceOrderId: (id) => {
    set({ lastTraceOrderId: id });
    savePersisted({
      parkingOrders: get().parkingOrders,
      monthlyCards: get().monthlyCards,
      exceptionOrders: get().exceptionOrders,
      parkingSpaces: get().parkingSpaces,
      selectedBuildingId: get().selectedBuildingId,
      selectedFloor: get().selectedFloor,
      searchPlate: get().searchPlate,
      lastTraceExceptionId: get().lastTraceExceptionId,
      lastTraceOrderId: id,
    });
  },

  updateOrderStatus: (id, status, paidFee) => {
    const action = status === 'refunded' ? 'refund' : status === 'paid' ? 'pay' : 'remark';
    const detail = status === 'refunded' ? '订单退款' : status === 'paid' ? '订单补缴' : '状态更新';

    const parkingOrders = get().parkingOrders.map((o) => {
      if (o.id !== id) return o;
      let updated: ParkingOrder = { ...o, status, paidFee: paidFee ?? o.paidFee };
      updated = addLog(updated, { action, operator: CURRENT_OPERATOR, detail });
      return updated;
    });

    savePersisted({
      parkingOrders,
      monthlyCards: get().monthlyCards,
      exceptionOrders: get().exceptionOrders,
      parkingSpaces: get().parkingSpaces,
      selectedBuildingId: get().selectedBuildingId,
      selectedFloor: get().selectedFloor,
      searchPlate: get().searchPlate,
      lastTraceExceptionId: get().lastTraceExceptionId,
      lastTraceOrderId: get().lastTraceOrderId,
    });
    set({ parkingOrders });
  },

  addOrderRemark: (id, remark) => {
    const parkingOrders = get().parkingOrders.map((o) => {
      if (o.id !== id) return o;
      const existingRemark = o.remark ? `${o.remark}\n` : '';
      const newRemark = `${existingRemark}[${CURRENT_OPERATOR} ${new Date().toLocaleString('zh-CN')}] ${remark}`;
      let updated: ParkingOrder = { ...o, remark: newRemark };
      updated = addLog(updated, { action: 'remark', operator: CURRENT_OPERATOR, detail: remark });
      return updated;
    });
    savePersisted({
      parkingOrders,
      monthlyCards: get().monthlyCards,
      exceptionOrders: get().exceptionOrders,
      parkingSpaces: get().parkingSpaces,
      selectedBuildingId: get().selectedBuildingId,
      selectedFloor: get().selectedFloor,
      searchPlate: get().searchPlate,
      lastTraceExceptionId: get().lastTraceExceptionId,
      lastTraceOrderId: get().lastTraceOrderId,
    });
    set({ parkingOrders });
  },

  issueCoupon: (id, record) => {
    const parkingOrders = get().parkingOrders.map((o) => {
      if (o.id !== id) return o;
      const couponRecords = [...(o.couponRecords || []), record];
      let updated: ParkingOrder = { ...o, couponRecords, couponId: record.couponId };
      updated = addLog(updated, { action: 'coupon', operator: CURRENT_OPERATOR, detail: `发放优惠券: ${record.couponName}` });
      return updated;
    });
    savePersisted({
      parkingOrders,
      monthlyCards: get().monthlyCards,
      exceptionOrders: get().exceptionOrders,
      parkingSpaces: get().parkingSpaces,
      selectedBuildingId: get().selectedBuildingId,
      selectedFloor: get().selectedFloor,
      searchPlate: get().searchPlate,
      lastTraceExceptionId: get().lastTraceExceptionId,
      lastTraceOrderId: get().lastTraceOrderId,
    });
    set({ parkingOrders });
  },

  updateExceptionStatus: (id, status, assignee) => {
    const exceptionOrders = get().exceptionOrders.map((e) =>
      e.id === id ? { ...e, status, assignee: assignee ?? e.assignee } : e
    );
    const lastTraceExceptionId = status === 'resolved' && get().lastTraceExceptionId === id
      ? null
      : get().lastTraceExceptionId;
    if (status === 'resolved' && get().lastTraceExceptionId === id) {
      set({ lastTraceExceptionId: null });
    }
    savePersisted({
      parkingOrders: get().parkingOrders,
      monthlyCards: get().monthlyCards,
      exceptionOrders,
      parkingSpaces: get().parkingSpaces,
      selectedBuildingId: get().selectedBuildingId,
      selectedFloor: get().selectedFloor,
      searchPlate: get().searchPlate,
      lastTraceExceptionId,
      lastTraceOrderId: get().lastTraceOrderId,
    });
    set({ exceptionOrders });
  },

  correctExceptionPlate: (id, plateNumber, matchedOrderId) => {
    let exceptionOrders = get().exceptionOrders.map((e) =>
      e.id === id ? { ...e, plateNumber } : e
    );
    let parkingOrders = get().parkingOrders;
    let parkingSpaces = get().parkingSpaces;
    let matchingOrderId: string | undefined;

    const exc = exceptionOrders.find((e) => e.id === id);
    if (matchedOrderId) {
      exceptionOrders = exceptionOrders.map(e => e.id === id ? { ...e, orderId: matchedOrderId } : e);
      matchingOrderId = matchedOrderId;
      parkingOrders = parkingOrders.map((o) => {
        if (o.id !== matchedOrderId) return o;
        let updated: ParkingOrder = { ...o, plateNumber };
        updated = addLog(updated, {
          action: 'plate_correct',
          operator: CURRENT_OPERATOR,
          detail: `修正车牌: ${plateNumber}`,
        });
        return updated;
      });
    }
    if (exc) {
      if (exc.orderId && !matchedOrderId) {
        matchingOrderId = exc.orderId;
        parkingOrders = parkingOrders.map((o) => {
          if (o.id !== exc.orderId) return o;
          let updated: ParkingOrder = { ...o, plateNumber };
          updated = addLog(updated, {
            action: 'plate_correct',
            operator: CURRENT_OPERATOR,
            detail: `修正车牌: ${plateNumber}`,
          });
          return updated;
        });
      } else {
        parkingOrders = parkingOrders.map((o) => {
          if (o.plateNumber || !exc) return o;
          if (exc.spaceNo && o.spaceNo === exc.spaceNo && o.status === 'exception') {
            matchingOrderId = o.id;
            exceptionOrders = exceptionOrders.map(e => e.id === id ? { ...e, orderId: o.id } : e);
            let updated: ParkingOrder = { ...o, plateNumber };
            updated = addLog(updated, {
              action: 'plate_correct',
              operator: CURRENT_OPERATOR,
              detail: `补录车牌: ${plateNumber}`,
            });
            return updated;
          }
          return o;
        });
      }

      if (exc.spaceNo) {
        parkingSpaces = parkingSpaces.map((s) => {
          if (s.spaceNo === exc.spaceNo && s.status === 'occupied') {
            return { ...s, plateNumber };
          }
          return s;
        });
      }
    }

    exceptionOrders = exceptionOrders.map(e =>
      e.id === id ? { ...e, status: 'processing' as const, orderId: matchingOrderId ?? e.orderId } : e
    );

    if (matchingOrderId) {
      set({
        lastTraceExceptionId: id,
        lastTraceOrderId: matchingOrderId,
      });
    }

    savePersisted({
      parkingOrders,
      monthlyCards: get().monthlyCards,
      exceptionOrders,
      parkingSpaces,
      selectedBuildingId: get().selectedBuildingId,
      selectedFloor: get().selectedFloor,
      searchPlate: get().searchPlate,
      lastTraceExceptionId: matchingOrderId ? id : get().lastTraceExceptionId,
      lastTraceOrderId: matchingOrderId ?? get().lastTraceOrderId,
    });
    set({ exceptionOrders, parkingOrders, parkingSpaces });
  },

  addMonthlyCard: (card) => {
    const b = get().buildings.find(b => b.name === card.buildingName);
    const monthlyCards = [{
      ...card,
      id: `MC${Date.now()}`,
      lotId: b?.lotId,
      lotName: b?.lotName,
    }, ...get().monthlyCards];
    savePersisted({
      parkingOrders: get().parkingOrders,
      monthlyCards,
      exceptionOrders: get().exceptionOrders,
      parkingSpaces: get().parkingSpaces,
      selectedBuildingId: get().selectedBuildingId,
      selectedFloor: get().selectedFloor,
      searchPlate: get().searchPlate,
      lastTraceExceptionId: get().lastTraceExceptionId,
      lastTraceOrderId: get().lastTraceOrderId,
    });
    set({ monthlyCards });
  },

  renewMonthlyCard: (id, days) => {
    const renewalPrices: Record<number, number> = { 30: 300, 90: 800, 365: 3000 };
    const amount = renewalPrices[days] || Math.ceil(days / 30) * 100;

    let resultRecord: RenewalRecord | null = null;

    const monthlyCards = get().monthlyCards.map((c) => {
      if (c.id !== id) return c;
      const start = new Date(c.endTime);
      start.setDate(start.getDate() + 1);
      const end = new Date(start);
      end.setDate(end.getDate() + days - 1);
      const previousEndTime = c.endTime;
      const newEndTime = end.toISOString().slice(0, 10);
      const renewalRecord: RenewalRecord = {
        id: `RR${Date.now()}`,
        cardId: c.id,
        previousEndTime,
        newEndTime,
        days,
        amount,
        operator: CURRENT_OPERATOR,
        time: new Date().toISOString(),
      };
      resultRecord = renewalRecord;
      const renewalRecords = [...(c.renewalRecords || []), renewalRecord];
      return {
        ...c,
        status: 'active' as const,
        startTime: start.toISOString().slice(0, 10),
        endTime: newEndTime,
        renewalRecords,
      };
    });
    savePersisted({
      parkingOrders: get().parkingOrders,
      monthlyCards,
      exceptionOrders: get().exceptionOrders,
      parkingSpaces: get().parkingSpaces,
      selectedBuildingId: get().selectedBuildingId,
      selectedFloor: get().selectedFloor,
      searchPlate: get().searchPlate,
      lastTraceExceptionId: get().lastTraceExceptionId,
      lastTraceOrderId: get().lastTraceOrderId,
    });
    set({ monthlyCards });
    return resultRecord;
  },

  updateCardListType: (id, listType) => {
    const monthlyCards = get().monthlyCards.map((c) => (c.id === id ? { ...c, listType } : c));
    savePersisted({
      parkingOrders: get().parkingOrders,
      monthlyCards,
      exceptionOrders: get().exceptionOrders,
      parkingSpaces: get().parkingSpaces,
      selectedBuildingId: get().selectedBuildingId,
      selectedFloor: get().selectedFloor,
      searchPlate: get().searchPlate,
      lastTraceExceptionId: get().lastTraceExceptionId,
      lastTraceOrderId: get().lastTraceOrderId,
    });
    set({ monthlyCards });
  },

  toggleCardSuspend: (id) => {
    const monthlyCards = get().monthlyCards.map((c) => {
      if (c.id !== id) return c;
      return { ...c, status: c.status === 'suspended' ? 'active' as const : 'suspended' as const };
    });
    savePersisted({
      parkingOrders: get().parkingOrders,
      monthlyCards,
      exceptionOrders: get().exceptionOrders,
      parkingSpaces: get().parkingSpaces,
      selectedBuildingId: get().selectedBuildingId,
      selectedFloor: get().selectedFloor,
      searchPlate: get().searchPlate,
      lastTraceExceptionId: get().lastTraceExceptionId,
      lastTraceOrderId: get().lastTraceOrderId,
    });
    set({ monthlyCards });
  },

  resetData: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      parkingOrders: mockParkingOrders,
      monthlyCards: mockMonthlyCards,
      exceptionOrders: mockExceptionOrders,
      parkingSpaces: mockParkingSpaces,
      selectedBuildingId: null,
      selectedFloor: null,
      searchPlate: '',
      lastTraceExceptionId: null,
      lastTraceOrderId: null,
    });
  },
}));
