import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { GlassButton } from "@/components/ui/glass-button";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  CalendarDays, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function Calendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["/api/appointments", format(currentWeek, 'yyyy-MM-dd'), format(addDays(currentWeek, 6), 'yyyy-MM-dd')],
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

  const { data: stylists } = useQuery({
    queryKey: ["/api/stylists"],
    retry: false,
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    retry: false,
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/appointments/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/appointments"]);
      toast({
        title: "Rendez-vous mis à jour",
        description: "Le statut du rendez-vous a été modifié.",
      });
      setIsDetailOpen(false);
    },
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
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rendez-vous.",
        variant: "destructive",
      });
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/appointments/${id}/cancel`, { reason: "Cancelled from admin" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/appointments"]);
      toast({
        title: "Rendez-vous annulé",
        description: "Le rendez-vous a été annulé avec succès.",
      });
      setIsDetailOpen(false);
    },
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
      toast({
        title: "Erreur",
        description: "Impossible d'annuler le rendez-vous.",
        variant: "destructive",
      });
    },
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const getAppointmentsForDay = (date: Date) => {
    if (!appointments) return [];
    return appointments.filter(apt => isSameDay(parseISO(apt.startTime), date));
  };

  const getStylistName = (stylistId: string) => {
    if (!stylists) return "Styliste inconnu";
    const stylist = stylists.find(s => s.id === stylistId);
    return stylist ? `${stylist.firstName} ${stylist.lastName}` : "Styliste inconnu";
  };

  const getServiceNames = (serviceIds: string[]) => {
    if (!services) return "Service inconnu";
    const serviceNames = serviceIds.map(id => {
      const service = services.find(s => s.id === id);
      return service ? service.name : "Service inconnu";
    });
    return serviceNames.join(", ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      case 'no_show': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      case 'no_show': return 'No-show';
      default: return status;
    }
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsDetailOpen(true);
  };

  const timeSlots = Array.from({ length: 12 }, (_, i) => 8 + i); // 8h à 19h

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
                <CalendarDays className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Calendrier</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/api/logout" className="text-sm hover:text-primary">Déconnexion</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Calendrier des Rendez-vous</h1>
            <p className="text-muted-foreground">
              Vue hebdomadaire de vos rendez-vous
            </p>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center space-x-4">
            <GlassButton 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateWeek('prev')}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="w-4 h-4" />
            </GlassButton>
            <div className="text-lg font-medium min-w-[200px] text-center">
              {format(currentWeek, 'd MMM', { locale: fr })} - {format(addDays(currentWeek, 6), 'd MMM yyyy', { locale: fr })}
            </div>
            <GlassButton 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateWeek('next')}
              data-testid="button-next-week"
            >
              <ChevronRight className="w-4 h-4" />
            </GlassButton>
          </div>
        </div>

        {/* Calendar Grid */}
        <MetricCard className="overflow-hidden">
          <div className="grid grid-cols-8 border-b border-border">
            <div className="p-4 bg-muted/20">
              <span className="text-sm font-medium text-muted-foreground">Heure</span>
            </div>
            {weekDays.map((day, index) => (
              <div key={index} className="p-4 bg-muted/20 text-center border-l border-border">
                <div className="text-sm font-medium">
                  {format(day, 'EEE', { locale: fr })}
                </div>
                <div className="text-lg font-bold">
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
          
          <div className="max-h-[600px] overflow-y-auto">
            {timeSlots.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-border min-h-[80px]">
                <div className="p-4 bg-muted/10 border-r border-border flex items-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    {hour}:00
                  </span>
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dayAppointments = getAppointmentsForDay(day).filter(apt => {
                    const aptHour = new Date(apt.startTime).getHours();
                    return aptHour === hour;
                  });
                  
                  return (
                    <div key={dayIndex} className="p-2 border-l border-border relative">
                      {dayAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          onClick={() => handleAppointmentClick(appointment)}
                          className="mb-1 p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity text-xs"
                          style={{
                            backgroundColor: `var(--${getStatusColor(appointment.status).replace('bg-', 'chart-')})`,
                            color: 'white'
                          }}
                          data-testid={`appointment-${appointment.id}`}
                        >
                          <div className="font-medium">
                            {format(parseISO(appointment.startTime), 'HH:mm')} - 
                            {format(parseISO(appointment.endTime), 'HH:mm')}
                          </div>
                          <div className="truncate">
                            {getServiceNames(appointment.serviceIds)}
                          </div>
                          <div className="truncate opacity-75">
                            {getStylistName(appointment.stylistId)}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </MetricCard>

        {/* Appointment Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="glass max-w-md">
            <DialogHeader>
              <DialogTitle>Détails du rendez-vous</DialogTitle>
            </DialogHeader>
            
            {selectedAppointment && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(selectedAppointment.status)} text-white`}
                  >
                    {getStatusLabel(selectedAppointment.status)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    #{selectedAppointment.id.slice(-8)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {format(parseISO(selectedAppointment.startTime), 'dd/MM/yyyy HH:mm')} - 
                      {format(parseISO(selectedAppointment.endTime), 'HH:mm')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{getStylistName(selectedAppointment.stylistId)}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground">Services:</span>
                    <p className="font-medium">{getServiceNames(selectedAppointment.serviceIds)}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground">Montant:</span>
                    <p className="font-medium">{Number(selectedAppointment.totalAmount).toFixed(2)} €</p>
                  </div>
                  
                  {selectedAppointment.notes && (
                    <div>
                      <span className="text-sm text-muted-foreground">Notes:</span>
                      <p className="text-sm">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {selectedAppointment.status === 'pending' && (
                    <GlassButton
                      size="sm"
                      onClick={() => updateAppointmentMutation.mutate({ 
                        id: selectedAppointment.id, 
                        status: 'confirmed' 
                      })}
                      data-testid="button-confirm-appointment"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Confirmer
                    </GlassButton>
                  )}
                  
                  {selectedAppointment.status === 'confirmed' && (
                    <GlassButton
                      size="sm"
                      onClick={() => updateAppointmentMutation.mutate({ 
                        id: selectedAppointment.id, 
                        status: 'completed' 
                      })}
                      data-testid="button-complete-appointment"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Terminer
                    </GlassButton>
                  )}
                  
                  {!['cancelled', 'completed'].includes(selectedAppointment.status) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => cancelAppointmentMutation.mutate(selectedAppointment.id)}
                      data-testid="button-cancel-appointment"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
