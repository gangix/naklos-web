import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

const MobileSheet = ({ open, onClose, children }: MobileSheetProps) => {
  // Lock body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity lg:hidden"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 transition-transform lg:hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        {children}
      </div>
    </>
  );
};

export default MobileSheet;
