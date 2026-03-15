import { cn } from '@shared/lib/clsx/clsx';
import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Button = ({ children, onClick, className }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md',
        'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </button>
  );
};
