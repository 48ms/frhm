'use client';

import * as React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { AnimatePresence, motion } from 'motion/react';

type SelectProps = React.ComponentProps<typeof RadixSelect.Root>;

function Select(props: SelectProps) {
  return <RadixSelect.Root data-slot="select" {...props} />;
}

type SelectTriggerProps = React.ComponentProps<typeof RadixSelect.Trigger>;

function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  return (
    <RadixSelect.Trigger
      data-slot="select-trigger"
      className={className}
      {...props}
    >
      {children}
    </RadixSelect.Trigger>
  );
}

type SelectContentProps = React.ComponentProps<typeof RadixSelect.Content>;

function SelectContent({
  className,
  position = 'popper',
  children,
  ...props
}: SelectContentProps) {
  return (
    <AnimatePresence>
      <RadixSelect.Portal>
        <RadixSelect.Content
          data-slot="select-content"
          className={className}
          position={position}
          asChild
          {...props}
        >
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </AnimatePresence>
  );
}

type SelectValueProps = React.ComponentProps<typeof RadixSelect.Value>;

function SelectValue(props: SelectValueProps) {
  return <RadixSelect.Value data-slot="select-value" {...props} />;
}

type SelectGroupProps = React.ComponentProps<typeof RadixSelect.Group>;

function SelectGroup(props: SelectGroupProps) {
  return <RadixSelect.Group data-slot="select-group" {...props} />;
}

type SelectItemProps = React.ComponentProps<typeof RadixSelect.Item>;

function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <RadixSelect.Item
      data-slot="select-item"
      className={className}
      {...props}
    >
      {children}
    </RadixSelect.Item>
  );
}

type SelectLabelProps = React.ComponentProps<typeof RadixSelect.Label>;

function SelectLabel(props: SelectLabelProps) {
  return <RadixSelect.Label data-slot="select-label" {...props} />;
}

type SelectSeparatorProps = React.ComponentProps<typeof RadixSelect.Separator>;

function SelectSeparator(props: SelectSeparatorProps) {
  return <RadixSelect.Separator data-slot="select-separator" {...props} />;
}

type SelectScrollUpButtonProps = React.ComponentProps<
  typeof RadixSelect.ScrollUpButton
>;

function SelectScrollUpButton(props: SelectScrollUpButtonProps) {
  return <RadixSelect.ScrollUpButton {...props} />;
}

type SelectScrollDownButtonProps = React.ComponentProps<
  typeof RadixSelect.ScrollDownButton
>;

function SelectScrollDownButton(props: SelectScrollDownButtonProps) {
  return <RadixSelect.ScrollDownButton {...props} />;
}

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  type SelectProps,
  type SelectTriggerProps,
  type SelectContentProps,
  type SelectValueProps,
  type SelectGroupProps,
  type SelectItemProps,
  type SelectLabelProps,
  type SelectSeparatorProps,
  type SelectScrollUpButtonProps,
  type SelectScrollDownButtonProps,
};
