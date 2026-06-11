export type ParkingSpaceStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type OrderStatus = 'parking' | 'pending' | 'paid' | 'refunded' | 'exception';
export type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'monthly';
export type CardType = 'monthly' | 'quarterly' | 'yearly';
export type CardStatus = 'active' | 'expired' | 'suspended';
export type ListType = 'whitelist' | 'blacklist' | 'normal';
export type ExceptionType = 'unrecognized_plate' | 'device_offline' | 'payment_failed' | 'manual_override';
export type ExceptionStatus = 'pending' | 'processing' | 'resolved';
export type DeviceType = 'gate' | 'camera' | 'sensor';
export type DeviceStatus = 'online' | 'offline' | 'warning';

export interface ParkingSpace {
  id: string;
  spaceNo: string;
  floor: number;
  buildingId: string;
  buildingName: string;
  status: ParkingSpaceStatus;
  plateNumber?: string;
  enterTime?: string;
}

export interface ParkingOrder {
  id: string;
  plateNumber: string;
  spaceNo: string;
  buildingName: string;
  enterTime: string;
  exitTime?: string;
  duration: number;
  totalFee: number;
  paidFee: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  couponId?: string;
  remark?: string;
}

export interface MonthlyCard {
  id: string;
  plateNumber: string;
  ownerName: string;
  phone: string;
  cardType: CardType;
  startTime: string;
  endTime: string;
  status: CardStatus;
  listType: ListType;
  buildingName: string;
}

export interface ExceptionOrder {
  id: string;
  orderId?: string;
  type: ExceptionType;
  plateNumber?: string;
  description: string;
  createTime: string;
  assignee?: string;
  status: ExceptionStatus;
  spaceNo?: string;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  buildingName: string;
  location: string;
  status: DeviceStatus;
  lastOnlineTime?: string;
}

export interface RevenueSummary {
  date: string;
  totalRevenue: number;
  tempRevenue: number;
  monthlyRevenue: number;
  orderCount: number;
  avgDuration: number;
}

export interface Building {
  id: string;
  name: string;
  floors: number;
  spaceCount: number;
}

export interface Coupon {
  id: string;
  name: string;
  type: 'discount' | 'amount' | 'free_hours';
  value: number;
  minAmount?: number;
  expireDays: number;
}

export interface DashboardStats {
  totalSpaces: number;
  availableSpaces: number;
  occupiedSpaces: number;
  reservedSpaces: number;
  todayRevenue: number;
  todayOrders: number;
  todayEntry: number;
  todayExit: number;
  exceptionCount: number;
  onlineDevices: number;
  totalDevices: number;
}
