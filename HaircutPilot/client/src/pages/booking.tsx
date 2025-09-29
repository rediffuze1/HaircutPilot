import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookingForm } from "@/components/booking-form";
import { VoiceAssistant } from "@/components/voice-assistant";
import { GlassButton } from "@/components/ui/glass-button";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Scissors, 
  Clock, 
  Euro, 
  Star, 
  Bot, 
  Calendar,
  CheckCircle,
  ArrowLeft
} from "lucide-react";

interface BookingPageParams {
  salonId?: string;
}

const confirmationSchema = z.object({
  appointmentId: z.string(),
  clientSecret: z.string().optional(),
});

export default function Booking() {
  const params = useParams<BookingPageParams>();
  const { toast } = useToast();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'booking' | 'payment' | 'confirmation'>('booking');
  const [bookingData, setBookingData] = useState<any>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<any>(null);

  // Default salon ID for demo purposes
  const salonId = params.salonId || 'demo-salon';

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: [`/api/public/salon/${salonId}/services`],
    retry: false,
  });

  const { data: stylists, isLoading: stylistsLoading } = useQuery({
    queryKey: [`/api/public/salon/${salonId}/stylists`],
    retry: false,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const response = await apiRequest("POST", "/api/appointments", appointmentData);
      return response.json();
    },
    onSuccess: (appointment) => {
      setConfirmedAppointment(appointment);
      if (bookingData.requiresPayment) {
        setCurrentStep('payment');
      } else {
        setCurrentStep('confirmation');
        toast({
          title: "Rendez-vous confirmé ✨",
          description: "Vous recevrez un email de confirmation sous peu.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le rendez-vous. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async ({ amount, appointmentId }: { amount: number; appointmentId: string }) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount,
        appointmentId,
      });
      return response.json();
    },
    onSuccess: (paymentData) => {
      // In a real implementation, this would redirect to Stripe checkout
      // For now, we'll simulate payment success
      setTimeout(() => {
        setCurrentStep('confirmation');
        toast({
          title: "Paiement confirmé ✨",
          description: "Votre rendez-vous est confirmé et payé.",
        });
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Erreur de paiement",
        description: "Le paiement a échoué. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const handleBookingSubmit = (data: any) => {
    setBookingData(data);
    
    const appointmentData = {
      salonId,
      clientId: data.clientId,
      stylistId: data.stylistId,
      serviceIds: data.serviceIds,
      startTime: data.startTime,
      endTime: data.endTime,
      totalAmount: data.totalAmount,
      depositAmount: data.depositAmount,
      notes: data.notes,
      channel: 'form',
    };

    createAppointmentMutation.mutate(appointmentData);
  };

  const handlePayment = () => {
    if (confirmedAppointment && bookingData) {
      createPaymentMutation.mutate({
        amount: bookingData.depositAmount || bookingData.totalAmount,
        appointmentId: confirmedAppointment.id,
      });
    }
  };

  const isLoading = servicesLoading || stylistsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
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
              <GlassButton 
                onClick={() => setIsVoiceOpen(true)}
                data-testid="button-voice-assistant"
              >
                <Bot className="w-4 h-4 mr-2" />
                Assistant IA
              </GlassButton>
              <GlassButton asChild data-testid="button-back-home">
                <a href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Accueil
                </a>
              </GlassButton>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16">
        {currentStep === 'booking' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4" data-testid="text-booking-title">
                Réservez votre rendez-vous
              </h1>
              <p className="text-muted-foreground text-lg">
                Choisissez votre service et votre créneau préféré
              </p>
            </div>

            {/* Services Preview */}
            {services && services.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Nos Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.slice(0, 6).map((service) => (
                    <MetricCard key={service.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{service.name}</h3>
                        <div className="flex items-center text-sm">
                          <Euro className="w-3 h-3 mr-1" />
                          <span>{Number(service.price).toFixed(0)}€</span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{service.durationMinutes} min</span>
                      </div>
                    </MetricCard>
                  ))}
                </div>
              </div>
            )}

            {/* Stylists Preview */}
            {stylists && stylists.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Notre Équipe</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stylists.map((stylist) => (
                    <MetricCard key={stylist.id} className="p-4 text-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-lg font-bold">
                          {stylist.firstName[0]}{stylist.lastName[0]}
                        </span>
                      </div>
                      <h3 className="font-semibold">{stylist.firstName} {stylist.lastName}</h3>
                      <div className="flex justify-center text-yellow-400 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      {stylist.specialties && stylist.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 justify-center">
                          {stylist.specialties.slice(0, 2).map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </MetricCard>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Form */}
            <MetricCard className="p-6">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl font-semibold flex items-center">
                  <Calendar className="w-6 h-6 mr-2" />
                  Réserver un rendez-vous
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <BookingForm
                  services={services || []}
                  stylists={stylists || []}
                  salonId={salonId}
                  onSubmit={handleBookingSubmit}
                  isLoading={createAppointmentMutation.isPending}
                />
              </CardContent>
            </MetricCard>
          </div>
        )}

        {currentStep === 'payment' && confirmedAppointment && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <MetricCard className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Euro className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Finaliser le paiement</h1>
              <p className="text-muted-foreground mb-6">
                Votre rendez-vous est réservé. Procédez au paiement pour confirmer.
              </p>
              
              <div className="bg-muted/20 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span>Montant à payer:</span>
                  <span className="text-xl font-bold">
                    {Number(bookingData.depositAmount || bookingData.totalAmount).toFixed(2)}€
                  </span>
                </div>
                {bookingData.depositAmount && (
                  <p className="text-sm text-muted-foreground">
                    Acompte • Total: {Number(bookingData.totalAmount).toFixed(2)}€
                  </p>
                )}
              </div>

              <GlassButton 
                onClick={handlePayment}
                disabled={createPaymentMutation.isPending}
                className="w-full mb-4"
                data-testid="button-pay"
              >
                {createPaymentMutation.isPending ? "Traitement..." : "Payer maintenant"}
              </GlassButton>
              
              <p className="text-xs text-muted-foreground">
                Paiement sécurisé par Stripe
              </p>
            </MetricCard>
          </div>
        )}

        {currentStep === 'confirmation' && confirmedAppointment && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <MetricCard className="p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Rendez-vous confirmé !</h1>
              <p className="text-muted-foreground mb-6">
                Votre rendez-vous a été créé avec succès. Vous recevrez un email de confirmation.
              </p>
              
              <div className="bg-muted/20 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold mb-4">Détails de votre rendez-vous</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">
                      {new Date(confirmedAppointment.startTime).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Heure:</span>
                    <span className="font-medium">
                      {new Date(confirmedAppointment.startTime).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant:</span>
                    <span className="font-medium">
                      {Number(confirmedAppointment.totalAmount).toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Référence:</span>
                    <span className="font-medium font-mono">
                      #{confirmedAppointment.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <GlassButton asChild className="flex-1" data-testid="button-home">
                  <a href="/">Retour à l'accueil</a>
                </GlassButton>
                <GlassButton 
                  variant="secondary" 
                  onClick={() => {
                    setCurrentStep('booking');
                    setBookingData(null);
                    setConfirmedAppointment(null);
                  }}
                  className="flex-1"
                  data-testid="button-new-appointment"
                >
                  Nouveau RDV
                </GlassButton>
              </div>
            </MetricCard>
          </div>
        )}
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistant 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)}
        salonId={salonId}
      />
    </div>
  );
}
