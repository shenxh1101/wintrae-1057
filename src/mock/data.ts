import dayjs from 'dayjs';
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

export const buildings: Building[] = [
  { id: 'b1', name: 'A栋', floors: 3, spaceCount: 200 },
  { id: 'b2', name: 'B栋', floors: 2, spaceCount: 150 },
  { id: 'b3', name: 'C栋', floors: 3, spaceCount: 180 },
];

const plates = [
  '京A12345', '京B88888', '沪C66666', '粤D99999', '川E77777',
  '浙F55555', '苏G33333', '鲁H22222', '豫J11111', '冀K44444',
  '皖L00000', '闽M12121', '陕N34343', '湘P56565', '鄂Q78787',
];

export const generateParkingSpaces = (): ParkingSpace[] => {
  const spaces: ParkingSpace[] = [];
  const statuses: ParkingSpace['status'][] = ['available', 'occupied', 'occupied', 'occupied', 'reserved', 'maintenance'];

  buildings.forEach((building) => {
    for (let floor = 1; floor <= building.floors; floor++) {
      const countPerFloor = Math.floor(building.spaceCount / building.floors);
      for (let i = 1; i <= countPerFloor; i++) {
        const spaceNo = `${building.name.replace('栋', '')}${floor}F-${String(i).padStart(3, '0')}`;
        const rand = Math.random();
        let status: ParkingSpace['status'];
        if (rand < 0.45) status = 'available';
        else if (rand < 0.88) status = 'occupied';
        else if (rand < 0.95) status = 'reserved';
        else status = 'maintenance';

        spaces.push({
          id: `${building.id}-${floor}-${i}`,
          spaceNo,
          floor,
          buildingId: building.id,
          buildingName: building.name,
          status,
          plateNumber: status === 'occupied' || status === 'reserved' ? plates[Math.floor(Math.random() * plates.length)] : undefined,
          enterTime: status === 'occupied' ? dayjs().subtract(Math.random() * 300, 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
        });
      }
    }
  });
  return spaces;
};

export const parkingSpaces: ParkingSpace[] = generateParkingSpaces();

export const parkingOrders: ParkingOrder[] = Array.from({ length: 80 }, (_, i) => {
  const isParking = i < 30;
  const enterTime = dayjs().subtract(Math.random() * 7200, 'minute');
  const exitTime = isParking ? undefined : enterTime.add(Math.random() * 480 + 30, 'minute');
  const duration = exitTime ? exitTime.diff(enterTime, 'minute') : dayjs().diff(enterTime, 'minute');
  const totalFee = Math.floor(duration / 30) * 5 + 5;
  const paidFee = isParking ? 0 : totalFee;
  const status: ParkingOrder['status'] = isParking ? 'parking' : ['paid', 'paid', 'paid', 'refunded', 'exception'][i % 5] as ParkingOrder['status'];
  const methods: ParkingOrder['paymentMethod'][] = ['wechat', 'alipay', 'cash', 'monthly'];

  return {
    id: `ORD${String(i + 1).padStart(6, '0')}`,
    plateNumber: plates[Math.floor(Math.random() * plates.length)],
    spaceNo: parkingSpaces[i % parkingSpaces.length].spaceNo,
    buildingName: buildings[i % buildings.length].name,
    enterTime: enterTime.format('YYYY-MM-DD HH:mm:ss'),
    exitTime: exitTime?.format('YYYY-MM-DD HH:mm:ss'),
    duration,
    totalFee,
    paidFee: status === 'refunded' ? 0 : paidFee,
    status,
    paymentMethod: isParking ? undefined : methods[Math.floor(Math.random() * methods.length)],
    remark: i % 11 === 0 ? '客户投诉道闸反应慢' : undefined,
  };
});

export const monthlyCards: MonthlyCard[] = Array.from({ length: 35 }, (_, i) => {
  const cardTypes: MonthlyCard['cardType'][] = ['monthly', 'quarterly', 'yearly'];
  const cardStatuses: MonthlyCard['status'][] = ['active', 'active', 'active', 'expired', 'suspended'];
  const listTypes: MonthlyCard['listType'][] = ['normal', 'normal', 'normal', 'whitelist', 'blacklist'];
  const cardType = cardTypes[i % cardTypes.length];
  const durationDays = cardType === 'monthly' ? 30 : cardType === 'quarterly' ? 90 : 365;
  const startTime = dayjs().subtract(Math.random() * 180, 'day');
  const endTime = startTime.add(durationDays, 'day');
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];

  return {
    id: `MC${String(i + 1).padStart(5, '0')}`,
    plateNumber: plates[i % plates.length],
    ownerName: names[i % names.length],
    phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    cardType,
    startTime: startTime.format('YYYY-MM-DD'),
    endTime: endTime.format('YYYY-MM-DD'),
    status: cardStatuses[i % cardStatuses.length],
    listType: listTypes[i % listTypes.length],
    buildingName: buildings[i % buildings.length].name,
  };
});

