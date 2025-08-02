'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react';

// ===== RESPONSIVE CONTAINER =====
interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  maxWidth = 'xl'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  return (
    <div className={`
      responsive-container
      ${maxWidthClasses[maxWidth]}
      ${className}
    `}>
      {children}
    </div>
  );
};

// ===== RESPONSIVE GRID =====
interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    large?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  cols = { mobile: 1, tablet: 2, desktop: 3, large: 4 },
  gap = 'md'
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const gridColsClasses = `
    grid-cols-${cols.mobile}
    sm:grid-cols-${cols.tablet}
    lg:grid-cols-${cols.desktop}
    xl:grid-cols-${cols.large}
  `;

  return (
    <div className={`
      responsive-grid
      grid
      ${gridColsClasses}
      ${gapClasses[gap]}
      ${className}
    `}>
      {children}
    </div>
  );
};

// ===== RESPONSIVE CARD =====
interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  onClick,
  hover = true
}) => {
  return (
    <div 
      className={`
        responsive-card
        ${hover ? 'hover:shadow-md hover:-translate-y-1' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// ===== TOUCH BUTTON =====
interface TouchButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button'
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        touch-button
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// ===== MOBILE NAVIGATION =====
interface MobileNavigationProps {
  children: ReactNode;
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  children,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.mobile-nav-menu') && !target.closest('.mobile-nav-toggle')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        className="mobile-nav-toggle lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-nav-menu ${isOpen ? 'open' : ''}`}>
        <div className="mobile-nav-content">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="mobile-nav-close"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="space-y-2">
            {children}
          </nav>
        </div>
      </div>
    </>
  );
};

// ===== RESPONSIVE FORM =====
interface ResponsiveFormProps {
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  onSubmit,
  className = ''
}) => {
  return (
    <form 
      onSubmit={onSubmit}
      className={`responsive-form ${className}`}
    >
      {children}
    </form>
  );
};

interface ResponsiveFormRowProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveFormRow: React.FC<ResponsiveFormRowProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`responsive-form-row ${className}`}>
      {children}
    </div>
  );
};

interface ResponsiveFormGroupProps {
  children: ReactNode;
  label?: string;
  required?: boolean;
  className?: string;
}

export const ResponsiveFormGroup: React.FC<ResponsiveFormGroupProps> = ({
  children,
  label,
  required = false,
  className = ''
}) => {
  return (
    <div className={`responsive-form-group ${className}`}>
      {label && (
        <label className="responsive-form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
    </div>
  );
};

// ===== RESPONSIVE INPUT =====
interface ResponsiveInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  accept?: string;
}

export const ResponsiveInput: React.FC<ResponsiveInputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  disabled = false,
  required = false,
  name,
  id,
  accept
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      name={name}
      id={id}
      accept={accept}
      className={`responsive-form-input ${className}`}
    />
  );
};

// ===== RESPONSIVE SELECT =====
interface ResponsiveSelectProps {
  children: ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
}

export const ResponsiveSelect: React.FC<ResponsiveSelectProps> = ({
  children,
  value,
  onChange,
  className = '',
  disabled = false,
  required = false,
  name,
  id
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      name={name}
      id={id}
      className={`responsive-form-select ${className}`}
    >
      {children}
    </select>
  );
};

// ===== RESPONSIVE TABLE =====
interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`responsive-table-container ${className}`}>
      <table className="responsive-table">
        {children}
      </table>
    </div>
  );
};

// ===== RESPONSIVE MODAL =====
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = ''
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="responsive-modal-overlay" onClick={onClose}>
      <div 
        className={`responsive-modal ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="responsive-modal-header">
          <h2 className="responsive-modal-title">{title}</h2>
          <button
            onClick={onClose}
            className="responsive-modal-close"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="responsive-modal-body">
          {children}
        </div>
        
        {footer && (
          <div className="responsive-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ===== COLLAPSIBLE SECTION =====
interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50"
      >
        <span className="font-medium">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ===== RESPONSIVE DASHBOARD CARD =====
interface DashboardCardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  children,
  action,
  className = ''
}) => {
  return (
    <div className={`dashboard-card ${className}`}>
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">{title}</h3>
        {action && <div>{action}</div>}
      </div>
      <div className="dashboard-card-content">
        {children}
      </div>
    </div>
  );
};

// ===== UTILITY COMPONENTS =====

// Screen reader only text
export const ScreenReaderOnly: React.FC<{ children: ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// Responsive text component
interface ResponsiveTextProps {
  children: ReactNode;
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = 'base',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-responsive-sm',
    base: 'text-responsive-base',
    lg: 'text-responsive-lg',
    xl: 'text-responsive-xl',
    '2xl': 'text-responsive-2xl'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
};

// Responsive spacing component
interface ResponsiveSpacingProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveSpacing: React.FC<ResponsiveSpacingProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`space-responsive ${className}`}>
      {children}
    </div>
  );
};

// Export all components
export {
  ResponsiveContainer as Container,
  ResponsiveGrid as Grid,
  ResponsiveCard as Card,
  TouchButton as Button,
  MobileNavigation as Navigation,
  ResponsiveForm as Form,
  ResponsiveFormRow as FormRow,
  ResponsiveFormGroup as FormGroup,
  ResponsiveInput as Input,
  ResponsiveSelect as Select,
  ResponsiveTable as Table,
  ResponsiveModal as Modal,
  CollapsibleSection as Collapsible,

  ScreenReaderOnly as SrOnly,
  ResponsiveText as Text,
  ResponsiveSpacing as Spacing
}; 