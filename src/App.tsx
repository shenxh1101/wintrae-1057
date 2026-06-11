import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PageLayout from '@/components/Layout/PageLayout';
import Dashboard from '@/pages/Dashboard';
import ParkingMap from '@/pages/ParkingMap';
import Orders from '@/pages/Orders';
import MonthlyCards from '@/pages/MonthlyCards';
import Exceptions from '@/pages/Exceptions';
import Reports from '@/pages/Reports';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PageLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="parking-map" element={<ParkingMap />} />
          <Route path="orders" element={<Orders />} />
          <Route path="monthly-cards" element={<MonthlyCards />} />
          <Route path="exceptions" element={<Exceptions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
