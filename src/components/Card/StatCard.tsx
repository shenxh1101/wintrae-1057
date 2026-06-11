import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: number;
  suffix?: string;
  sublabel?: string;
}

export default function StatCard({ title, value, icon, iconBg, iconColor, trend, suffix, sublabel }: Props) {
  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-500 mb-1">{title}</div>
          <div className="text-2xl font-bold text-gray-800 flex items-baseline gap-1">
            <span>{value}</span>
            {suffix && <span className="text-sm font-normal text-gray-500">{suffix}</span>}
          </div>
          {sublabel && <div className="text-xs text-gray-400 mt-1">{sublabel}</div>}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              {trend >= 0 ? (
                <>
                  <ArrowUpRight size={14} className="text-green-500" />
                  <span className="text-green-600 font-medium">{trend}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight size={14} className="text-red-500" />
                  <span className="text-red-600 font-medium">{Math.abs(trend)}%</span>
                </>
              )}
              <span className="text-gray-400">较昨日</span>
            </div>
          )}
        </div>
        <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', iconBg, iconColor)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
