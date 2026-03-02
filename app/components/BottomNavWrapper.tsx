'use client';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

export default function BottomNavWrapper() {
  const pathname = usePathname();
  const hiddenPaths = ['/onboarding', '/login', '/signup'];
  const shouldShow = !hiddenPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
  
  if (!shouldShow) return null;
  
  return <BottomNav />;
}
