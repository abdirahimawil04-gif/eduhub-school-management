import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function PlaceholderView({ title, description, icon: Icon }: PlaceholderViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-500 mt-1">{description}</p>
      </div>

      <Card className="border-dashed border-2 bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <Icon className="w-10 h-10 text-indigo-600" />
          </div>
          <CardTitle className="text-xl mb-2">Module Under Development</CardTitle>
          <CardDescription className="max-w-xs">
            The {title} module is currently being configured. Check back soon for full functionality.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
