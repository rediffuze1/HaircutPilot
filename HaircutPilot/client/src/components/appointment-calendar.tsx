import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, addDays, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  MoreHorizontal
} from "lucide-react";

interface AppointmentCalendarProps {
  onAppointmentClick?: (appointment: any) => void;
  view?: 'week' | 'month';
  salonId?: string;
}

export function AppointmentCalendar({ 
  onAppointmentClick, 
  view = 'week',
  salonId 
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'week' | 'month'>(view);

  const { data: appointments, isLoading } = useQuery({
    queryKey: [
      "/api/appointments", 
      calendarView === 'week' 
        ? format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        : format(startOfMonth(currentDate), 'yyyy-MM-dd'),
      calendarView === 'week'
        ? format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), 'yyyy-MM-dd')
        : format(endOfMonth(currentDate), 'yyyy-MM-dd')
    ],
    retry: false,
  });

  const { data: stylists } = useQuery({
    queryKey: ["/api/stylists"],
    retry: false,
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    retry: false,
  });

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const amount = calendarView === 'week' ? 7 : 30;
    setCurrentDate(prev => addDays(prev, direction === 'next' ? amount : -amount));
  };

  const getAppointmentsForDay = (date: Date) => {
    if (!appointments) return [];
    return appointments.filter(apt => isSameDay(parseISO(apt.startTime), date));
  };

  const getStylistName = (stylistId: string) => {
    if (!stylists) return "Styliste";
    const stylist = stylists.find(s => s.id === stylistId);
    return stylist ? `${stylist.firstName} ${stylist.lastName}` : "Styliste";
  };

  const getServiceNames = (serviceIds: string[]) => {
    if (!services) return "Service";
    const serviceNames = serviceIds.map(id => {
      const service = services.find(s => s.id === id);
      return service ? service.name : "Service";
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

  const timeSlots = Array.from({ length: 12 }, (_, i) => 8 + i); // 8h à 19h

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (calendarView === 'week') {
    const weekDays = Array.from({ length: 7 }, (_, i) => 
      addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i)
    );

    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5" />
            <span>Calendrier des rendez-vous</span>
          </CardTitle>
          
          <div className="flex items-center space-x-4">
            <Select value={calendarView} onValueChange={(value: 'week' | 'month') => setCalendarView(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semaine</SelectItem>
                <SelectItem value="month">Mois</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateCalendar('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-sm font-medium min-w-[150px] text-center">
                {format(weekDays[0], 'd MMM', { locale: fr })} - {format(weekDays[6], 'd MMM yyyy', { locale: fr })}
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateCalendar('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="border-t">
            <div className="grid grid-cols-8 border-b">
              <div className="p-2 bg-muted/20 border-r">
                <span className="text-xs font-medium text-muted-foreground">Heure</span>
              </div>
              {weekDays.map((day, index) => (
                <div key={index} className="p-2 bg-muted/20 text-center border-r last:border-r-0">
                  <div className="text-xs font-medium text-muted-foreground">
                    {format(day, 'EEE', { locale: fr })}
                  </div>
                  <div className="text-sm font-semibold">
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {timeSlots.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]">
                  <div className="p-2 bg-muted/10 border-r flex items-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      {hour}:00
                    </span>
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const dayAppointments = getAppointmentsForDay(day).filter(apt => {
                      const aptHour = new Date(apt.startTime).getHours();
                      return aptHour === hour;
                    });
                    
                    return (
                      <div key={dayIndex} className="p-1 border-r last:border-r-0 relative">
                        {dayAppointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            onClick={() => onAppointmentClick?.(appointment)}
                            className="mb-1 p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: `var(--${getStatusColor(appointment.status).replace('bg-', 'chart-')})`,
                              color: 'white'
                            }}
                            data-testid={`appointment-${appointment.id}`}
                          >
                            <div className="font-medium text-xs">
                              {format(parseISO(appointment.startTime), 'HH:mm')}
                            </div>
                            <div className="truncate text-xs opacity-90">
                              {getServiceNames(appointment.serviceIds)}
                            </div>
                            <div className="truncate text-xs opacity-75">
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
          </div>
        </CardContent>
      </Card>
    );
  }

  // Month view
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5" />
          <span>Calendrier des rendez-vous</span>
        </CardTitle>
        
        <div className="flex items-center space-x-4">
          <Select value={calendarView} onValueChange={(value: 'week' | 'month') => setCalendarView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateCalendar('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-sm font-medium min-w-[120px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateCalendar('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {monthDays.map((day) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[80px] p-1 border rounded-lg",
                  isToday && "bg-primary/10 border-primary"
                )}
              >
                <div className={cn(
                  "text-xs font-medium mb-1",
                  isToday && "text-primary font-bold"
                )}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map((appointment) => (
                    <div
                      key={appointment.id}
                      onClick={() => onAppointmentClick?.(appointment)}
                      className="p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: `var(--${getStatusColor(appointment.status).replace('bg-', 'chart-')})`,
                        color: 'white'
                      }}
                      data-testid={`appointment-${appointment.id}`}
                    >
                      <div className="font-medium">
                        {format(parseISO(appointment.startTime), 'HH:mm')}
                      </div>
                      <div className="truncate opacity-90">
                        {getServiceNames(appointment.serviceIds).split(' ')[0]}
                      </div>
                    </div>
                  ))}
                  
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{dayAppointments.length - 2} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
