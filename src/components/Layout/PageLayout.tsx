import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const titleMap: Record<string, string> = {
  '/dashboard': '车场总览',
  '/parking-map': '车位地图',
  '/orders': '订单中心',
  '/monthly-cards': '月卡管理',
  '/exceptions': '异常处理',
  '/reports': '统计报表',
};

export default function PageLayout() {
  const location = useLocation();
  const title = titleMap[location.pathname] || '智慧停车';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
