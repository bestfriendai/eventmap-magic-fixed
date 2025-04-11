import React from 'react';
import Header from '../Header';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  animate?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function PageLayout({
  children,
  className,
  fullWidth = false,
  animate = true,
  header,
  footer
}: PageLayoutProps) {
  const content = (
    <div className={cn(
      "min-h-screen flex flex-col bg-background",
      className
    )}>
      {header || <Header />}
      
      <main className={cn(
        "flex-1 pt-16 pb-8",
        !fullWidth && "container mx-auto px-4"
      )}>
        {children}
      </main>
      
      {footer && (
        <footer className="border-t border-border">
          {footer}
        </footer>
      )}
    </div>
  );
  
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    );
  }
  
  return content;
}
