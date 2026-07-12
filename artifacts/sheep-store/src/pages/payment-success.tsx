import { useEffect, useState } from "react";
import { useSearchParams, Link } from "wouter";
import { useGetOrder, useListOrders } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Package, MapPin, Truck, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  
  const { data: order, isLoading, refetch } = useGetOrder(
    orderId ? parseInt(orderId) : 0,
  );
  
  const { refetch: refetchOrders } = useListOrders({
    query: { queryKey: [], enabled: false }
  });
  
  const [showConfetti, setShowConfetti] = useState(true);
  const [isVerifying, setIsVerifying] = useState(true);
  
  // Verify payment with backend
  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setIsVerifying(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/payment/verify/${sessionId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'paid') {
            toast.success('تم تأكيد الدفع بنجاح!');
            refetch();
            refetchOrders();
          }
        }
      } catch (error) {
        console.error('Failed to verify payment:', error);
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyPayment();
  }, [sessionId, refetch, refetchOrders]);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              🎉
            </div>
          ))}
        </div>
      )}
      
      <div className="max-w-lg w-full space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-scale-in">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-green-700">تم الدفع بنجاح! 🎉</h1>
          <p className="text-muted-foreground">
            شكراً لك! تم استلام طلبك بنجاح
          </p>
          {isVerifying && (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري تأكيد الدفع...</span>
            </div>
          )}
        </div>

        {/* Order Details */}
        {(isLoading || isVerifying) ? (
          <Card>
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : order ? (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Package className="w-5 h-5" />
                تفاصيل الطلب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">رقم الطلب</span>
                <span className="font-bold text-lg">#{order.id}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">التاريخ</span>
                <span>{format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: ar })}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">المنتج</span>
                <span className="font-medium">{order.sheep?.name ?? `خروف #${order.sheepId}`}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">الكمية</span>
                <span>{order.quantity}</span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-lg font-semibold">المبلغ المدفوع</span>
                <span className="text-xl font-bold text-green-600">
                  {Number(order.totalAmount).toLocaleString('ar-SA')} ريال
                </span>
              </div>
              
              {order.address && (
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>عنوان التوصيل</span>
                  </div>
                  <p className="font-medium">{order.address.label}</p>
                  <p className="text-sm text-muted-foreground">{order.address.city}</p>
                  <p className="text-sm text-muted-foreground">{order.address.addressLine}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">لم يتم العثور على تفاصيل الطلب</p>
            </CardContent>
          </Card>
        )}

        {/* Delivery Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-800">جاري تجهيز طلبك</p>
              <p className="text-sm text-blue-600">سنتواصل معك قريباً لتأكيد موعد التوصيل</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
            <Link href="/orders">
              <ArrowRight className="w-4 h-4 ml-2" />
              عرض طلباتي
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
             继续购物
              <ArrowRight className="w-4 h-4 mr-2" />
            </Link>
          </Button>
        </div>
      </div>
      
      <style>{`
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
