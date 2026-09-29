'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer';
import { cn } from '@/lib/utils';

type DrawerContextProps = {
  hasSnapPoints: boolean;
  modal: DrawerPrimitive.Root.Props['modal'];
  showSwipeHandle: boolean;
  swipeDirection: NonNullable<DrawerPrimitive.Root.Props['swipeDirection']>;
};

const DrawerContext = React.createContext<DrawerContextProps | null>(null);

function useDrawer() {
  const context = React.useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a Drawer.');
  }
  return context;
}

function Drawer({
  modal = true,
  showSwipeHandle = false,
  snapPoints,
  swipeDirection = 'down',
  ...props
}: DrawerPrimitive.Root.Props & {
  showSwipeHandle?: boolean;
}) {
  const hasSnapPoints = snapPoints != null && snapPoints.length > 0;
  const contextValue = React.useMemo(
    () => ({ hasSnapPoints, modal, showSwipeHandle, swipeDirection }),
    [hasSnapPoints, modal, showSwipeHandle, swipeDirection]
  );

  return (
    <DrawerContext.Provider value={contextValue}>
      <DrawerPrimitive.Root
        data-slot='drawer'
        modal={modal}
        snapPoints={snapPoints}
        swipeDirection={swipeDirection}
        {...props}
      />
    </DrawerContext.Provider>
  );
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot='drawer-trigger' {...props} />;
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot='drawer-portal' {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot='drawer-close' {...props} />;
}

function DrawerOverlay({ className, ...props }: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot='drawer-overlay'
      className={cn(
        'fixed inset-0 z-50 min-h-dvh bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-out select-none',
        className
      )}
      {...props}
    />
  );
}

function DrawerSwipeHandle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='drawer-swipe-handle'
      aria-hidden='true'
      className={cn(
        'mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30',
        className
      )}
      {...props}
    />
  );
}

function DrawerContent({ className, children, ...props }: DrawerPrimitive.Popup.Props) {
  const { modal, showSwipeHandle } = useDrawer();

  return (
    <DrawerPortal data-slot='drawer-portal'>
      {modal === true && <DrawerOverlay />}
      <DrawerPrimitive.Viewport
        data-slot='drawer-viewport'
        data-modal={modal}
        className='pointer-events-none fixed inset-0 z-50 select-none data-[modal=true]:pointer-events-auto'
      >
        <DrawerPrimitive.Popup
          data-slot='drawer-popup'
          className={cn(
            'pointer-events-auto fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t bg-background shadow-xl outline-none select-none transition-transform duration-300 ease-out',
            className
          )}
          {...props}
        >
          {showSwipeHandle && <DrawerSwipeHandle />}
          <DrawerPrimitive.Content
            data-slot='drawer-content'
            className='flex min-h-0 flex-1 flex-col overflow-y-auto p-4 select-text'
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='drawer-header'
      className={cn('flex shrink-0 flex-col gap-1 p-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='drawer-footer'
      className={cn('mt-auto flex shrink-0 flex-col gap-2 pt-4', className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot='drawer-title'
      className={cn('text-base font-semibold text-foreground', className)}
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot='drawer-description'
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerSwipeHandle,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription
};