const exceptionTypes: ExceptionOrder['type'][] = ['unrecognized_plate', 'device_offline', 'payment_failed', 'manual_override'];
const exceptionStatuses: ExceptionOrder['status'][] = ['pending', 'processing', 'resolved'];
const assignees = ['客服小王', '客服小李', '运维小张', null];

export const exceptionOrders: ExceptionOrder[] = Array.from({ length: 25 }, (_, i) => {
  const type = exceptionTypes[i % exceptionTypes.length];
  const descriptions: Record<ExceptionOrder['type'], string> = {
    unrecognized_plate: '车牌识别失败，需人工确认',
    device_offline: '道闸设备离线超过10分钟',
    payment_failed: '微信支付回调异常，需核实',
    manual_override: '手动放行未缴费车辆',
  };

  return {
    id: `EX${String(i + 1).padStart(5, '0')}`,
    type,
    description: descriptions[type],
    plateNumber: type === 'device_offline' ? undefined : plates[i % plates.length],
    createTime: dayjs().subtract(Math.random() * 720, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    assignee: assignees[i % assignees.length] ?? undefined,
    status: exceptionStatuses[i % exceptionStatuses.length],
    spaceNo: parkingSpaces[i % parkingSpaces.length].spaceNo,
  };
});

const deviceNames = ['入口道闸', '出口道闸', '车牌摄像头', '地感线圈', '车位探测器'];
const deviceTypes: Device['type'][] = ['gate', 'gate', 'camera', 'sensor', 'sensor'];

export const devices: Device[] = Array.from({ length: 18 }, (_, i) => {
  const deviceStatuses: Device['status'][] = ['online', 'online', 'online', 'online', 'offline', 'warning'];
  const status = deviceStatuses[i % deviceStatuses.length];

  return {
    id: `DEV${String(i + 1).padStart(4, '0')}`,
    name: `${deviceNames[i % deviceNames.length]}${Math.floor(i / 5) + 1}`,
    type: deviceTypes[i % deviceTypes.length],
    buildingName: buildings[i % buildings.length].name,
    location: `${buildings[i % buildings.length].name}${i % 3 === 0 ? '入口' : '出口'}`,
    status,
    lastOnlineTime: status === 'online' ? undefined : dayjs().subtract(Math.random() * 60, 'minute').format('YYYY-MM-DD HH:mm:ss'),
  };
});

export const revenueSummary: RevenueSummary[] = Array.from({ length: 30 }, (_, i) => {
  const date = dayjs().subtract(29 - i, 'day').format('YYYY-MM-DD');
  const tempRevenue = Math.floor(Math.random() * 3000) + 2000;
  const monthlyRevenue = Math.floor(Math.random() * 1500) + 500;
  return {
    date,
    totalRevenue: tempRevenue + monthlyRevenue,
    tempRevenue,
    monthlyRevenue,
    orderCount: Math.floor(Math.random() * 200) + 100,
    avgDuration: Math.floor(Math.random() * 60) + 30,
  };
});

export const hourlyOccupancy: { hour: number; rate: number }[] = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  rate: i >= 8 && i <= 10 ? 90 + Math.random() * 8 : i >= 12 && i <= 14 ? 75 + Math.random() * 10 : i >= 18 && i <= 21 ? 85 + Math.random() * 10 : i >= 0 && i <= 6 ? 20 + Math.random() * 15 : 50 + Math.random() * 25,
}));

export const dashboardStats: DashboardStats = {
  totalSpaces: parkingSpaces.length,
  availableSpaces: parkingSpaces.filter((s) => s.status === 'available').length,
  occupiedSpaces: parkingSpaces.filter((s) => s.status === 'occupied').length,
  reservedSpaces: parkingSpaces.filter((s) => s.status === 'reserved').length,
  todayRevenue: revenueSummary[revenueSummary.length - 1].totalRevenue,
  todayOrders: revenueSummary[revenueSummary.length - 1].orderCount,
  todayEntry: Math.floor(revenueSummary[revenueSummary.length - 1].orderCount * 0.6),
  todayExit: Math.floor(revenueSummary[revenueSummary.length - 1].orderCount * 0.55),
  exceptionCount: exceptionOrders.filter((e) => e.status !== 'resolved').length,
  onlineDevices: devices.filter((d) => d.status === 'online').length,
  totalDevices: devices.length,
};

export const couponPlans = [
  { id: 'c1', name: '2小时免费券', type: 'free_hours' as const, value: 2, expireDays: 7 },
  { id: 'c2', name: '满20减5券', type: 'amount' as const, value: 5, minAmount: 20, expireDays: 15 },
  { id: 'c3', name: '8折优惠券', type: 'discount' as const, value: 0.8, expireDays: 30 },
];
