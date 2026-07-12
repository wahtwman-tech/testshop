import { useState } from "react";
import { Link } from "wouter";
import {
  useListAddresses,
  useCreateAddress,
  useDeleteAddress,
  useUpdateAddress,
  useUpdateProfile,
} from "@workspace/api-client-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import { useCustomerAuth } from "@/lib/customer-auth";

const addressSchema = z.object({
  label: z.string().min(1, "الرجاء إدخال عنوان مختصر"),
  city: z.string().min(1, "الرجاء إدخال اسم المدينة"),
  addressLine: z.string().min(1, "الرجاء إدخال العنوان التفصيلي"),
  notes: z.string().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const profileSchema = z.object({
  name: z.string().min(1, "الرجاء إدخال الاسم"),
  phone: z.string().min(1, "الرجاء إدخال رقم الهاتف"),
  email: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { customer, isLoading: authLoading } = useCustomerAuth();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "addresses">("profile");

  const { data: addresses, isLoading: addressesLoading, refetch } = useListAddresses();
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();
  const updateAddress = useUpdateAddress();
  const updateProfile = useUpdateProfile();

  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "", city: "", addressLine: "", notes: "" },
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: customer?.name || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
    },
  });

  const onAddressSubmit = (data: AddressFormValues) => {
    createAddress.mutate(
      { data },
      {
        onSuccess: () => {
          toast.success("تم إضافة العنوان بنجاح");
          addressForm.reset();
          setShowAddressForm(false);
          refetch();
        },
        onError: () => {
          toast.error("حدث خطأ أثناء إضافة العنوان");
        },
      }
    );
  };

  const onDeleteAddress = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا العنوان؟")) {
      deleteAddress.mutate(
        { id },
        {
          onSuccess: () => {
            toast.success("تم حذف العنوان");
            refetch();
          },
          onError: () => {
            toast.error("حدث خطأ أثناء حذف العنوان");
          },
        }
      );
    }
  };

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate(
      { data },
      {
        onSuccess: () => {
          toast.success("تم تحديث الملف الشخصي بنجاح");
        },
        onError: () => {
          toast.error("حدث خطأ أثناء تحديث الملف الشخصي");
        },
      }
    );
  };

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">الرجاء تسجيل الدخول أولاً</h2>
        <Button asChild>
          <Link href="/login">تسجيل الدخول</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة للرئيسية
      </Link>

      <h1 className="text-3xl font-bold">الملف الشخصي</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === "profile"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4 inline ml-2" />
          المعلومات الشخصية
        </button>
        <button
          onClick={() => setActiveTab("addresses")}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === "addresses"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapPin className="w-4 h-4 inline ml-2" />
          العناوين
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الشخصية</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Addresses Tab */}
      {activeTab === "addresses" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>عناوين التوصيل</CardTitle>
              <Button
                onClick={() => setShowAddressForm(!showAddressForm)}
                size="sm"
              >
                <Plus className="w-4 h-4 ml-1" />
                إضافة عنوان
              </Button>
            </CardHeader>
            <CardContent>
              {showAddressForm && (
                <Form {...addressForm}>
                  <form
                    onSubmit={addressForm.handleSubmit(onAddressSubmit)}
                    className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addressForm.control}
                        name="label"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>عنوان مختصر</FormLabel>
                            <FormControl>
                              <Input placeholder="مثال: البيت، العمل" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المدينة</FormLabel>
                            <FormControl>
                              <Input placeholder="مثال: الرياض" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={addressForm.control}
                      name="addressLine"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العنوان التفصيلي</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="الشارع، الحي، رقم المبنى..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addressForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات (اختياري)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="معلومات إضافية..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={createAddress.isPending}
                      >
                        <Check className="w-4 h-4 ml-1" />
                        حفظ
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddressForm(false)}
                      >
                        <X className="w-4 h-4 ml-1" />
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </Form>
              )}

              {addressesLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : addresses && addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <Card key={addr.id} className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{addr.label}</h3>
                              {addr.isDefault && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  افتراضي
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground mt-1">
                              {addr.city} - {addr.addressLine}
                            </p>
                            {addr.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {addr.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteAddress(addr.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد عناوين. أضف عنواناً جديداً.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
