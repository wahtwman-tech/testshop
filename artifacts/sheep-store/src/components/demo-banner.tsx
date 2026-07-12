import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Mail, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("demo-banner-dismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("demo-banner-dismissed", "true");
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-md shadow-2xl border-2 border-amber-400/50 animate-in zoom-in-95 duration-300">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl text-amber-600">
            ⚠️ هذا المتجر تجريبي
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Email Notice */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-800">البريد الإلكتروني</p>
              <p className="text-sm text-blue-600">
                يرجى استخدام بريد إلكتروني حقيقي للتفعيل
              </p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="w-5 h-5" />
              <span className="font-semibold">بيانات الدفع الوهمية</span>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم البطاقة:</span>
                <span className="font-bold" dir="ltr">4242 4242 4242 4242</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">التاريخ:</span>
                <span className="font-bold" dir="ltr">12/28</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CVV:</span>
                <span className="font-bold" dir="ltr">205</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الاسم:</span>
                <span className="font-bold" dir="ltr">fayiz test</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 font-medium text-center">
              🚨 عند محاولتك استخدام بيانات حقيقية للدفع
              <br />
              سيتم حظرك من الدخول إلى الموقع لحمايتك
            </p>
          </div>

          {/* Dismiss Button */}
          <Button 
            onClick={handleDismiss} 
            className="w-full"
            size="lg"
          >
            <X className="w-4 h-4 ml-2" />
            فهمت، متابعة التسوق
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
