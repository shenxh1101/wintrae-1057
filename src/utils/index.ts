import dayjs from 'dayjs';
import type {
  ParkingSpaceStatus,
  OrderStatus,
  PaymentMethod,
  CardType,
  CardStatus,
  ListType,
  ExceptionType,
  ExceptionStatus,
  DeviceType,
  DeviceStatus,
} from '@/types';

export const formatCurrency = (n: number) => `¥${n.toFixed(2)}`;

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
};

export const formatDateTime = (s?: string) => s || '-';

export const formatDate = (s?: string) => (s ? s.slice(0, 10) : '-');

export const getHoursSince = (timeStr: string) => {
  const diff = dayjs().diff(dayjs(timeStr), 'minute');
  return formatDuration(diff);
};

export const spaceStatusMap: Record<ParkingSpaceStatus, { label: string; color: string; bg: string; dot: string }> = {
  available: { label: '空闲', color: 'text-green-700', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  occupied: { label: '占用', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  reserved: { label: '预约', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
  maintenance: { label: '维护', color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
};

export const orderStatusMap: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  parking: { label: '停车中', color: 'text-blue-700', bg: 'bg-blue-100' },
  pending: { label: '待支付', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  paid: { label: '已支付', color: 'text-green-700', bg: 'bg-green-100' },
  refunded: { label: '已退款', color: 'text-gray-600', bg: 'bg-gray-100' },
  exception: { label: '异常', color: 'text-red-700', bg: 'bg-red-100' },
};

export const paymentMethodMap: Record<PaymentMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金',
  monthly: '月卡',
};

export const cardTypeMap: Record<CardType, { label: string; price: number }> = {
  monthly: { label: '月卡', price: 300 },
  quarterly: { label: '季卡', price: 800 },
  yearly: { label: '年卡', price: 3000 },
};

export const cardStatusMap: Record<CardStatus, { label: string; color: string; bg: string }> = {
  active: { label: '生效中', color: 'text-green-700', bg: 'bg-green-100' },
  expired: { label: '已过期', color: 'text-gray-600', bg: 'bg-gray-100' },
  suspended: { label: '已暂停', color: 'text-orange-700', bg: 'bg-orange-100' },
};

export const listTypeMap: Record<ListType, { label: string; color: string; bg: string }> = {
  normal: { label: '普通', color: 'text-gray-700', bg: 'bg-gray-100' },
  whitelist: { label: '白名单', color: 'text-blue-700', bg: 'bg-blue-100' },
  blacklist: { label: '黑名单', color: 'text-red-700', bg: 'bg-red-100' },
};

export const exceptionTypeMap: Record<ExceptionType, string> = {
  unrecognized_plate: '车牌识别失败',
  device_offline: '设备离线',
  payment_failed: '支付异常',
  manual_override: '人工放行',
};

export const exceptionStatusMap: Record<ExceptionStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'text-red-700', bg: 'bg-red-100' },
  processing: { label: '处理中', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  resolved: { label: '已解决', color: 'text-green-700', bg: 'bg-green-100' },
};

export const deviceTypeMap: Record<DeviceType, string> = {
  gate: '道闸',
  camera: '摄像头',
  sensor: '传感器',
};

export const deviceStatusMap: Record<DeviceStatus, { label: string; color: string; dot: string }> = {
  online: { label: '在线', color: 'text-green-600', dot: 'bg-green-500' },
  offline: { label: '离线', color: 'text-red-600', dot: 'bg-red-500' },
  warning: { label: '告警', color: 'text-yellow-600', dot: 'bg-yellow-500' },
};

export const calcFee = (minutes: number, rate = 5, perMin = 30, base = 5) => {
  if (minutes <= 15) return 0;
  return base + Math.floor(minutes / perMin) * rate;
};
