import { useSearchParams, Link } from "wouter";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react';

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        {/* Failure Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <XCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-red-700">حدث خطأ في الدفع</h1>
          <p className="text-muted-foreground">
            لم يتم إتمام عملية الدفع. يرجى المحاولة مرة أخرى
          </p>
        </div>

        {/* Error Info */}
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">سبب محتمل:</span>
            </div>
            <ul className="space-y-2 text-sm text-red-600">
              <li>• تم إلغاء العملية من قبلك</li>
              <li>• رفض البنك بطاقة الدفع</li>
              <li>• انتهت صلاحية الجلسة</li>
              <li>• مشكلة في الاتصال بالإنترنت</li>
            </ul>
          </CardContent>
        </Card>

        {/* Order Info */}
        {orderId && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">رقم الطلب</p>
              <p className="text-2xl font-bold">#{orderId}</p>
              <p className="text-xs text-muted-foreground mt-2">
                استخدم هذا الرقم للتواصل معنا
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            asChild 
            size="lg" 
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={() => {
              // Retry by going back to orders
              window.location.href = `/orders?retry=${orderId}`;
            }}
          >
            <button className="flex items-center justify-center gap-2 w-full">
              <RefreshCw className="w-5 h-5" />
              إعادة المحاولة
            </button>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/orders">
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة لطلباتي
            </Link>
          </Button>
          
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">
              العودة للرئيسية
            </Link>
          </Button>
        </div>

        {/* Contact Support */}
        <div className="text-center text-sm text-muted-foreground">
          <p>هل تحتاج مساعدة؟</p>
          <p className="font-medium mt-1">
            تواصل معنا على: <span className="text-primary">support@example.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
