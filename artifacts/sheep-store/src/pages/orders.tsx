import { useState, useEffect } from "react";
import { useListOrders, getListOrdersQueryKey, useGetOrder } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'wouter';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useCustomerAuth } from '@/lib/customer-auth';
import { toast } from 'sonner';
import {
  ShoppingBag,
  LogIn,
  ArrowRight,
  Package,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  Check,
  X,
  ChevronRight,
  Copy,
  Loader2,
} from 'lucide-react';

type OrderStatus = 'pending_payment' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type PaymentMethod = 'cod' | 'card';
type PaymentStatus = 'unpaid' | 'paid' | 'failed';

const STATUS_LABELS: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' | 'outline' }> = {
  pending_payment: { label: 'بانتظار الدفع', variant: 'outline' },
  confirmed: { label: 'مؤكد', variant: 'default' },
  processing: { label: 'قيد التجهيز', variant: 'secondary' },
  shipped: { label: 'في الطريق', variant: 'default' },
  delivered: { label: 'مكتمل', variant: 'default' },
  cancelled: { label: 'ملغي', variant: 'destructive' },
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' | 'outline' }> = {
  unpaid: { label: 'غير مدفوع', variant: 'outline' },
  paid: { label: 'مدفوع', variant: 'default' },
  failed: { label: 'فشل الدفع', variant: 'destructive' },
};

