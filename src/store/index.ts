import { create } from 'zustand';
import {
  dashboardStats as mockDashboardStats,
  parkingSpaces as mockParkingSpaces,
  parkingOrders as mockParkingOrders,
  monthlyCards as mockMonthlyCards,
  exceptionOrders as mockExceptionOrders,
  devices as mockDevices,
  revenueSummary as mockRevenueSummary,
  buildings,
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
} from '@/types';

const STORAGE_KEY = 'smart-parking-state';

interface PersistedState {
  parkingOrders: ParkingOrder[];
  monthlyCards: MonthlyCard[];
  exceptionOrders: ExceptionOrder[];
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

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  dashboardStats: DashboardStats;
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

  setSelectedBuilding: (id: string | null) => void;
  setSelectedFloor: (floor: number | null) => void;
  setSearchPlate: (p: string) => void;

  updateOrderStatus: (id: string, status: ParkingOrder['status'], paidFee?: number, remark?: string) => void;
  addOrderRemark: (id: string, remark: string) => void;
  issueCoupon: (id: string, record: CouponRecord) => void;
  updateExceptionStatus: (id: string, status: ExceptionOrder['status'], assignee?: string) => void;
  correctExceptionPlate: (id: string, plateNumber: string) => void;
  addMonthlyCard: (card: Omit<MonthlyCard, 'id'>) => void;
  renewMonthlyCard: (id: string, days: number) => void;
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

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),

  dashboardStats: mockDashboardStats,
  buildings,
  parkingSpaces: mockParkingSpaces,
  parkingOrders: getInitialOrders(),
  monthlyCards: getInitialCards(),
  exceptionOrders: getInitialExceptions(),
  devices: mockDevices,
  revenueSummary: mockRevenueSummary,

  selectedBuildingId: null,
  selectedFloor: null,
  searchPlate: '',

  setSelectedBuilding: (id) => set({ selectedBuildingId: id, selectedFloor: null }),
  setSelectedFloor: (floor) => set({ selectedFloor: floor }),
  setSearchPlate: (p) => set({ searchPlate: p }),

  updateOrderStatus: (id, status, paidFee, remark) => {
    const parkingOrders = get().parkingOrders.map((o) =>
      o.id === id ? { ...o, status, paidFee: paidFee ?? o.paidFee, remark: remark ?? o.remark } : o
    );
    savePersisted({ parkingOrders, monthlyCards: get().monthlyCards, exceptionOrders: get().exceptionOrders });
    set({ parkingOrders });
  },

  addOrderRemark: (id, remark) => {
    const parkingOrders = get().parkingOrders.map((o) => (o.id === id ? { ...o, remark } : o));
    savePersisted({ parkingOrders, monthlyCards: get().monthlyCards, exceptionOrders: get().exceptionOrders });
    set({ parkingOrders });
  },

  issueCoupon: (id, record) => {
    const parkingOrders = get().parkingOrders.map((o) => {
      if (o.id !== id) return o;
      const couponRecords = [...(o.couponRecords || []), record];
      return { ...o, couponRecords, couponId: record.couponId };
    });
    savePersisted({ parkingOrders, monthlyCards: get().monthlyCards, exceptionOrders: get().exceptionOrders });
    set({ parkingOrders });
  },

  updateExceptionStatus: (id, status, assignee) => {
    const exceptionOrders = get().exceptionOrders.map((e) =>
      e.id === id ? { ...e, status, assignee: assignee ?? e.assignee } : e
    );
    savePersisted({ parkingOrders: get().parkingOrders, monthlyCards: get().monthlyCards, exceptionOrders });
    set({ exceptionOrders });
  },

  correctExceptionPlate: (id, plateNumber) => {
    const exceptionOrders = get().exceptionOrders.map((e) =>
      e.id === id ? { ...e, plateNumber } : e
    );
    let parkingOrders = get().parkingOrders;
    const exc = exceptionOrders.find((e) => e.id === id);
    if (exc?.orderId) {
      parkingOrders = parkingOrders.map((o) =>
        o.id === exc.orderId ? { ...o, plateNumber } : o
      );
    }
    parkingOrders = parkingOrders.map((o) => {
      if (o.plateNumber || !exc) return o;
      if (exc.spaceNo && o.spaceNo === exc.spaceNo && o.status === 'exception') {
        return { ...o, plateNumber };
      }
      return o;
    });
    savePersisted({ parkingOrders, monthlyCards: get().monthlyCards, exceptionOrders });
    set({ exceptionOrders, parkingOrders });
  },

  addMonthlyCard: (card) => {
    const monthlyCards = [{ ...card, id: `MC${Date.now()}` }, ...get().monthlyCards];
    savePersisted({ parkingOrders: get().parkingOrders, monthlyCards, exceptionOrders: get().exceptionOrders });
    set({ monthlyCards });
  },

  renewMonthlyCard: (id, days) => {
    const monthlyCards = get().monthlyCards.map((c) => {
      if (c.id !== id) return c;
      const start = new Date(c.endTime);
      start.setDate(start.getDate() + 1);
      const end = new Date(start);
      end.setDate(end.getDate() + days);
      return {
        ...c,
        status: 'active' as const,
        startTime: start.toISOString().slice(0, 10),
        endTime: end.toISOString().slice(0, 10),
      };
    });
    savePersisted({ parkingOrders: get().parkingOrders, monthlyCards, exceptionOrders: get().exceptionOrders });
    set({ monthlyCards });
  },

  updateCardListType: (id, listType) => {
    const monthlyCards = get().monthlyCards.map((c) => (c.id === id ? { ...c, listType } : c));
    savePersisted({ parkingOrders: get().parkingOrders, monthlyCards, exceptionOrders: get().exceptionOrders });
    set({ monthlyCards });
  },

  toggleCardSuspend: (id) => {
    const monthlyCards = get().monthlyCards.map((c) => {
      if (c.id !== id) return c;
      return { ...c, status: c.status === 'suspended' ? 'active' as const : 'suspended' as const };
    });
    savePersisted({ parkingOrders: get().parkingOrders, monthlyCards, exceptionOrders: get().exceptionOrders });
    set({ monthlyCards });
  },

  resetData: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      parkingOrders: mockParkingOrders,
      monthlyCards: mockMonthlyCards,
      exceptionOrders: mockExceptionOrders,
    });
  },
}));
