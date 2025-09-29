import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDays, format, startOfDay, addMinutes, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { GlassButton } from "@/components/ui/glass-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon,
  Clock,
  Euro,
  User,
  Phone,
  Mail,
  MessageSquare,
  ChevronRight
} from "lucide-react";

const bookingSchema = z.object({
  serviceIds: z.array(z.string()).min(1, "Veuillez sélectionner au moins un service"),
  stylistId: z.string().optional(),
  date: z.date({
    required_error: "Veuillez sélectionner une date",
  }),
  timeSlot: z.string({
    required_error: "Veuillez sélectionner un créneau",
  }),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().min(1, "Le téléphone est requis"),
  notes: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, "Veuillez accepter les conditions"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  services: any[];
  stylists: any[];
  salonId: string;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function BookingForm({ services, stylists, salonId, onSubmit, isLoading }: BookingFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceIds: [],
      stylistId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
      acceptTerms: false,
    },
  });

  const watchedDate = form.watch("date");
  const watchedStylist = form.watch("stylistId");

  // Calculate totals when services change
  useEffect(() => {
    const duration = selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.durationMinutes || 0);
    }, 0);

    const price = selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (Number(service?.price) || 0);
    }, 0);

    setTotalDuration(duration);
    setTotalPrice(price);
  }, [selectedServices, services]);

  // Generate available time slots
  useEffect(() => {
    if (watchedDate && totalDuration > 0) {
      const slots = generateTimeSlots(watchedDate, totalDuration);
      setAvailableSlots(slots);
    }
  }, [watchedDate, totalDuration, watchedStylist]);

  const generateTimeSlots = (date: Date, duration: number) => {
    const slots: string[] = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    const slotInterval = 30; // 30 minutes intervals

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = addMinutes(slotStart, duration);
        
        // Check if slot ends before closing time
        if (slotEnd.getHours() <= endHour) {
          // Check if slot is in the future (at least 2 hours from now)
          const minimumTime = addMinutes(new Date(), 120);
          if (slotStart > minimumTime) {
            slots.push(format(slotStart, 'HH:mm'));
          }
        }
      }
    }

    return slots;
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    let newSelection;
    if (checked) {
      newSelection = [...selectedServices, serviceId];
    } else {
      newSelection = selectedServices.filter(id => id !== serviceId);
    }
    
    setSelectedServices(newSelection);
    form.setValue("serviceIds", newSelection);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate services selection
      if (selectedServices.length === 0) {
        form.setError("serviceIds", { message: "Veuillez sélectionner au moins un service" });
        return;
      }
      form.clearErrors("serviceIds");
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormSubmit = (data: BookingFormData) => {
    const selectedDate = data.date;
    const [hours, minutes] = data.timeSlot.split(':').map(Number);
    
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);
    
    const endTime = addMinutes(startTime, totalDuration);

    // Calculate deposit if required
    const requiresDeposit = selectedServices.some(serviceId => {
      const service = services.find(s => s.id === serviceId);
      return service?.requiresDeposit;
    });

    const depositAmount = requiresDeposit ? Math.round(totalPrice * 0.2 * 100) / 100 : 0;

    const bookingData = {
      ...data,
      salonId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalAmount: totalPrice,
      depositAmount,
      requiresPayment: requiresDeposit,
      // For new clients, we'll create them on the backend
      clientId: null,
    };

    onSubmit(bookingData);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  const steps = [
    { number: 1, title: "Services", icon: <User className="w-4 h-4" /> },
    { number: 2, title: "Styliste", icon: <User className="w-4 h-4" /> },
    { number: 3, title: "Date & Heure", icon: <CalendarIcon className="w-4 h-4" /> },
    { number: 4, title: "Informations", icon: <Phone className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
              currentStep >= step.number 
                ? "bg-primary border-primary text-primary-foreground" 
                : "border-muted-foreground text-muted-foreground"
            )}>
              {step.icon}
            </div>
            <div className="ml-2 hidden sm:block">
              <p className={cn(
                "text-sm font-medium",
                currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="w-5 h-5 mx-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Step 1: Services */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Choisissez vos services</h3>
              <FormField
                control={form.control}
                name="serviceIds"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-1 gap-4">
                      {services.map((service) => (
                        <Card 
                          key={service.id} 
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-muted/20",
                            selectedServices.includes(service.id) && "ring-2 ring-primary"
                          )}
                          onClick={() => handleServiceToggle(service.id, !selectedServices.includes(service.id))}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={selectedServices.includes(service.id)}
                                  onChange={() => {}}
                                  data-testid={`checkbox-service-${service.id}`}
                                />
                                <div>
                                  <h4 className="font-medium">{service.name}</h4>
                                  {service.description && (
                                    <p className="text-sm text-muted-foreground">{service.description}</p>
                                  )}
                                  <div className="flex items-center space-x-4 mt-1">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {service.durationMinutes} min
                                    </div>
                                    <div className="flex items-center text-sm font-medium">
                                      <Euro className="w-3 h-3 mr-1" />
                                      {Number(service.price).toFixed(0)}€
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {service.tags && service.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {service.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedServices.length > 0 && (
                <Card className="bg-primary/10">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Total sélectionné</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatPrice(totalPrice)}</p>
                        <p className="text-sm text-muted-foreground">{formatDuration(totalDuration)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Stylist */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Choisissez votre styliste</h3>
              <FormField
                control={form.control}
                name="stylistId"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card 
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/20",
                          !field.value && "ring-2 ring-primary"
                        )}
                        onClick={() => field.onChange("")}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                            <User className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <h4 className="font-medium">Pas de préférence</h4>
                          <p className="text-sm text-muted-foreground">Premier styliste disponible</p>
                        </CardContent>
                      </Card>
                      
                      {stylists.map((stylist) => (
                        <Card 
                          key={stylist.id}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-muted/20",
                            field.value === stylist.id && "ring-2 ring-primary"
                          )}
                          onClick={() => field.onChange(stylist.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="text-lg font-bold">
                                {stylist.firstName[0]}{stylist.lastName[0]}
                              </span>
                            </div>
                            <h4 className="font-medium">{stylist.firstName} {stylist.lastName}</h4>
                            {stylist.specialties && stylist.specialties.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2 justify-center">
                                {stylist.specialties.slice(0, 2).map((specialty, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 3: Date & Time */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Choisissez votre créneau</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-select-date"
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: fr })
                              ) : (
                                <span>Sélectionner une date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => 
                              date < startOfDay(new Date()) || 
                              date > addDays(new Date(), 60)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeSlot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heure</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-time-slot">
                            <SelectValue placeholder="Sélectionner un créneau" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSlots.length > 0 ? (
                            availableSlots.map((slot) => (
                              <SelectItem key={slot} value={slot}>
                                {slot} ({formatDuration(totalDuration)})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              {watchedDate ? "Aucun créneau disponible" : "Sélectionnez d'abord une date"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Step 4: Client Information */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Vos informations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom*</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom*</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone*</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Demandes particulières, préférences..."
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-accept-terms"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        J'accepte les conditions générales et la politique d'annulation
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* Booking Summary */}
              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Récapitulatif de votre réservation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Services:</span>
                      <span>
                        {selectedServices.map(id => {
                          const service = services.find(s => s.id === id);
                          return service?.name;
                        }).join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Durée:</span>
                      <span>{formatDuration(totalDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>
                        {form.watch('date') && format(form.watch('date'), "PPP", { locale: fr })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Heure:</span>
                      <span>{form.watch('timeSlot')}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              data-testid="button-prev-step"
            >
              Précédent
            </Button>

            {currentStep < 4 ? (
              <GlassButton
                type="button"
                onClick={handleNextStep}
                data-testid="button-next-step"
              >
                Suivant
              </GlassButton>
            ) : (
              <GlassButton
                type="submit"
                disabled={isLoading}
                data-testid="button-submit-booking"
              >
                {isLoading ? "Réservation..." : "Confirmer la réservation"}
              </GlassButton>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
