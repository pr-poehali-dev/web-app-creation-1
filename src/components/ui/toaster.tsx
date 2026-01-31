import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// Определяем мобильное устройство
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  // Автоматически закрываем toast через 2 секунды на мобильных
  useEffect(() => {
    if (!isMobile()) return;

    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        dismiss(toast.id);
      }, 2000); // 2 секунды

      return () => clearTimeout(timer);
    });
  }, [toasts, dismiss]);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}