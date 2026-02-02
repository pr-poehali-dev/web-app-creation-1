import Icon from '@/components/ui/icon';
import SupportContact from '@/components/auth/SupportContact';

interface SupportCardProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

export default function SupportCard({ 
  title = "Нужна помощь?",
  description = "Наша техподдержка готова помочь вам с любыми вопросами",
  variant = 'default',
  className = ''
}: SupportCardProps) {
  
  if (variant === 'minimal') {
    return (
      <div className={`text-center py-4 ${className}`}>
        <SupportContact />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-muted/50 border rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="Headphones" className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-foreground">{title}</h3>
            <SupportContact className="mt-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-6 ${className}`}>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/5">
          <Icon name="Headphones" className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center justify-center md:justify-start gap-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="shrink-0">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg px-6 py-3 border border-primary/20 shadow-sm hover:shadow-md transition-shadow">
            <SupportContact />
          </div>
        </div>
      </div>
    </div>
  );
}
