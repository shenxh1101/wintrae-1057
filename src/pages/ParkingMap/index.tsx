import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import BaseModal from '@/components/Modal/BaseModal';
import {
  formatDuration,
  formatDateTime,
  spaceStatusMap,
  formatCurrency,
  calcFee,
} from '@/utils';
import { Search, MapPin, Car } from 'lucide-react';
import type { ParkingSpace } from '@/types';
import dayjs from 'dayjs';

export default function ParkingMap() {
  const {
    buildings,
    parkingSpaces,
    selectedBuildingId,
    selectedFloor,
    setSelectedBuilding,
    setSelectedFloor,
    searchPlate,
  } = useAppStore();

  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [tooltipSpace, setTooltipSpace] = useState<ParkingSpace | null>(null);

  const currentBuilding = buildings.find((b) => b.id === selectedBuildingId);

  const floors = useMemo(() => {
    if (!currentBuilding) return [];
    return Array.from({ length: currentBuilding.floors }, (_, i) => i + 1);
  }, [currentBuilding]);

  const filteredSpaces = useMemo(() => {
    return parkingSpaces.filter((s) => {
      if (selectedBuildingId && s.buildingId !== selectedBuildingId) return false;
      if (selectedFloor !== null && s.floor !== selectedFloor) return false;
      return true;
    });
  }, [parkingSpaces, selectedBuildingId, selectedFloor]);

  const stats = useMemo(() => {
    const total = filteredSpaces.length;
    const available = filteredSpaces.filter((s) => s.status === 'available').length;
    const occupied = filteredSpaces.filter((s) => s.status === 'occupied').length;
    const reserved = filteredSpaces.filter((s) => s.status === 'reserved').length;
    const maintenance = filteredSpaces.filter((s) => s.status === 'maintenance').length;
    return { total, available, occupied, reserved, maintenance };
  }, [filteredSpaces]);

  const isHighlighted = (space: ParkingSpace) => {
    if (!searchPlate || !space.plateNumber) return false;
    return space.plateNumber.toLowerCase().includes(searchPlate.toLowerCase());
  };

  const getDuration = (enterTime?: string) => {
    if (!enterTime) return 0;
    return dayjs().diff(dayjs(enterTime), 'minute');
  };

  const handleBuildingClick = (id: string) => {
    setSelectedBuilding(selectedBuildingId === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-accent-500" />
            <span className="text-sm font-medium text-gray-700">楼栋选择：</span>
            <div className="flex gap-2">
              {buildings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleBuildingClick(b.id)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    selectedBuildingId === b.id
                      ? 'bg-accent-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {currentBuilding && (
            <div className="flex items-center gap-2">
              <Car size={18} className="text-accent-500" />
              <span className="text-sm font-medium text-gray-700">楼层：</span>
              <div className="flex gap-2">
                {floors.map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFloor(selectedFloor === f ? null : f)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      selectedFloor === f
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f}F
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchPlate && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-md">
              <Search size={14} className="text-yellow-600" />
              <span className="text-xs text-yellow-700">
                搜索车牌: <span className="font-semibold">{searchPlate}</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {(Object.keys(spaceStatusMap) as Array<keyof typeof spaceStatusMap>).map((key) => {
            const cfg = spaceStatusMap[key];
            const count = stats[key as 'available' | 'occupied' | 'reserved' | 'maintenance'];
            return (
              <div key={key} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded ${cfg.dot}`} />
                <span className="text-sm text-gray-600">
                  {cfg.label}
                  <span className="ml-1 font-semibold text-gray-800">{count}</span>
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500">
              共 <span className="font-semibold text-gray-800">{stats.total}</span> 个车位
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {filteredSpaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MapPin size={48} className="mb-3 opacity-50" />
            <p className="text-sm">请选择楼栋和楼层查看车位</p>
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}
          >
            {filteredSpaces.map((space) => {
              const cfg = spaceStatusMap[space.status];
              const highlight = isHighlighted(space);
              return (
                <div
                  key={space.id}
                  className={`relative w-16 h-12 rounded border-2 flex items-center justify-center text-xs font-medium cursor-pointer transition-all hover:scale-105 hover:shadow-md ${cfg.bg} ${
                    highlight ? 'ring-2 ring-yellow-400 ring-offset-1 animate-pulse-slow' : ''
                  }`}
                  onClick={() => setSelectedSpace(space)}
                  onMouseEnter={() => setTooltipSpace(space)}
                  onMouseLeave={() => setTooltipSpace(null)}
                >
                  <span className={cfg.color}>{space.spaceNo.split('-')[1]}</span>
                  {tooltipSpace?.id === space.id && (
                    <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap pointer-events-none">
                      <div className="font-semibold mb-1">{space.spaceNo}</div>
                      <div className="text-gray-300">状态: {cfg.label}</div>
                      {space.plateNumber && (
                        <div className="text-gray-300">车牌: {space.plateNumber}</div>
                      )}
                      {space.enterTime && (
                        <div className="text-gray-300">
                          已停: {formatDuration(getDuration(space.enterTime))}
                        </div>
                      )}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BaseModal
        open={!!selectedSpace}
        title="车位详情"
        onClose={() => setSelectedSpace(null)}
        size="sm"
      >
        {selectedSpace && (() => {
          const cfg = spaceStatusMap[selectedSpace.status];
          const duration = getDuration(selectedSpace.enterTime);
          const fee = calcFee(duration);
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <div className="text-lg font-bold text-gray-800">{selectedSpace.spaceNo}</div>
                  <div className="text-sm text-gray-500">
                    {selectedSpace.buildingName} · {selectedSpace.floor}F
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">车牌号</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedSpace.plateNumber || '-'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">入场时间</span>
                  <span className="text-sm font-medium text-gray-800">
                    {formatDateTime(selectedSpace.enterTime)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">已停时长</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedSpace.enterTime ? formatDuration(duration) : '-'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">预计费用</span>
                  <span className="text-lg font-bold text-accent-500">
                    {selectedSpace.status === 'occupied' ? formatCurrency(fee) : '-'}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </BaseModal>
    </div>
  );
}
