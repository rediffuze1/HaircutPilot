import { useState } from "react";
import { Link } from "wouter";
import { GlassButton } from "@/components/ui/glass-button";
import { MetricCard } from "@/components/ui/metric-card";
import { TypingText } from "@/components/ui/typing-text";
import { VoiceAssistant } from "@/components/voice-assistant";
import { 
  Calendar, 
  Bot, 
  Users, 
  CreditCard, 
  Clock, 
  Scissors, 
  Sparkles 
} from "lucide-react";

export default function Landing() {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const typingTexts = [
    "Choisissez votre coiffeur préféré.",
    "Parlez à notre réceptionniste IA.",
    "Visualisez les disponibilités en temps réel.",
    "Gérez, modifiez, annulez en 1 clic."
  ];

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
              <GlassButton asChild data-testid="button-login">
                <a href="/api/login">Se connecter</a>
              </GlassButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative pt-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-6" data-testid="text-hero-title">
            Réservez en toute simplicité.
          </h1>
          
          <div className="mb-8">
            <TypingText 
              texts={typingTexts}
              className="text-2xl md:text-3xl text-muted-foreground"
              speed={50}
              delay={2000}
            />
          </div>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Réservation en ligne et réceptionniste IA — en un seul endroit.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GlassButton 
              size="lg" 
              className="px-8 py-4 text-lg font-semibold flex items-center justify-center space-x-2"
              asChild
              data-testid="button-booking"
            >
              <a href="/api/login">
                <Calendar className="w-5 h-5" />
                <span>Prendre un rendez-vous</span>
              </a>
            </GlassButton>
            
            <GlassButton 
              size="lg" 
              variant="secondary"
              className="px-8 py-4 text-lg font-semibold flex items-center justify-center space-x-2"
              onClick={() => setIsVoiceOpen(true)}
              data-testid="button-ai"
            >
              <Bot className="w-5 h-5" />
              <span>Parler à l'IA</span>
            </GlassButton>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4" data-testid="text-features-title">
            Ce que fait l'app
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Une solution complète pour gérer votre salon et offrir une expérience client exceptionnelle.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <MetricCard className="p-6">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Réservation express</h3>
              <p className="text-muted-foreground">
                Formulaire simple, slots en temps réel, confirmation instantanée.
              </p>
            </MetricCard>
            
            <MetricCard className="p-6">
              <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">IA réceptionniste</h3>
              <p className="text-muted-foreground">
                Prise de RDV à la voix, 24/7, confirmations instantanées.
              </p>
            </MetricCard>
            
            <MetricCard className="p-6">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Stylistes & services</h3>
              <p className="text-muted-foreground">
                Choisissez un(e) coiffeur(se), durée & prix clairs.
              </p>
            </MetricCard>
            
            <MetricCard className="p-6">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Paiement & rappels</h3>
              <p className="text-muted-foreground">
                Acompte/plein tarif, SMS/Email/WhatsApp.
              </p>
            </MetricCard>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Comment ça marche</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Choisissez service & date</h3>
              <p className="text-muted-foreground">
                Sélectionnez votre service préféré et trouvez le créneau parfait.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-secondary-foreground">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Validez & payez</h3>
              <p className="text-muted-foreground">
                Confirmez votre réservation et réglez en ligne de manière sécurisée.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/80 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-accent-foreground">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Recevez confirmation & rappels</h3>
              <p className="text-muted-foreground">
                Obtenez instantanément votre confirmation et nos rappels automatiques.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Hair Cut Pilot</span>
          </div>
          <p className="text-muted-foreground mb-4">
            La solution de réservation nouvelle génération pour votre salon.
          </p>
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-muted-foreground hover:text-primary">
              Mentions légales
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary">
              Confidentialité
            </a>
            <a href="/api/login" className="text-muted-foreground hover:text-primary">
              Se connecter
            </a>
          </div>
        </div>
      </footer>

      {/* Voice Assistant Modal */}
      <VoiceAssistant 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)} 
      />
    </div>
  );
}
