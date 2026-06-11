import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function BaseModal({ open, title, onClose, children, footer, size = 'md' }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={clsx(
          'relative bg-white rounded-lg shadow-xl w-full mx-4 animate-slide-up',
          size === 'sm' && 'max-w-md',
          size === 'md' && 'max-w-2xl',
          size === 'lg' && 'max-w-4xl'
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
