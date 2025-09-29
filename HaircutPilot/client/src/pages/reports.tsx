import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { GlassButton } from "@/components/ui/glass-button";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  BarChart3, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Users,
  Calendar,
  Euro,
  Star,
  PieChart,
  Download
} from "lucide-react";

export default function Reports() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/metrics", selectedPeriod],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments"],
    retry: false,
  });

  const { data: reviews } = useQuery({
    queryKey: ["/api/reviews"],
    retry: false,
  });

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "7": return "7 derniers jours";
      case "30": return "30 derniers jours";
      case "90": return "90 derniers jours";
      default: return "30 derniers jours";
    }
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  // Mock data for demonstration (would be calculated from real data)
  const revenueData = [
    { day: 'Lun', value: 850 },
    { day: 'Mar', value: 920 },
    { day: 'Mer', value: 750 },
    { day: 'Jeu', value: 1100 },
    { day: 'Ven', value: 1200 },
    { day: 'Sam', value: 1400 },
    { day: 'Dim', value: 600 },
  ];

  const maxRevenue = Math.max(...revenueData.map(d => d.value));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="bg-card/50 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <GlassButton variant="ghost" size="sm" asChild data-testid="button-back">
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Link>
              </GlassButton>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Rapports</span>
            </div>
            <div className="flex items-center space-x-4">
              <GlassButton variant="ghost" size="sm" data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </GlassButton>
              <a href="/api/logout" className="text-sm hover:text-primary">Déconnexion</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Rapports & Analyses</h1>
            <p className="text-muted-foreground">
              Suivez les performances de votre salon
            </p>
          </div>
          
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[200px]" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard className="p-6" data-testid="metric-total-revenue">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</h3>
              <Euro className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {metrics?.totalRevenue?.toFixed(0) || "0"} €
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-green-400">+12%</span>
              <span className="text-muted-foreground ml-1">vs période précédente</span>
            </div>
          </MetricCard>

          <MetricCard className="p-6" data-testid="metric-total-appointments">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Rendez-vous</h3>
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {metrics?.totalAppointments || 0}
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-green-400">+8%</span>
              <span className="text-muted-foreground ml-1">vs période précédente</span>
            </div>
          </MetricCard>

          <MetricCard className="p-6" data-testid="metric-completion-rate">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Taux de réalisation</h3>
              <PieChart className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {metrics?.completedAppointments && metrics?.totalAppointments 
                ? Math.round((metrics.completedAppointments / metrics.totalAppointments) * 100)
                : 0}%
            </div>
            <div className="flex items-center text-sm">
              <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
              <span className="text-red-400">-2%</span>
              <span className="text-muted-foreground ml-1">vs période précédente</span>
            </div>
          </MetricCard>

          <MetricCard className="p-6" data-testid="metric-average-rating">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Note moyenne</h3>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {metrics?.averageRating?.toFixed(1) || "0.0"}
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-green-400">+0.2</span>
              <span className="text-muted-foreground ml-1">vs période précédente</span>
            </div>
          </MetricCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <MetricCard className="p-6" data-testid="chart-revenue-weekly">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg font-semibold">
                Chiffre d'affaires - {getPeriodLabel(selectedPeriod)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 flex items-end justify-between space-x-2">
                {revenueData.map((item, index) => (
                  <div key={item.day} className="flex flex-col items-center flex-1">
                    <div 
                      className="bg-primary/60 rounded-t w-full mb-2 transition-all duration-300 hover:bg-primary"
                      style={{ height: `${(item.value / maxRevenue) * 100}%` }}
                      title={`${item.day}: ${item.value}€`}
                    ></div>
                    <span className="text-xs text-muted-foreground">{item.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </MetricCard>

          {/* Top Services */}
          <MetricCard className="p-6" data-testid="chart-top-services">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg font-semibold">Services les plus demandés</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4">
                {metrics?.topServices?.map((service, index) => (
                  <div key={service.serviceName} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{service.serviceName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            index === 0 ? 'bg-primary' : 
                            index === 1 ? 'bg-secondary' : 
                            index === 2 ? 'bg-accent' : 'bg-yellow-400'
                          }`}
                          style={{ width: `${(service.count / (metrics.totalAppointments || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {service.count}
                      </span>
                    </div>
                  </div>
                )) || (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        <span className="text-muted-foreground">Aucune donnée</span>
                      </div>
                      <div className="w-20 bg-muted rounded-full h-2"></div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </MetricCard>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* No-shows Analysis */}
          <MetricCard className="p-6" data-testid="metric-noshows-analysis">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Users className="w-5 h-5 mr-2 text-red-400" />
                Analyse des No-shows
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total no-shows</span>
                  <span className="text-2xl font-bold text-red-400">
                    {metrics?.noShows || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Taux de no-show</span>
                  <span className="text-lg font-medium">
                    {metrics?.totalAppointments 
                      ? ((metrics.noShows || 0) / metrics.totalAppointments * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Recommandation: Envoyer des rappels 24h avant le RDV pour réduire les no-shows.
                  </p>
                </div>
              </div>
            </CardContent>
          </MetricCard>

          {/* Peak Hours */}
          <MetricCard className="p-6" data-testid="metric-peak-hours">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                Heures de pointe
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-primary/10 rounded">
                  <span className="text-sm">14h00 - 16h00</span>
                  <span className="text-sm font-medium">Peak</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-secondary/10 rounded">
                  <span className="text-sm">10h00 - 12h00</span>
                  <span className="text-sm font-medium">Élevé</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span className="text-sm">16h00 - 18h00</span>
                  <span className="text-sm font-medium">Moyen</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Optimisez vos plannings en fonction des heures de forte affluence.
                  </p>
                </div>
              </div>
            </CardContent>
          </MetricCard>

          {/* Client Satisfaction */}
          <MetricCard className="p-6" data-testid="metric-satisfaction">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-400" />
                Satisfaction Client
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">
                    {metrics?.averageRating?.toFixed(1) || "0.0"}
                  </div>
                  <div className="flex justify-center text-yellow-400 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Basé sur {reviews?.length || 0} avis
                  </p>
                </div>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center space-x-2">
                      <span className="text-xs w-4">{stars}★</span>
                      <div className="flex-1 bg-muted rounded-full h-1">
                        <div 
                          className="bg-yellow-400 h-1 rounded-full" 
                          style={{ width: `${stars === 5 ? 80 : stars === 4 ? 15 : 3}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground w-8">
                        {stars === 5 ? '80%' : stars === 4 ? '15%' : '3%'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </MetricCard>
        </div>
      </div>
    </div>
  );
}
