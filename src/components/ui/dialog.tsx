import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 pointer-events-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

function ScrollIndicator({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement> }) {
  const [thumbTop, setThumbTop] = React.useState(0)
  const [thumbHeight, setThumbHeight] = React.useState(0)
  const [visible, setVisible] = React.useState(false)
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      if (scrollHeight <= clientHeight) {
        setVisible(false)
        return
      }
      const ratio = clientHeight / scrollHeight
      const h = Math.max(ratio * clientHeight, 40)
      const top = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - h)
      setThumbHeight(h)
      setThumbTop(top)
      setVisible(true)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setVisible(false), 1500)
    }

    el.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      el.removeEventListener('scroll', update)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [scrollRef])

  if (!visible) return null

  return (
    <div className="absolute right-1 top-0 bottom-0 w-1.5 pointer-events-none z-10 sm:hidden">
      <div
        className="absolute right-0 w-1.5 rounded-full bg-foreground/30 transition-opacity duration-300"
        style={{ top: thumbTop, height: thumbHeight }}
      />
    </div>
  )
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Блокируем pull-to-refresh и свайп-закрытие на уровне всей модалки
  const handleModalTouchStart = React.useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const startY = e.touches[0].clientY
    const onMove = (ev: TouchEvent) => {
      const el = scrollRef.current
      if (!el) return
      const deltaY = ev.touches[0].clientY - startY
      const atTop = el.scrollTop === 0
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
      // Блокируем: свайп вниз когда скролл вверху (pull-to-refresh) и свайп вверх когда внизу
      if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
        ev.preventDefault()
      }
    }
    const modalEl = contentRef.current
    if (!modalEl) return
    modalEl.addEventListener('touchmove', onMove, { passive: false })
    const onEnd = () => modalEl.removeEventListener('touchmove', onMove)
    modalEl.addEventListener('touchend', onEnd, { once: true })
    modalEl.addEventListener('touchcancel', onEnd, { once: true })
  }, [])

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        onOpenAutoFocus={(e) => e.preventDefault()}
        data-has-custom-padding={className?.includes('p-0') ? 'true' : undefined}
        className={cn(
          "fixed z-50 w-full border bg-background shadow-lg duration-300",
          "bottom-0 left-0 right-0 max-w-full rounded-t-2xl max-h-[92vh] overflow-hidden flex flex-col",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:max-h-[90vh]",
          "data-[state=closed]:sm:fade-out-0 data-[state=open]:sm:fade-in-0",
          "data-[state=closed]:sm:zoom-out-95 data-[state=open]:sm:zoom-in-95",
          className
        )}
        {...props}
      >
        <div
          ref={contentRef}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
          onTouchStart={handleModalTouchStart}
        >
          <div
            ref={scrollRef}
            className={cn(
              "flex-1 overflow-y-auto overflow-x-hidden overscroll-contain relative min-h-0",
              !className?.includes('p-0') && "p-6"
            )}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {children}
            <ScrollIndicator scrollRef={scrollRef as React.RefObject<HTMLDivElement>} />
          </div>
        </div>
        <DialogPrimitive.Close className="absolute right-3 top-3 rounded-full bg-red-500 hover:bg-red-600 text-white p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:pointer-events-none z-20 [[data-lightbox-open]_&]:hidden">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}