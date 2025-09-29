import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { GlassButton } from "@/components/ui/glass-button";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceAssistant } from "@/components/voice-assistant";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Calendar, 
  Plus, 
  UserPlus, 
  Bot, 
  Clock, 
  CalendarDays,
  UserX,
  PieChart,
  TrendingUp,
  Users,
  BarChart3,
  Star,
  Scissors
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: salon, isLoading: salonLoading } = useQuery({
    queryKey: ["/api/salon"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/metrics"],
    retry: false,
    enabled: isAuthenticated,
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
        return;
      }
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["/api/reviews"],
    retry: false,
    enabled: isAuthenticated,
  });

  if (authLoading || salonLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const salonName = salon?.name || user?.salonName || "Votre Salon";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="bg-card/50 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Scissors className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Hair Cut Pilot</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/calendar" className="text-sm hover:text-primary">Calendrier</Link>
              <Link href="/services" className="text-sm hover:text-primary">Services</Link>
              <Link href="/stylists" className="text-sm hover:text-primary">Stylistes</Link>
              <Link href="/clients" className="text-sm hover:text-primary">Clients</Link>
              <Link href="/reports" className="text-sm hover:text-primary">Rapports</Link>
              <Link href="/settings" className="text-sm hover:text-primary">Paramètres</Link>
              <a href="/api/logout" className="text-sm hover:text-primary">Déconnexion</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Header */}
      <div className="bg-card/50 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-salon-greeting">
                Bonjour, {salonName}
              </h1>
              <p className="text-muted-foreground mt-1" data-testid="text-current-date">
                {currentDate}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
              <GlassButton asChild data-testid="button-new-service">
                <Link href="/services">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau service
                </Link>
              </GlassButton>
              <GlassButton asChild data-testid="button-add-stylist">
                <Link href="/stylists">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter styliste
                </Link>
              </GlassButton>
              <GlassButton 
                onClick={() => setIsVoiceOpen(true)}
                data-testid="button-ai-assistant"
              >
                <Bot className="w-4 h-4 mr-2" />
                Assistant IA
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* RDV du jour */}
          <MetricCard className="p-6" data-testid="metric-appointments-today">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">RDV du jour</h3>
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">
              {metrics?.totalAppointments || 0}
            </div>
            <div className="flex items-center text-sm">
              <span className="text-green-400">+8%</span>
              <span className="text-muted-foreground ml-1">vs hier</span>
            </div>
            <div className="sparkline mt-3"></div>
          </MetricCard>

          {/* Slots libres */}
          <MetricCard className="p-6" data-testid="metric-available-slots">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Slots libres</h3>
              <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">6</div>
            <div className="text-sm text-muted-foreground">Jusqu'à 18h</div>
            <div className="sparkline mt-3" style={{background: 'linear-gradient(90deg, transparent, rgba(168, 239, 255, 0.5), transparent)'}}></div>
          </MetricCard>

          {/* No-shows */}
          <MetricCard className="p-6" data-testid="metric-no-shows">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">No-shows</h3>
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <UserX className="w-4 h-4 text-red-400" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">
              {metrics?.noShows || 0}
            </div>
            <div className="flex items-center text-sm">
              <span className="text-red-400">+1</span>
              <span className="text-muted-foreground ml-1">cette semaine</span>
            </div>
          </MetricCard>

          {/* Taux de remplissage */}
          <MetricCard className="p-6" data-testid="metric-occupancy-rate">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Taux remplissage</h3>
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <PieChart className="w-4 h-4 text-green-400" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">87%</div>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div className="bg-green-400 h-2 rounded-full" style={{width: '87%'}}></div>
            </div>
          </MetricCard>
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <MetricCard className="p-6" data-testid="chart-revenue">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-semibold">Chiffre d'affaires par semaine</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 flex items-end justify-between space-x-2">
                <div className="bg-primary/60 rounded-t w-full" style={{height: '60%'}}></div>
                <div className="bg-primary/60 rounded-t w-full" style={{height: '80%'}}></div>
                <div className="bg-primary/60 rounded-t w-full" style={{height: '45%'}}></div>
                <div className="bg-primary/60 rounded-t w-full" style={{height: '90%'}}></div>
                <div className="bg-primary/60 rounded-t w-full" style={{height: '75%'}}></div>
                <div className="bg-primary rounded-t w-full" style={{height: '100%'}}></div>
                <div className="bg-primary/40 rounded-t w-full" style={{height: '30%'}}></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Lun</span>
                <span>Mar</span>
                <span>Mer</span>
                <span>Jeu</span>
                <span>Ven</span>
                <span>Sam</span>
                <span>Dim</span>
              </div>
            </CardContent>
          </MetricCard>

          {/* Services Distribution */}
          <MetricCard className="p-6" data-testid="chart-services">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-semibold">Répartition des services</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4">
                {metrics?.topServices?.slice(0, 4).map((service, index) => (
                  <div key={service.serviceName} className="flex items-center justify-between">
                    <span className="text-sm">{service.serviceName}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${index === 0 ? 'bg-primary' : index === 1 ? 'bg-secondary' : index === 2 ? 'bg-accent' : 'bg-yellow-400'}`}
                          style={{width: `${(service.count / (metrics.totalAppointments || 1)) * 100}%`}}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round((service.count / (metrics.totalAppointments || 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                )) || (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Coupe femme</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{width: '45%'}}></div>
                        </div>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Couleur</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div className="bg-secondary h-2 rounded-full" style={{width: '30%'}}></div>
                        </div>
                        <span className="text-sm font-medium">30%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </MetricCard>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard className="p-6 cursor-pointer group" asChild data-testid="action-calendar">
            <Link href="/calendar">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Calendrier</h3>
                  <p className="text-sm text-muted-foreground">Gérer les rendez-vous</p>
                </div>
              </div>
            </Link>
          </MetricCard>

          <MetricCard className="p-6 cursor-pointer group" asChild data-testid="action-stylists">
            <Link href="/stylists">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">Stylistes</h3>
                  <p className="text-sm text-muted-foreground">Équipe et plannings</p>
                </div>
              </div>
            </Link>
          </MetricCard>

          <MetricCard className="p-6 cursor-pointer group" asChild data-testid="action-reports">
            <Link href="/reports">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                  <BarChart3 className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Rapports</h3>
                  <p className="text-sm text-muted-foreground">Analyses et métriques</p>
                </div>
              </div>
            </Link>
          </MetricCard>
        </div>

        {/* Recent Reviews Section */}
        <div className="mt-8">
          <MetricCard className="p-6" data-testid="section-recent-reviews">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-semibold">Avis récents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4">
                {reviews && reviews.length > 0 ? (
                  reviews.slice(0, 2).map((review, index) => (
                    <div key={review.id} className="flex items-start space-x-4 p-4 bg-muted/20 rounded-lg">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {review.clientId?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">Client #{review.clientId?.slice(-4)}</span>
                          <div className="flex text-yellow-400">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-start space-x-4 p-4 bg-muted/20 rounded-lg">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
                        S
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">Sophie Martin</span>
                          <div className="flex text-yellow-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">"Service excellent, très satisfaite de ma nouvelle coupe !"</p>
                        <span className="text-xs text-muted-foreground">Il y a 2 heures</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-4 bg-muted/20 rounded-lg">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-sm font-bold text-secondary-foreground">
                        M
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">Marie Dubois</span>
                          <div className="flex text-yellow-400">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                            <Star className="w-3 h-3" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">"Équipe professionnelle, salon très agréable."</p>
                        <span className="text-xs text-muted-foreground">Hier</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </MetricCard>
        </div>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistant 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)}
        salonId={salon?.id}
      />
    </div>
  );
}
