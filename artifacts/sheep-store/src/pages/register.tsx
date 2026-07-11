import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegisterCustomer } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UserPlus, MailCheck } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().min(3, 'أدخل بريداً إلكترونياً صحيحاً').includes('@', { message: 'أدخل بريداً إلكترونياً صحيحاً' }),
  phone: z.string().min(8, 'رقم الهاتف غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const [done, setDone] = useState(false);
  const registerMutation = useRegisterCustomer();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  });

  const onSubmit = (data: FormValues) => {
    registerMutation.mutate(
      { data },
      {
        onSuccess: () => setDone(true),
        onError: (err: any) => {
          form.setError('email', { message: err?.message || 'حدث خطأ، حاول مرة أخرى' });
        },
      },
    );
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
          <MailCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">تحقق من بريدك الإلكتروني</h2>
        <p className="text-muted-foreground">
          لقد أرسلنا رابط تفعيل إلى بريدك الإلكتروني. الرجاء الضغط عليه لتفعيل حسابك ثم تسجيل الدخول.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">الذهاب لتسجيل الدخول</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            إنشاء حساب جديد
          </CardTitle>
          <CardDescription>سجّل حساباً لتتمكن من طلب الشراء وتتبع طلباتك.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسمك الكريم" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input dir="ltr" className="text-right" placeholder="05XXXXXXXX" {...field} />
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
              <Button type="submit" className="w-full h-11" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                لديك حساب بالفعل؟{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  تسجيل الدخول
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
