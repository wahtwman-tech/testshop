import { useEffect, useRef, useState } from 'react';
import { useSearch, Link } from 'wouter';
import { useVerifyEmail } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const search = useSearch();
  const token = new URLSearchParams(search).get('token') || '';
  const verifyMutation = useVerifyEmail();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !token) return;
    started.current = true;
    verifyMutation.mutate(
      { data: { token } },
      {
        onSuccess: () => setStatus('success'),
        onError: () => setStatus('error'),
      },
    );
  }, [token]);

  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-4">
      {status === 'pending' && (
        <>
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري تفعيل حسابك...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">تم تفعيل حسابك بنجاح</h2>
          <Button asChild>
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">تعذر تفعيل الحساب</h2>
          <p className="text-muted-foreground">الرابط غير صالح أو منتهي الصلاحية.</p>
          <Button asChild variant="outline">
            <Link href="/login">الذهاب لتسجيل الدخول</Link>
          </Button>
        </>
      )}
    </div>
  );
}
