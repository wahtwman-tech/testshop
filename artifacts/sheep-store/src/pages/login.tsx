import { Link, useLocation, useSearch } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLoginCustomer, getGetCurrentCustomerQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LogIn } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().min(3, 'أدخل بريداً إلكترونياً صحيحاً'),
  password: z.string().min(1, 'أدخل كلمة المرور'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const returnTo = new URLSearchParams(search).get('returnTo') || '/';
  const queryClient = useQueryClient();
  const loginMutation = useLoginCustomer();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: FormValues) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentCustomerQueryKey() });
          toast.success('تم تسجيل الدخول بنجاح');
          setLocation(returnTo);
        },
        onError: (err: any) => {
          form.setError('password', { message: err?.message || 'بيانات الدخول غير صحيحة' });
        },
      },
    );
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary" />
            تسجيل الدخول
          </CardTitle>
          <CardDescription>سجّل الدخول لمتابعة طلباتك وإتمام عمليات الشراء.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input dir="ltr" className="text-right" placeholder="example@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input type="password" dir="ltr" className="text-right" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-11" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                ليس لديك حساب؟{' '}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  إنشاء حساب جديد
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
