import { useListOrders, getListOrdersQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useCustomerAuth } from '@/lib/customer-auth';
import { ShoppingBag, LogIn } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' | 'outline' }> = {
  pending_payment: { label: 'بانتظار الدفع', variant: 'secondary' },
  confirmed: { label: 'مؤكد', variant: 'default' },
  processing: { label: 'قيد التجهيز', variant: 'secondary' },
  shipped: { label: 'في الطريق', variant: 'default' },
  delivered: { label: 'مكتمل', variant: 'default' },
  cancelled: { label: 'ملغي', variant: 'destructive' },
};

function getStatusBadge(status: string) {
  const entry = STATUS_LABELS[status.toLowerCase()] ?? { label: status, variant: 'outline' as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export default function Orders() {
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const { data: orders, isLoading } = useListOrders({
    query: { queryKey: getListOrdersQueryKey(), enabled: isAuthenticated },
  });

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
          <LogIn className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold">سجّل دخولك لعرض طلباتك</h2>
        <p className="text-muted-foreground">تحتاج إلى تسجيل الدخول لعرض سجل مشترياتك.</p>
        <div className="flex flex-col gap-3">
          <Button asChild><Link href="/login">تسجيل الدخول</Link></Button>
          <Button asChild variant="outline"><Link href="/register">إنشاء حساب جديد</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">طلباتي</h1>

      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle>سجل الطلبات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-16 space-y-4 text-muted-foreground">
              <ShoppingBag className="w-14 h-14 mx-auto opacity-30" />
              <p>لا توجد طلبات مسجلة حتى الآن.</p>
              <Button asChild variant="outline">
                <Link href="/">تصفح الخراف المتاحة</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right w-24">رقم الطلب</TableHead>
                    <TableHead className="text-right min-w-[160px]">التاريخ</TableHead>
                    <TableHead className="text-right">الخروف</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                    <TableHead className="text-right w-32">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.sheep?.name ?? `#${order.sheepId}`}
                        {order.sheep?.breed && (
                          <span className="text-xs text-muted-foreground block">{order.sheep.breed}</span>
                        )}
                      </TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {Number(order.totalAmount).toLocaleString('ar-SA')} ريال
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground" title={order.note ?? ''}>
                        {order.note || '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
