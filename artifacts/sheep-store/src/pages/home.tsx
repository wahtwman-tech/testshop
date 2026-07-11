import { useListSheep, useGetSheepStats, getListSheepQueryKey, getGetSheepStatsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { Tag, Scale, CalendarClock, TrendingUp, Info } from 'lucide-react';

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetSheepStats({ query: { queryKey: getGetSheepStatsQueryKey() } });
  const { data: sheepList, isLoading: sheepLoading } = useListSheep({ query: { queryKey: getListSheepQueryKey() } });

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
            أفضل أنواع الخراف لمناسباتكم، <span className="text-primary">من المزرعة إليكم مباشرة.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            نقدم لكم تشكيلة مختارة بعناية من الخراف الصحية والمطابقة للشروط. أسعار شفافة وتجربة شراء سهلة بدون وسطاء.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <Card className="shadow-none border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4" /> إجمالي الخراف
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-3xl font-bold text-foreground">
                  {stats?.availableSheep} <span className="text-lg font-normal text-muted-foreground">متاح</span>
                  <span className="text-sm font-normal text-muted-foreground mx-2">/ {stats?.totalSheep} كلي</span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-none border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> نطاق الأسعار
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-32" /> : (
                <div className="text-3xl font-bold text-foreground">
                  {stats?.minPrice} - {stats?.maxPrice} <span className="text-lg font-normal text-muted-foreground">ريال</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="w-4 h-4" /> السلالات المتوفرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-full" /> : (
                <div className="flex flex-wrap gap-2">
                  {stats?.breedBreakdown?.map((b) => (
                    <Badge key={b.breed} variant="secondary" className="text-sm">
                      {b.breed} ({b.count})
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* List Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">الخراف المتاحة</h2>
        </div>

        {sheepLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardContent className="p-4 space-y-4">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sheepList?.map((sheep) => (
              <Card key={sheep.id} className="group overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-primary/30">
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  {sheep.imageUrl ? (
                    <img 
                      src={sheep.imageUrl} 
                      alt={sheep.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"%3E%3Crect width="18" height="18" x="3" y="3" rx="2" ry="2"/%3E%3Ccircle cx="9" cy="9" r="2"/%3E%3Cpath d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/%3E%3C/svg%3E';
                        (e.target as HTMLImageElement).className = 'w-full h-full object-center p-12 text-muted-foreground opacity-20';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-secondary/10">
                      <Tag className="w-12 h-12" />
                    </div>
                  )}
                  {!sheep.available && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <Badge variant="destructive" className="text-lg py-1 px-4">تم البيع</Badge>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <Badge variant="default" className="shadow-sm">{sheep.breed}</Badge>
                  </div>
                </div>
                
                <CardContent className="p-5 flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{sheep.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{sheep.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarClock className="w-4 h-4 text-primary" />
                      <span>{sheep.ageMonths} أشهر</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Scale className="w-4 h-4 text-primary" />
                      <span>{sheep.weightKg} كجم</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-5 pt-0 flex items-center justify-between border-t border-border/50 bg-muted/20">
                  <div className="font-bold text-xl text-primary">
                    {sheep.price} <span className="text-sm font-normal text-muted-foreground">ريال</span>
                  </div>
                  <Button asChild disabled={!sheep.available} variant={sheep.available ? "default" : "secondary"}>
                    <Link href={`/sheep/${sheep.id}`} className="w-full">
                      {sheep.available ? 'التفاصيل والطلب' : 'غير متاح'}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            {sheepList?.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                لا توجد خراف متاحة حالياً.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