function getStatusBadge(status: string) {
  const entry = STATUS_LABELS[status.toLowerCase()] ?? { label: status, variant: 'outline' as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

function getPaymentStatusBadge(status: string) {
  const entry = PAYMENT_STATUS_LABELS[status.toLowerCase()] ?? { label: status, variant: 'outline' as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

interface OrderDetailsProps {
  orderId: number;
  onBack: () => void;
}

function OrderDetails({ orderId, onBack }: OrderDetailsProps) {
  const { data: order, isLoading, refetch } = useGetOrder(orderId);

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      if (selectedPayment === 'cod') {
        // الدفع عند الاستلام - تأكيد بسيط
        const response = await fetch('/api/payment/cod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ orderId }),
        });
        
        if (!response.ok) {
          throw new Error('فشل تأكيد الطلب');
        }
        
        toast.success('تم تأكيد الطلب بنجاح! سيتم الدفع عند الاستلام');
        setShowPaymentModal(false);
        refetch();
      } else {
        // الدفع بالبطاقة - توجيه لـ Stripe
        const response = await fetch('/api/payment/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ orderId }),
        });
        
        const data = await response.json();
        
        if (data.url) {
          // توجيه العميل لصفحة الدفع
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'فشل إنشاء جلسة الدفع');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء الدفع');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(`#${orderId}`);
    toast.success('تم نسخ رقم الطلب');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">لم يتم العثور على الطلب</p>
        <Button onClick={onBack} className="mt-4">العودة للطلبات</Button>
      </div>
    );
  }

  const needsPayment = order.status === 'pending_payment';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              طلب #{order.id}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyOrderId}>
                <Copy className="w-3 h-3" />
              </Button>
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.createdAt), 'EEEE، dd MMMM yyyy - HH:mm', { locale: ar })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Payment Section - Show if order needs payment */}
      {needsPayment && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              إتمام الدفع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold text-primary">
              {Number(order.totalAmount).toLocaleString('ar-SA')} ريال
            </div>
            
            {/* Payment Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedPayment('cod')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  selectedPayment === 'cod'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedPayment === 'cod' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="font-semibold">الدفع عند الاستلام</p>
                  <p className="text-xs text-muted-foreground">ادفع نقداً عند وصول الطلب</p>
                </div>
                {selectedPayment === 'cod' && (
                  <Check className="w-5 h-5 text-primary mr-auto" />
                )}
              </button>

              <button
                onClick={() => setSelectedPayment('card')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  selectedPayment === 'card'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedPayment === 'card' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="font-semibold">بطاقة ائتمان</p>
                  <p className="text-xs text-muted-foreground">Visa / Mastercard</p>
                </div>
                {selectedPayment === 'card' && (
                  <Check className="w-5 h-5 text-primary mr-auto" />
                )}
              </button>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowPaymentModal(true)}
            >
              {selectedPayment === 'cod' ? 'تأكيد الطلب' : 'ادفع الآن'}
              <ChevronRight className="w-4 h-4 mr-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تفاصيل الطلب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sheep Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">
                {order.sheep?.name ?? `خروف #${order.sheepId}`}
              </p>
              {order.sheep?.breed && (
                <p className="text-sm text-muted-foreground">{order.sheep.breed}</p>
              )}
              <div className="flex gap-4 mt-1 text-sm">
                <span>الكمية: {order.quantity}</span>
                <span>السعر: {Number(order.unitPrice).toLocaleString('ar-SA')} ريال</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المجموع الفرعي</span>
              <span>{Number(order.totalAmount).toLocaleString('ar-SA')} ريال</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">رسوم التوصيل</span>
              <span>مجاني</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>الإجمالي</span>
              <span className="text-primary">{Number(order.totalAmount).toLocaleString('ar-SA')} ريال</span>
            </div>
          </div>

          {/* Note */}
          {order.note && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-1">ملاحظات</p>
              <p className="bg-muted/30 p-3 rounded-lg">{order.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Address */}
      {order.address && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              عنوان التوصيل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-semibold">{order.address.label}</p>
              <p className="text-muted-foreground">{order.address.city}</p>
              <p className="text-muted-foreground">{order.address.addressLine}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>تأكيد الدفع</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => !isProcessing && setShowPaymentModal(false)}
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6 space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  {selectedPayment === 'cod' ? (
                    <Truck className="w-8 h-8 text-primary" />
                  ) : (
                    <CreditCard className="w-8 h-8 text-primary" />
                  )}
                </div>
                <p className="text-2xl font-bold">
                  {Number(order.totalAmount).toLocaleString('ar-SA')} ريال
                </p>
                <p className="text-muted-foreground">
                  {selectedPayment === 'cod'
                    ? 'سيتم الدفع نقداً عند استلام الطلب'
                    : 'سيتم توجيهك لصفحة الدفع الآمن'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isProcessing}
                >
                  إلغاء
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      جاري المعالجة...
                    </span>
                  ) : selectedPayment === 'cod' ? (
                    'تأكيد الطلب'
                  ) : (
                    'ادفع الآن'
                  )}
                </Button>
              </div>

              {selectedPayment === 'card' && (
                <div className="flex items-center justify-center gap-4 pt-4 border-t">
                  <img src="/visa.svg" alt="Visa" className="h-6" />
                  <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const { data: orders, isLoading, refetch } = useListOrders({
    query: { queryKey: getListOrdersQueryKey(), enabled: isAuthenticated },
  });
  
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  
  // Handle payment result from URL
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const orderId = searchParams.get('order_id');
    
    if (paymentStatus === 'success') {
      toast.success('تم الدفع بنجاح! شكراً لك');
      refetch();
      // Clear URL params
      window.history.replaceState({}, '', '/orders');
    } else if (paymentStatus === 'cancelled') {
      toast.error('تم إلغاء عملية الدفع');
      window.history.replaceState({}, '', '/orders');
    }
  }, [searchParams, refetch]);

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

  if (selectedOrderId !== null) {
    return (
      <div className="max-w-3xl mx-auto">
        <OrderDetails orderId={selectedOrderId} onBack={() => setSelectedOrderId(null)} />
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
                <Skeleton key={i} className="h-16 w-full" />
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
            <div className="divide-y">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className="w-full p-4 hover:bg-muted/30 transition-colors text-right flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">#{order.id}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.sheep?.name ?? `خروف #${order.sheepId}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="font-semibold text-primary">
                        {Number(order.totalAmount).toLocaleString('ar-SA')} ريال
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
