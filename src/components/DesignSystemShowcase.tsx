import React from 'react';
import { EnhancedButton } from './ui/enhanced-button';
import { EnhancedBadge } from './ui/enhanced-badge';
import { EnhancedInput } from './ui/enhanced-input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/enhanced-card';
import { Search, Mail, Heart, Calendar, Star, ArrowRight, Bell } from 'lucide-react';

export default function DesignSystemShowcase() {
  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto">
      <section>
        <h2 className="text-2xl font-bold mb-6">Buttons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>Different button styles</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <EnhancedButton>Default</EnhancedButton>
              <EnhancedButton variant="secondary">Secondary</EnhancedButton>
              <EnhancedButton variant="destructive">Destructive</EnhancedButton>
              <EnhancedButton variant="outline">Outline</EnhancedButton>
              <EnhancedButton variant="ghost">Ghost</EnhancedButton>
              <EnhancedButton variant="link">Link</EnhancedButton>
              <EnhancedButton variant="gradient">Gradient</EnhancedButton>
              <EnhancedButton variant="glow">Glow</EnhancedButton>
              <EnhancedButton variant="glass">Glass</EnhancedButton>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sizes</CardTitle>
              <CardDescription>Different button sizes</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <EnhancedButton size="sm">Small</EnhancedButton>
              <EnhancedButton>Default</EnhancedButton>
              <EnhancedButton size="lg">Large</EnhancedButton>
              <EnhancedButton size="xl">Extra Large</EnhancedButton>
              <EnhancedButton size="icon"><Search className="h-4 w-4" /></EnhancedButton>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>States</CardTitle>
              <CardDescription>Different button states</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <EnhancedButton loading>Loading</EnhancedButton>
              <EnhancedButton disabled>Disabled</EnhancedButton>
              <EnhancedButton leftIcon={<Mail className="h-4 w-4" />}>With Icon</EnhancedButton>
              <EnhancedButton rightIcon={<ArrowRight className="h-4 w-4" />}>With Icon</EnhancedButton>
              <EnhancedButton rounded="full">Rounded</EnhancedButton>
              <EnhancedButton animation="pulse">Pulse</EnhancedButton>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-6">Badges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>Different badge styles</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <EnhancedBadge>Default</EnhancedBadge>
              <EnhancedBadge variant="secondary">Secondary</EnhancedBadge>
              <EnhancedBadge variant="destructive">Destructive</EnhancedBadge>
              <EnhancedBadge variant="outline">Outline</EnhancedBadge>
              <EnhancedBadge variant="success">Success</EnhancedBadge>
              <EnhancedBadge variant="warning">Warning</EnhancedBadge>
              <EnhancedBadge variant="info">Info</EnhancedBadge>
              <EnhancedBadge variant="glass">Glass</EnhancedBadge>
              <EnhancedBadge variant="gradient">Gradient</EnhancedBadge>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Badge features and sizes</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <EnhancedBadge size="sm">Small</EnhancedBadge>
              <EnhancedBadge>Default</EnhancedBadge>
              <EnhancedBadge size="lg">Large</EnhancedBadge>
              <EnhancedBadge size="xl">Extra Large</EnhancedBadge>
              <EnhancedBadge icon={<Star className="h-3 w-3" />}>With Icon</EnhancedBadge>
              <EnhancedBadge icon={<Bell className="h-3 w-3" />} iconPosition="right">Icon Right</EnhancedBadge>
              <EnhancedBadge removable onRemove={() => alert('Badge removed')}>Removable</EnhancedBadge>
              <EnhancedBadge rounded="md">Rounded MD</EnhancedBadge>
              <EnhancedBadge animation="pulse">Pulse</EnhancedBadge>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-6">Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>Different input styles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <EnhancedInput placeholder="Default input" />
              <EnhancedInput variant="ghost" placeholder="Ghost input" />
              <EnhancedInput variant="filled" placeholder="Filled input" />
              <EnhancedInput variant="outline" placeholder="Outline input" />
              <EnhancedInput variant="glass" placeholder="Glass input" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Input features and sizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <EnhancedInput size="sm" placeholder="Small input" />
              <EnhancedInput placeholder="Default input" />
              <EnhancedInput size="lg" placeholder="Large input" />
              <EnhancedInput icon={<Search className="h-4 w-4" />} placeholder="With icon" />
              <EnhancedInput 
                icon={<Mail className="h-4 w-4" />} 
                iconPosition="right" 
                placeholder="Icon right" 
              />
              <EnhancedInput 
                clearable 
                placeholder="Clearable input" 
                defaultValue="Clear me"
              />
              <EnhancedInput 
                type="password" 
                passwordToggle 
                placeholder="Password with toggle" 
              />
              <EnhancedInput 
                error 
                placeholder="Input with error" 
              />
              <EnhancedInput 
                rounded="full" 
                placeholder="Rounded input" 
              />
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-6">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>This is a default card</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is the default card style with standard styling.</p>
            </CardContent>
            <CardFooter>
              <EnhancedButton>Action</EnhancedButton>
            </CardFooter>
          </Card>
          
          <Card variant="glass" hover="lift">
            <CardHeader>
              <CardTitle>Glass Card</CardTitle>
              <CardDescription>With hover lift effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card has a glass effect and lifts on hover.</p>
            </CardContent>
            <CardFooter>
              <EnhancedButton variant="glass">Action</EnhancedButton>
            </CardFooter>
          </Card>
          
          <Card variant="gradient" hover="glow" animation="fadeIn">
            <CardHeader>
              <CardTitle>Gradient Card</CardTitle>
              <CardDescription>With glow effect and animation</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card has a gradient background, glows on hover, and fades in.</p>
            </CardContent>
            <CardFooter>
              <EnhancedButton variant="gradient">Action</EnhancedButton>
            </CardFooter>
          </Card>
          
          <Card variant="outline" hover="scale">
            <CardHeader>
              <CardTitle>Outline Card</CardTitle>
              <CardDescription>With scale hover effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card has an outline style and scales on hover.</p>
            </CardContent>
            <CardFooter>
              <EnhancedButton variant="outline">Action</EnhancedButton>
            </CardFooter>
          </Card>
          
          <Card variant="elevated" hover="border">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>With border hover effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card has elevation and highlights its border on hover.</p>
            </CardContent>
            <CardFooter>
              <EnhancedButton>Action</EnhancedButton>
            </CardFooter>
          </Card>
          
          <Card variant="ghost">
            <CardHeader>
              <CardTitle>Ghost Card</CardTitle>
              <CardDescription>Minimal styling</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card has minimal styling with no background or border.</p>
            </CardContent>
            <CardFooter>
              <EnhancedButton variant="ghost">Action</EnhancedButton>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
