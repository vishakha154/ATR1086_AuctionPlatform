import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container">
          © {new Date().getFullYear()} LiveBid. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
