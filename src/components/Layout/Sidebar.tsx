import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Receipt,
  CreditCard,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Car,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { clsx } from 'clsx';

const menuItems = [
  { path: '/dashboard', label: '车场总览', icon: LayoutDashboard },
  { path: '/parking-map', label: '车位地图', icon: Map },
  { path: '/orders', label: '订单中心', icon: Receipt },
  { path: '/monthly-cards', label: '月卡管理', icon: CreditCard },
  { path: '/exceptions', label: '异常处理', icon: AlertTriangle },
  { path: '/reports', label: '统计报表', icon: BarChart3 },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, dashboardStats } = useAppStore();

  return (
    <aside
      className={clsx(
        'h-screen bg-primary-500 text-white flex flex-col transition-all duration-300 sticky top-0',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="h-16 flex items-center gap-3 px-4 border-b border-primary-600">
        <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center shrink-0">
          <Car size={18} />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-base whitespace-nowrap">智慧停车</div>
            <div className="text-xs text-gray-300 whitespace-nowrap">园区运营管理系统</div>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              clsx(
                'sidebar-item',
                isActive && 'sidebar-item-active',
                sidebarCollapsed && 'justify-center px-0'
              )
            }
          >
            <Icon size={18} />
            {!sidebarCollapsed && <span>{label}</span>}
            {!sidebarCollapsed && path === '/exceptions' && dashboardStats.exceptionCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {dashboardStats.exceptionCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-primary-600">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-primary-600 rounded-md transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!sidebarCollapsed && <span>收起菜单</span>}
        </button>
      </div>
    </aside>
  );
}
