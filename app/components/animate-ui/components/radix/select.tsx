import * as React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  Select as SelectPrimitive,
  SelectTrigger as SelectTriggerPrimitive,
  SelectContent as SelectContentPrimitive,
  SelectValue as SelectValuePrimitive,
  SelectGroup as SelectGroupPrimitive,
  SelectItem as SelectItemPrimitive,
  SelectLabel as SelectLabelPrimitive,
  SelectSeparator as SelectSeparatorPrimitive,
  SelectScrollUpButton as SelectScrollUpButtonPrimitive,
  SelectScrollDownButton as SelectScrollDownButtonPrimitive,
  type SelectProps as SelectPrimitiveProps,
  type SelectTriggerProps as SelectTriggerPrimitiveProps,
  type SelectContentProps as SelectContentPrimitiveProps,
  type SelectValueProps as SelectValuePrimitiveProps,
  type SelectGroupProps as SelectGroupPrimitiveProps,
  type SelectItemProps as SelectItemPrimitiveProps,
  type SelectLabelProps as SelectLabelPrimitiveProps,
  type SelectSeparatorProps as SelectSeparatorPrimitiveProps,
  type SelectScrollUpButtonProps as SelectScrollUpButtonPrimitiveProps,
  type SelectScrollDownButtonProps as SelectScrollDownButtonPrimitiveProps,
} from '@/components/animate-ui/primitives/radix/select';

const Select = SelectPrimitive;

function SelectGroup({ className, ...props }: SelectGroupPrimitiveProps) {
  return (
    <SelectGroupPrimitive
      data-slot="select-group"
      className={cn('scroll-my-1 p-1', className)}
      {...props}
    />
  );
}

function SelectValue({ className, ...props }: SelectValuePrimitiveProps) {
  return (
    <SelectValuePrimitive
      data-slot="select-value"
      className={cn('flex flex-1 text-left', className)}
      {...props}
    />
  );
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: SelectTriggerPrimitiveProps & { size?: 'sm' | 'default' }) {
  return (
    <SelectTriggerPrimitive
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        'flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        className,
      )}
      {...props}
    >
      {children}
      <RadixSelect.Icon asChild>
        <Icons.chevronDown className="pointer-events-none size-4 text-muted-foreground" />
      </RadixSelect.Icon>
    </SelectTriggerPrimitive>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: SelectContentPrimitiveProps) {
  return (
    <SelectContentPrimitive
      data-slot="select-content"
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <RadixSelect.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </RadixSelect.Viewport>
      <SelectScrollDownButton />
    </SelectContentPrimitive>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectLabelPrimitiveProps) {
  return (
    <SelectLabelPrimitive
      data-slot="select-label"
      className={cn('py-1.5 pl-8 pr-2 text-xs font-semibold', className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectItemPrimitiveProps) {
  return (
    <SelectItemPrimitive
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <RadixSelect.ItemIndicator>
          <Icons.check className="size-4" />
        </RadixSelect.ItemIndicator>
      </span>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </SelectItemPrimitive>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectSeparatorPrimitiveProps) {
  return (
    <SelectSeparatorPrimitive
      data-slot="select-separator"
      className={cn('-mx-1 my-1 h-px bg-muted', className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: SelectScrollUpButtonPrimitiveProps) {
  return (
    <SelectScrollUpButtonPrimitive
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className,
      )}
      {...props}
    >
      <Icons.chevronUp className="size-4" />
    </SelectScrollUpButtonPrimitive>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: SelectScrollDownButtonPrimitiveProps) {
  return (
    <SelectScrollDownButtonPrimitive
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className,
      )}
      {...props}
    >
      <Icons.chevronDown className="size-4" />
    </SelectScrollDownButtonPrimitive>
  );
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
};
