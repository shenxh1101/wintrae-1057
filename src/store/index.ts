import { create } from 'zustand';
import {
  dashboardStats,
  parkingSpaces,
  parkingOrders,
  monthlyCards,
  exceptionOrders,
  devices,
  revenueSummary,
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
} from '@/types';

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
  updateExceptionStatus: (id: string, status: ExceptionOrder['status'], assignee?: string) => void;
  addMonthlyCard: (card: Omit<MonthlyCard, 'id'>) => void;
  renewMonthlyCard: (id: string, days: number) => void;
  updateCardListType: (id: string, listType: MonthlyCard['listType']) => void;
  toggleCardSuspend: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),

  dashboardStats,
  buildings,
  parkingSpaces,
  parkingOrders,
  monthlyCards,
  exceptionOrders,
  devices,
  revenueSummary,

  selectedBuildingId: null,
  selectedFloor: null,
  searchPlate: '',

  setSelectedBuilding: (id) => set({ selectedBuildingId: id, selectedFloor: null }),
  setSelectedFloor: (floor) => set({ selectedFloor: floor }),
  setSearchPlate: (p) => set({ searchPlate: p }),

  updateOrderStatus: (id, status, paidFee, remark) =>
    set({
      parkingOrders: get().parkingOrders.map((o) =>
        o.id === id ? { ...o, status, paidFee: paidFee ?? o.paidFee, remark: remark ?? o.remark } : o
      ),
    }),

  addOrderRemark: (id, remark) =>
    set({
      parkingOrders: get().parkingOrders.map((o) => (o.id === id ? { ...o, remark } : o)),
    }),

  updateExceptionStatus: (id, status, assignee) =>
    set({
      exceptionOrders: get().exceptionOrders.map((e) =>
        e.id === id ? { ...e, status, assignee: assignee ?? e.assignee } : e
      ),
    }),

  addMonthlyCard: (card) =>
    set({
      monthlyCards: [
        { ...card, id: `MC${Date.now()}` },
        ...get().monthlyCards,
      ],
    }),

  renewMonthlyCard: (id, days) =>
    set({
      monthlyCards: get().monthlyCards.map((c) => {
        if (c.id !== id) return c;
        const start = new Date(c.endTime);
        start.setDate(start.getDate() + 1);
        const end = new Date(start);
        end.setDate(end.getDate() + days);
        return {
          ...c,
          status: 'active',
          startTime: start.toISOString().slice(0, 10),
          endTime: end.toISOString().slice(0, 10),
        };
      }),
    }),

  updateCardListType: (id, listType) =>
    set({
      monthlyCards: get().monthlyCards.map((c) => (c.id === id ? { ...c, listType } : c)),
    }),

  toggleCardSuspend: (id) =>
    set({
      monthlyCards: get().monthlyCards.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          status: c.status === 'suspended' ? 'active' : 'suspended',
        };
      }),
    }),
}));
