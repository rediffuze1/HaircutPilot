import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { GlassButton } from "@/components/ui/glass-button";
import { MetricCard } from "@/components/ui/metric-card";
import { Scissors, LogIn, UserPlus } from "lucide-react";

export default function Auth() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Animated Background Shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="geometric-shape w-32 h-32 top-10 left-10" style={{ animationDelay: '0s' }}></div>
        <div className="geometric-shape w-24 h-24 top-1/3 right-20" style={{ animationDelay: '2s' }}></div>
        <div className="geometric-shape w-40 h-40 bottom-20 left-1/4" style={{ animationDelay: '4s' }}></div>
        <div className="geometric-shape w-20 h-20 top-1/2 left-1/2" style={{ animationDelay: '1s' }}></div>
        <div className="geometric-shape w-36 h-36 bottom-1/3 right-10" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Scissors className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Hair Cut Pilot</span>
            </div>
            <div className="flex items-center space-x-4">
              <GlassButton asChild data-testid="button-home">
                <a href="/">Accueil</a>
              </GlassButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Content */}
      <div className="min-h-screen flex items-center justify-center pt-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <MetricCard className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Scissors className="w-8 h-8 text-primary" />
              </div>
              
              <h1 className="text-3xl font-bold mb-2" data-testid="text-auth-title">
                Bienvenue sur Hair Cut Pilot
              </h1>
              <p className="text-muted-foreground mb-8">
                Connectez-vous pour accéder à votre tableau de bord salon
              </p>

              <div className="space-y-4">
                <GlassButton 
                  asChild 
                  className="w-full py-4 text-lg font-semibold"
                  data-testid="button-login"
                >
                  <a href="/api/login" className="flex items-center justify-center space-x-2">
                    <LogIn className="w-5 h-5" />
                    <span>Se connecter</span>
                  </a>
                </GlassButton>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">Nouveau sur Hair Cut Pilot ?</span>
                  </div>
                </div>

                <GlassButton 
                  variant="secondary"
                  asChild 
                  className="w-full py-4 text-lg font-semibold"
                  data-testid="button-signup"
                >
                  <a href="/api/login" className="flex items-center justify-center space-x-2">
                    <UserPlus className="w-5 h-5" />
                    <span>Créer un compte</span>
                  </a>
                </GlassButton>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  En vous connectant, vous acceptez nos{" "}
                  <a href="#" className="text-primary hover:underline">
                    conditions d'utilisation
                  </a>{" "}
                  et notre{" "}
                  <a href="#" className="text-primary hover:underline">
                    politique de confidentialité
                  </a>
                  .
                </p>
              </div>
            </div>
          </MetricCard>

          {/* Features Preview */}
          <div className="mt-8 grid grid-cols-1 gap-4">
            <MetricCard className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Gestion simplifiée</h3>
                  <p className="text-sm text-muted-foreground">
                    Tableau de bord intuitif pour votre salon
                  </p>
                </div>
              </div>
            </MetricCard>

            <MetricCard className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">Réservation en ligne</h3>
                  <p className="text-sm text-muted-foreground">
                    Système de réservation automatisé
                  </p>
                </div>
              </div>
            </MetricCard>

            <MetricCard className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Assistant IA vocal</h3>
                  <p className="text-sm text-muted-foreground">
                    Réceptionniste virtuelle 24/7
                  </p>
                </div>
              </div>
            </MetricCard>
          </div>
        </div>
      </div>
    </div>
  );
}
