"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppUIDefinition, UINavigationItem } from '@/types/ui-metadata.types';
import * as LucideIcons from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  uiDef: AppUIDefinition;
  appId: string;
}

export default function SidebarRenderer({ uiDef, appId }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = uiDef.navigation?.items || [];
  const theme = uiDef.theme;

  return (
    <aside 
      className={cn(
        "flex flex-col border-r transition-all duration-300 ease-in-out bg-surface relative",
        collapsed ? "w-16" : "w-64"
      )}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: '#e5e7eb', // tailwind gray-200
        color: theme.colors.text
      }}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
        {!collapsed && <span className="font-bold text-lg truncate">App Menu</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-100 text-gray-500"
        >
          <LucideIcons.Menu size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2">
        {navItems.map((item, idx) => {
          // Resolve full path (prefix with /apps/[appId])
          const fullPath = `/apps/${appId}${item.path}`;
          
          // Determine active state
          // Exact match or sub-path match for entities
          const isActive = item.path === '/' 
            ? pathname === `/apps/${appId}` 
            : pathname.startsWith(fullPath);

          const IconComponent = (LucideIcons as any)[item.icon] || LucideIcons.File;

          return (
            <Link
              key={idx}
              href={fullPath}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "hover:bg-gray-100 text-gray-700"
              )}
              style={isActive ? { color: theme.colors.primary, backgroundColor: `${theme.colors.primary}1A` } : {}}
              title={collapsed ? item.label : undefined}
            >
              <IconComponent size={20} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
