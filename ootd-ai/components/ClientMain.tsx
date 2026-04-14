'use client';
import { usePathname } from 'next/navigation';

const NO_SIDEBAR_PATHS = ['/landing-minimal', '/landing-impact', '/shared'];

export default function ClientMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noSidebar = pathname === '/' || NO_SIDEBAR_PATHS.some(p => pathname.startsWith(p));

  return (
    <main className={`${noSidebar ? '' : 'lg:ml-[220px]'} pb-20 lg:pb-0 flex-1`}>
      {children}
    </main>
  );
}
