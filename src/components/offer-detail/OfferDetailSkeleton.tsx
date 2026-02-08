import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface OfferDetailSkeletonProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function OfferDetailSkeleton({ isAuthenticated, onLogout }: OfferDetailSkeletonProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-8 flex-1">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid gap-8 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <Skeleton className="aspect-video w-full rounded-lg mb-4" />
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-6 w-1/2" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
