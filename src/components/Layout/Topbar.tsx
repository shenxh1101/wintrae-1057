import { Bell, Search, User, Settings } from 'lucide-react';
import { useAppStore } from '@/store';

export default function Topbar({ title }: { title: string }) {
  const { dashboardStats, setSearchPlate } = useAppStore();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索车牌号..."
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent w-full"
            onChange={(e) => setSearchPlate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-gray-600">
            设备在线 <span className="font-medium text-gray-800">{dashboardStats.onlineDevices}/{dashboardStats.totalDevices}</span>
          </span>
        </div>
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          <Bell size={18} />
          {dashboardStats.exceptionCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {dashboardStats.exceptionCount}
            </span>
          )}
        </button>
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          <Settings size={18} />
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center">
            <User size={16} />
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-800">管理员</div>
            <div className="text-xs text-gray-500">超级管理员</div>
          </div>
        </div>
      </div>
    </header>
  );
}
