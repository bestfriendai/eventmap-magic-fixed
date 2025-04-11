import React from 'react';
import Header from '@/components/Header';
import DesignSystemShowcase from '@/components/DesignSystemShowcase';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold">Design System</h1>
              <p className="text-muted-foreground mt-2">
                A showcase of UI components and design tokens
              </p>
            </div>
            <ThemeToggle />
          </div>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Color Palette</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Primary Colors */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-primary flex items-end p-2">
                  <span className="text-primary-foreground text-sm font-medium">Primary</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="h-8 rounded bg-primary-50"></div>
                  <div className="h-8 rounded bg-primary-100"></div>
                  <div className="h-8 rounded bg-primary-200"></div>
                  <div className="h-8 rounded bg-primary-300"></div>
                  <div className="h-8 rounded bg-primary-400"></div>
                  <div className="h-8 rounded bg-primary-500"></div>
                  <div className="h-8 rounded bg-primary-600"></div>
                  <div className="h-8 rounded bg-primary-700"></div>
                  <div className="h-8 rounded bg-primary-800"></div>
                </div>
              </div>
              
              {/* Secondary Colors */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-secondary flex items-end p-2">
                  <span className="text-secondary-foreground text-sm font-medium">Secondary</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="h-8 rounded bg-neutral-50"></div>
                  <div className="h-8 rounded bg-neutral-100"></div>
                  <div className="h-8 rounded bg-neutral-200"></div>
                  <div className="h-8 rounded bg-neutral-300"></div>
                  <div className="h-8 rounded bg-neutral-400"></div>
                  <div className="h-8 rounded bg-neutral-500"></div>
                  <div className="h-8 rounded bg-neutral-600"></div>
                  <div className="h-8 rounded bg-neutral-700"></div>
                  <div className="h-8 rounded bg-neutral-800"></div>
                </div>
              </div>
              
              {/* Accent Colors */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-accent flex items-end p-2">
                  <span className="text-accent-foreground text-sm font-medium">Accent</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="h-8 rounded bg-accent-50"></div>
                  <div className="h-8 rounded bg-accent-100"></div>
                  <div className="h-8 rounded bg-accent-200"></div>
                  <div className="h-8 rounded bg-accent-300"></div>
                  <div className="h-8 rounded bg-accent-400"></div>
                  <div className="h-8 rounded bg-accent-500"></div>
                  <div className="h-8 rounded bg-accent-600"></div>
                  <div className="h-8 rounded bg-accent-700"></div>
                  <div className="h-8 rounded bg-accent-800"></div>
                </div>
              </div>
              
              {/* Destructive Colors */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-destructive flex items-end p-2">
                  <span className="text-destructive-foreground text-sm font-medium">Destructive</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="h-8 rounded bg-danger-50"></div>
                  <div className="h-8 rounded bg-danger-100"></div>
                  <div className="h-8 rounded bg-danger-200"></div>
                  <div className="h-8 rounded bg-danger-300"></div>
                  <div className="h-8 rounded bg-danger-400"></div>
                  <div className="h-8 rounded bg-danger-500"></div>
                  <div className="h-8 rounded bg-danger-600"></div>
                  <div className="h-8 rounded bg-danger-700"></div>
                  <div className="h-8 rounded bg-danger-800"></div>
                </div>
              </div>
              
              {/* Success Colors */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-success-600 flex items-end p-2">
                  <span className="text-white text-sm font-medium">Success</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="h-8 rounded bg-success-50"></div>
                  <div className="h-8 rounded bg-success-100"></div>
                  <div className="h-8 rounded bg-success-200"></div>
                  <div className="h-8 rounded bg-success-300"></div>
                  <div className="h-8 rounded bg-success-400"></div>
                  <div className="h-8 rounded bg-success-500"></div>
                  <div className="h-8 rounded bg-success-600"></div>
                  <div className="h-8 rounded bg-success-700"></div>
                  <div className="h-8 rounded bg-success-800"></div>
                </div>
              </div>
              
              {/* Warning Colors */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-warning-600 flex items-end p-2">
                  <span className="text-white text-sm font-medium">Warning</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="h-8 rounded bg-warning-50"></div>
                  <div className="h-8 rounded bg-warning-100"></div>
                  <div className="h-8 rounded bg-warning-200"></div>
                  <div className="h-8 rounded bg-warning-300"></div>
                  <div className="h-8 rounded bg-warning-400"></div>
                  <div className="h-8 rounded bg-warning-500"></div>
                  <div className="h-8 rounded bg-warning-600"></div>
                  <div className="h-8 rounded bg-warning-700"></div>
                  <div className="h-8 rounded bg-warning-800"></div>
                </div>
              </div>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Typography</h2>
            <div className="space-y-6">
              <div>
                <h1 className="text-5xl font-bold">Heading 1</h1>
                <p className="text-muted-foreground">font-size: 3rem (48px), font-weight: 700</p>
              </div>
              <div>
                <h2 className="text-4xl font-bold">Heading 2</h2>
                <p className="text-muted-foreground">font-size: 2.25rem (36px), font-weight: 700</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold">Heading 3</h3>
                <p className="text-muted-foreground">font-size: 1.875rem (30px), font-weight: 700</p>
              </div>
              <div>
                <h4 className="text-2xl font-bold">Heading 4</h4>
                <p className="text-muted-foreground">font-size: 1.5rem (24px), font-weight: 700</p>
              </div>
              <div>
                <h5 className="text-xl font-bold">Heading 5</h5>
                <p className="text-muted-foreground">font-size: 1.25rem (20px), font-weight: 700</p>
              </div>
              <div>
                <h6 className="text-lg font-bold">Heading 6</h6>
                <p className="text-muted-foreground">font-size: 1.125rem (18px), font-weight: 700</p>
              </div>
              <div>
                <p className="text-base">Body text (base)</p>
                <p className="text-muted-foreground">font-size: 1rem (16px), font-weight: 400</p>
              </div>
              <div>
                <p className="text-sm">Small text</p>
                <p className="text-muted-foreground">font-size: 0.875rem (14px), font-weight: 400</p>
              </div>
              <div>
                <p className="text-xs">Extra small text</p>
                <p className="text-muted-foreground">font-size: 0.75rem (12px), font-weight: 400</p>
              </div>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Spacing</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-1 w-1 bg-primary"></div>
                <p className="text-sm">1px (0.0625rem)</p>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-2 bg-primary"></div>
                <p className="text-sm">2px (0.125rem)</p>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-4 bg-primary"></div>
                <p className="text-sm">4px (0.25rem)</p>
              </div>
              <div className="space-y-2">
                <div className="h-6 w-6 bg-primary"></div>
                <p className="text-sm">6px (0.375rem)</p>
              </div>
              <div className="space-y-2">
                <div className="h-8 w-8 bg-primary"></div>
                <p className="text-sm">8px (0.5rem)</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-12 bg-primary"></div>
                <p className="text-sm">12px (0.75rem)</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-16 bg-primary"></div>
                <p className="text-sm">16px (1rem)</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 w-20 bg-primary"></div>
                <p className="text-sm">20px (1.25rem)</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 w-24 bg-primary"></div>
                <p className="text-sm">24px (1.5rem)</p>
              </div>
              <div className="space-y-2">
                <div className="h-32 w-32 bg-primary"></div>
                <p className="text-sm">32px (2rem)</p>
              </div>
              <div className="space-y-2">
                <div className="h-40 w-40 bg-primary"></div>
                <p className="text-sm">40px (2.5rem)</p>
              </div>
              <div className="space-y-2">
                <div className="h-48 w-48 bg-primary"></div>
                <p className="text-sm">48px (3rem)</p>
              </div>
            </div>
          </section>
          
          <DesignSystemShowcase />
        </div>
      </main>
    </div>
  );
}
