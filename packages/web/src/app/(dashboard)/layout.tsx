import { Toaster } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CommandPaletteProvider } from '@/components/command-palette/CommandPaletteProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <CommandPaletteProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto p-3 md:p-6">
                {children}
              </main>
            </div>
          </div>
          <Toaster position="top-right" />
        </CommandPaletteProvider>
      </AuthGuard>
    </ErrorBoundary>
  );
}
