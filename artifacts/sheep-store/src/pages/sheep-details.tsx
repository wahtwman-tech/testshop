import { useParams, useLocation, Link } from 'wouter';
import {
  useGetSheep,
  useCreateCheckout,
  useListAddresses,
  getGetSheepQueryKey,
  getListOrdersQueryKey,
} from '@workspace/api-client-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tag, Scale, CalendarClock, CheckCircle, ArrowRight, Store, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useCustomerAuth } from '@/lib/customer-auth';

const orderSchema = z.object({
  addressId: z.string().min(1, 'يرجى اختيار عنوان التوصيل'),
  note: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function SheepDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const sheepId = parseInt(params.id || '0', 10);
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();

  const { data: sheep, isLoading, isError } = useGetSheep(sheepId, {
    query: { enabled: !!sheepId, queryKey: getGetSheepQueryKey(sheepId) },
  });

  const { data: addresses } = useListAddresses({
    query: { enabled: isAuthenticated },
  });

  const createCheckout = useCreateCheckout();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { addressId: '', note: '' },
  });

  const onSubmit = (data: OrderFormValues) => {
    if (!sheepId || !sheep?.available) return;
    createCheckout.mutate(
      { data: { sheepId, quantity: 1, addressId: parseInt(data.addressId), note: data.note } },
      {
        onSuccess: () => {
          toast.success('تم إرسال طلبك بنجاح!', {
            description: 'سنتواصل معك قريباً لتأكيد الطلب.',
          });
          queryClient.invalidateQueries({ queryKey: getGetSheepQueryKey(sheepId) });
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          setLocation('/orders');
        },
        onError: () => {
          toast.error('حدث خطأ أثناء تقديم الطلب', {
            description: 'يرجى المحاولة مرة أخرى لاحقاً.',
          });
        },
      },
    );
  };

  if (isLoading || authLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <div className="space-y-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !sheep) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">لم يتم العثور على الخروف</h2>
        <Button asChild variant="outline">
          <Link href="/">العودة للرئيسية</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowRight className="w-4 h-4" />
        العودة للقائمة
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image and Details */}
        <div className="space-y-6">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted relative border border-border">
            {sheep.imageUrl ? (
              <img src={sheep.imageUrl} alt={sheep.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <Store className="w-20 h-20" />
              </div>
            )}
            {!sheep.available && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <Badge variant="destructive" className="text-2xl py-2 px-6">تم البيع</Badge>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold">{sheep.name}</h1>
              <div className="text-3xl font-bold text-primary whitespace-nowrap">
                {sheep.price} <span className="text-xl font-normal text-muted-foreground">ريال</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 leading-relaxed text-lg">{sheep.description}</p>

            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { icon: <Tag className="w-6 h-6 text-primary" />, label: 'السلالة', value: sheep.breed },
                { icon: <CalendarClock className="w-6 h-6 text-primary" />, label: 'العمر', value: `${sheep.ageMonths} أشهر` },
                { icon: <Scale className="w-6 h-6 text-primary" />, label: 'الوزن', value: `${sheep.weightKg} كجم` },
              ].map((item) => (
                <Card key={item.label} className="bg-muted/30 border-none shadow-none">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    {item.icon}
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                    <div className="font-semibold">{item.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Order Panel */}
        <div>
          <Card className="sticky top-24 border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                تقديم طلب شراء
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!sheep.available ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
                    <Store className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold">عذراً، هذا الخروف مباع</h3>
                  <Button asChild variant="outline" className="mt-4">
                    <Link href="/">تصفح المزيد</Link>
                  </Button>
                </div>
              ) : !isAuthenticated ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                    <LogIn className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold">سجّل دخولك لإتمام الطلب</h3>
                  <p className="text-muted-foreground text-sm">تحتاج إلى حساب لتتمكن من تقديم طلب الشراء.</p>
                  <div className="flex flex-col gap-3 mt-4">
                    <Button asChild>
                      <Link href="/login">تسجيل الدخول</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/register">إنشاء حساب جديد</Link>
                    </Button>
                  </div>
                </div>
              ) : !addresses || addresses.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <h3 className="text-xl font-bold">أضف عنواناً أولاً</h3>
                  <p className="text-muted-foreground text-sm">يرجى إضافة عنوان توصيل قبل تقديم الطلب.</p>
                  <Button asChild>
                    <Link href="/profile">إضافة عنوان</Link>
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="addressId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان التوصيل</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر عنوان التوصيل..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {addresses.map((addr) => (
                                <SelectItem key={addr.id} value={String(addr.id)}>
                                  {addr.label} — {addr.city}، {addr.addressLine}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات (اختياري)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="أي متطلبات خاصة أو وقت مفضل للتواصل..." className="resize-none" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full text-lg h-12" disabled={createCheckout.isPending}>
                      {createCheckout.isPending ? 'جاري الإرسال...' : 'تأكيد الطلب'}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      الدفع يتم عند الاستلام أو عبر التحويل البنكي بعد التواصل.
                    </p>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
