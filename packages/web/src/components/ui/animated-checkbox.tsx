/**
 * Animated Checkbox Component
 *
 * Checkbox with satisfying check animation using framer-motion.
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkboxCheck, checkboxBox } from '@/lib/animations/variants';

// ==================== ANIMATED CHECKBOX ====================

export interface AnimatedCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Checkbox size
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Disable animation
   */
  noAnimation?: boolean;
}

export const AnimatedCheckbox = React.forwardRef<HTMLInputElement, AnimatedCheckboxProps>(
  (
    {
      className,
      checked = false,
      onCheckedChange,
      size = 'md',
      noAnimation = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const iconSizes = {
      sm: 12,
      md: 16,
      lg: 20,
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
    };

    if (noAnimation || disabled) {
      return (
        <div className="relative inline-flex">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              'peer appearance-none rounded border-2 transition-colors',
              'border-gray-300 hover:border-primary',
              'checked:bg-primary checked:border-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              sizeClasses[size],
              className
            )}
            {...props}
          />
          {checked && (
            <Check
              className="absolute inset-0 m-auto text-primary-foreground pointer-events-none"
              size={iconSizes[size]}
            />
          )}
        </div>
      );
    }

    return (
      <div className="relative inline-flex">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <motion.div
          className={cn(
            'rounded border-2 cursor-pointer flex items-center justify-center',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-50',
            sizeClasses[size],
            className
          )}
          variants={checkboxBox}
          initial={checked ? 'checked' : 'unchecked'}
          animate={checked ? 'checked' : 'unchecked'}
          onClick={() => !disabled && onCheckedChange?.(!checked)}
        >
          <AnimatePresence mode="wait">
            {checked && (
              <motion.div
                key="check"
                variants={checkboxCheck}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Check
                  className="text-primary-foreground"
                  size={iconSizes[size]}
                  strokeWidth={3}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }
);

AnimatedCheckbox.displayName = 'AnimatedCheckbox';

// ==================== CHECKBOX WITH LABEL ====================

interface AnimatedCheckboxWithLabelProps extends AnimatedCheckboxProps {
  label: string;
  description?: string;
}

export function AnimatedCheckboxWithLabel({
  label,
  description,
  className,
  ...props
}: AnimatedCheckboxWithLabelProps) {
  return (
    <div className={cn('flex items-start space-x-3', className)}>
      <AnimatedCheckbox {...props} className="mt-1" />
      <div className="flex-1 space-y-1 cursor-pointer" onClick={() => props.onCheckedChange?.(!props.checked)}>
        <label className="text-sm font-medium leading-none cursor-pointer select-none">
          {label}
        </label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

// ==================== CHECKBOX GROUP ====================

interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface AnimatedCheckboxGroupProps {
  options: CheckboxOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  className?: string;
}

export function AnimatedCheckboxGroup({
  options,
  value,
  onValueChange,
  className,
}: AnimatedCheckboxGroupProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 },
  };

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onValueChange(newValue);
  };

  return (
    <motion.div
      className={cn('space-y-3', className)}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {options.map((option) => (
        <motion.div key={option.value} variants={itemVariants}>
          <AnimatedCheckboxWithLabel
            checked={value.includes(option.value)}
            onCheckedChange={() => handleToggle(option.value)}
            label={option.label}
            description={option.description}
            disabled={option.disabled}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

// ==================== TOGGLE CHECKBOX (Switch Style) ====================

interface ToggleCheckboxProps extends AnimatedCheckboxProps {
  onLabel?: string;
  offLabel?: string;
}

export function ToggleCheckbox({
  checked,
  onCheckedChange,
  onLabel = 'On',
  offLabel = 'Off',
  disabled,
  className,
  ...props
}: ToggleCheckboxProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          checked ? 'bg-primary' : 'bg-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        <motion.span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
          initial={false}
          animate={{
            x: checked ? 24 : 4,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        />
      </motion.button>
      <span className="text-sm font-medium select-none">
        {checked ? onLabel : offLabel}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
    </div>
  );
}

// ==================== CHECKBOX CARD ====================

interface CheckboxCardProps extends AnimatedCheckboxProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function CheckboxCard({
  title,
  description,
  icon,
  checked,
  onCheckedChange,
  disabled,
  className,
  ...props
}: CheckboxCardProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-lg border-2 p-4 cursor-pointer transition-all',
        'hover:border-primary hover:shadow-md',
        checked && 'border-primary bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
    >
      <div className="flex items-start gap-4">
        {icon && <div className="flex-shrink-0 text-primary">{icon}</div>}
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <AnimatedCheckbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          {...props}
        />
      </div>
    </motion.div>
  );
}
