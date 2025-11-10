/**
 * Animated Button Component
 *
 * Enhanced button with micro-interactions using framer-motion.
 * Fully compatible with shadcn Button API.
 */

'use client';

import * as React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';
import { hoverScale, hoverScaleSmall } from '@/lib/animations/variants';

// ==================== ANIMATED BUTTON ====================

interface AnimatedButtonProps extends ButtonProps {
  /**
   * Animation intensity
   * - subtle: Small scale (1.05/0.95)
   * - normal: Medium scale (1.02/0.98) - default
   * - none: No animation
   */
  animationIntensity?: 'subtle' | 'normal' | 'none';

  /**
   * Custom motion props (advanced usage)
   */
  motionProps?: Omit<MotionProps, 'className' | 'children'>;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ animationIntensity = 'normal', motionProps, className, children, disabled, ...props }, ref) => {
    // Disable animations if reduced motion is preferred or button is disabled
    const shouldAnimate = animationIntensity !== 'none' && !disabled;

    // Select animation variant based on intensity
    const animation = animationIntensity === 'subtle' ? hoverScaleSmall : hoverScale;

    if (!shouldAnimate) {
      return (
        <Button ref={ref} className={className} disabled={disabled} {...props}>
          {children}
        </Button>
      );
    }

    return (
      <motion.div
        className="inline-flex"
        whileHover={animation.whileHover}
        whileTap={animation.whileTap}
        transition={animation.transition}
        {...motionProps}
      >
        <Button
          ref={ref}
          className={cn('w-full', className)}
          disabled={disabled}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

// ==================== PRESET VARIANTS ====================

/**
 * Primary action button with emphasis animation
 */
export const PrimaryAnimatedButton = React.forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, 'variant'>>(
  (props, ref) => (
    <AnimatedButton ref={ref} variant="default" animationIntensity="normal" {...props} />
  )
);
PrimaryAnimatedButton.displayName = 'PrimaryAnimatedButton';

/**
 * Secondary button with subtle animation
 */
export const SecondaryAnimatedButton = React.forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, 'variant'>>(
  (props, ref) => (
    <AnimatedButton ref={ref} variant="secondary" animationIntensity="subtle" {...props} />
  )
);
SecondaryAnimatedButton.displayName = 'SecondaryAnimatedButton';

/**
 * Ghost button with subtle animation
 */
export const GhostAnimatedButton = React.forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, 'variant'>>(
  (props, ref) => (
    <AnimatedButton ref={ref} variant="ghost" animationIntensity="subtle" {...props} />
  )
);
GhostAnimatedButton.displayName = 'GhostAnimatedButton';

/**
 * Destructive button with emphasis animation
 */
export const DestructiveAnimatedButton = React.forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, 'variant'>>(
  (props, ref) => (
    <AnimatedButton ref={ref} variant="destructive" animationIntensity="normal" {...props} />
  )
);
DestructiveAnimatedButton.displayName = 'DestructiveAnimatedButton';

// ==================== ICON BUTTON ====================

/**
 * Icon-only button with enhanced animation
 */
export const AnimatedIconButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, ...props }, ref) => (
    <AnimatedButton
      ref={ref}
      size="icon"
      variant="ghost"
      animationIntensity="subtle"
      className={cn('rounded-full', className)}
      {...props}
    />
  )
);
AnimatedIconButton.displayName = 'AnimatedIconButton';

// ==================== FAB (Floating Action Button) ====================

interface FABProps extends Omit<AnimatedButtonProps, 'size' | 'className'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ position = 'bottom-right', children, ...props }, ref) => {
    const positionClasses = {
      'bottom-right': 'fixed bottom-6 right-6',
      'bottom-left': 'fixed bottom-6 left-6',
      'top-right': 'fixed top-6 right-6',
      'top-left': 'fixed top-6 left-6',
    };

    return (
      <motion.div
        className={cn(positionClasses[position], 'z-50')}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <AnimatedButton
          ref={ref}
          className="h-14 w-14 rounded-full shadow-lg"
          animationIntensity="normal"
          {...props}
        >
          {children}
        </AnimatedButton>
      </motion.div>
    );
  }
);
FloatingActionButton.displayName = 'FloatingActionButton';

// ==================== BUTTON GROUP ====================

/**
 * Animated button group with stagger effect
 */
interface AnimatedButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function AnimatedButtonGroup({
  children,
  className,
  orientation = 'horizontal',
}: AnimatedButtonGroupProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className={cn(
        'flex gap-2',
        orientation === 'vertical' && 'flex-col',
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ==================== LOADING BUTTON ====================

/**
 * Button with loading state animation
 */
interface LoadingButtonProps extends AnimatedButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <AnimatedButton
        ref={ref}
        disabled={disabled || loading}
        animationIntensity={loading ? 'none' : 'normal'}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <motion.span
              className="inline-block"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              ⟳
            </motion.span>
            {loadingText || 'Loading...'}
          </span>
        ) : (
          children
        )}
      </AnimatedButton>
    );
  }
);
LoadingButton.displayName = 'LoadingButton';

// ==================== SUCCESS BUTTON ====================

/**
 * Button with success animation
 */
interface SuccessButtonProps extends AnimatedButtonProps {
  success?: boolean;
  successText?: string;
  successDuration?: number;
  onSuccessComplete?: () => void;
}

export const SuccessButton = React.forwardRef<HTMLButtonElement, SuccessButtonProps>(
  (
    {
      success,
      successText = 'Success!',
      successDuration = 2000,
      onSuccessComplete,
      children,
      ...props
    },
    ref
  ) => {
    React.useEffect(() => {
      if (success && onSuccessComplete) {
        const timeout = setTimeout(onSuccessComplete, successDuration);
        return () => clearTimeout(timeout);
      }
    }, [success, successDuration, onSuccessComplete]);

    return (
      <AnimatedButton ref={ref} {...props}>
        <motion.span
          initial={false}
          animate={success ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {success ? (
            <span className="flex items-center gap-2">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                ✓
              </motion.span>
              {successText}
            </span>
          ) : (
            children
          )}
        </motion.span>
      </AnimatedButton>
    );
  }
);
SuccessButton.displayName = 'SuccessButton';
