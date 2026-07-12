import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useHealthCheck } from '@workspace/api-client-react';
import { Store, ListOrdered, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health, isError } = useHealthCheck({ query: { queryKey: ['health'] } });

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl transition-opacity hover:opacity-80">
              <Store className="h-6 w-6" />
              <span>متجر تجريبي</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link href="/" className={cn("px-4 py-2 rounded-md transition-colors", location === '/' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                الرئيسية
              </Link>
              <Link href="/orders" className={cn("px-4 py-2 rounded-md transition-colors", location === '/orders' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <span className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4" />
                  الطلبات
                </span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-border bg-card text-muted-foreground py-8 mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>© {new Date().getFullYear()}   هذا المتجر تجريبي وليس حقيقي</p>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              حالة النظام: 
              {isError ? (
                <span className="flex items-center gap-1 text-destructive"><AlertCircle className="w-4 h-4"/> متوقف</span>
              ) : health?.status === 'ok' ? (
                <span className="flex items-center gap-1 text-primary"><CheckCircle2 className="w-4 h-4"/> يعمل</span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground"><Activity className="w-4 h-4"/> جاري التحقق...</span>
              )}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
