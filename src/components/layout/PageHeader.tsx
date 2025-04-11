import React from 'react';
import { cn } from '@/lib/utils';
import { EnhancedButton } from '../ui/enhanced-button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backButton?: boolean;
  backUrl?: string;
  className?: string;
  icon?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  actions,
  backButton = false,
  backUrl,
  className,
  icon
}: PageHeaderProps) {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };
  
  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center justify-between py-6 mb-6",
      className
    )}>
      <div className="flex items-center">
        {backButton && (
          <EnhancedButton
            variant="ghost"
            size="icon-sm"
            className="mr-3"
            onClick={handleBack}
          >
            <ChevronLeft className="h-5 w-5" />
          </EnhancedButton>
        )}
        
        <div className="flex items-center">
          {icon && (
            <div className="mr-3 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
      
      {actions && (
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
