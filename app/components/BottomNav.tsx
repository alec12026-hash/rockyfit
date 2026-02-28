'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Dumbbell, History, TrendingUp } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/health', label: 'Health', icon: Heart },
  { href: '/workout', label: 'Workout', icon: Dumbbell },
  { href: '/history', label: 'History', icon: History },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-zinc-200 z-50 safe-area-bottom">
      <div className="flex items-stretch h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                isActive ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
