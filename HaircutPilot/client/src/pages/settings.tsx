import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { GlassButton } from "@/components/ui/glass-button";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { 
  Settings as SettingsIcon, 
  ArrowLeft, 
  Save,
  Store,
  Clock,
  CreditCard,
  Bell,
  Palette,
  Globe,
  Phone,
  Mail
} from "lucide-react";

const salonSchema = z.object({
  name: z.string().min(1, "Le nom du salon est requis"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
});

const hoursSchema = z.object({
  monday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean().default(false),
  }),
  tuesday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean().default(false),
  }),
  wednesday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean().default(false),
  }),
  thursday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean().default(false),
  }),
  friday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean().default(false),
  }),
  saturday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean().default(false),
  }),
  sunday: z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean().default(false),
  }),
});

const policiesSchema = z.object({
  cancellationHours: z.coerce.number().min(0, "Doit être positif"),
  depositRequired: z.boolean(),
  depositPercentage: z.coerce.number().min(0).max(100, "Doit être entre 0 et 100"),
  noShowPolicy: z.string(),
});

const brandingSchema = z.object({
  logo: z.string().url("URL invalide").optional().or(z.literal("")),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

const socialsSchema = z.object({
  instagram: z.string().url("URL invalide").optional().or(z.literal("")),
  facebook: z.string().url("URL invalide").optional().or(z.literal("")),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
});

type SalonFormData = z.infer<typeof salonSchema>;
type HoursFormData = z.infer<typeof hoursSchema>;
type PoliciesFormData = z.infer<typeof policiesSchema>;
type BrandingFormData = z.infer<typeof brandingSchema>;
type SocialsFormData = z.infer<typeof socialsSchema>;

export default function Settings() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");

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

  // Forms
  const salonForm = useForm<SalonFormData>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  const hoursForm = useForm<HoursFormData>({
    resolver: zodResolver(hoursSchema),
    defaultValues: {
      monday: { open: "09:00", close: "18:00", closed: false },
      tuesday: { open: "09:00", close: "18:00", closed: false },
      wednesday: { open: "09:00", close: "18:00", closed: false },
      thursday: { open: "09:00", close: "18:00", closed: false },
      friday: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "09:00", close: "17:00", closed: false },
      sunday: { open: "10:00", close: "16:00", closed: true },
    },
  });

  const policiesForm = useForm<PoliciesFormData>({
    resolver: zodResolver(policiesSchema),
    defaultValues: {
      cancellationHours: 24,
      depositRequired: false,
      depositPercentage: 20,
      noShowPolicy: "En cas de non-présentation sans préavis, des frais peuvent s'appliquer.",
    },
  });

  const brandingForm = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logo: "",
      primaryColor: "#bbb3f4",
      secondaryColor: "#a8efff",
    },
  });

  const socialsForm = useForm<SocialsFormData>({
    resolver: zodResolver(socialsSchema),
    defaultValues: {
      instagram: "",
      facebook: "",
      website: "",
    },
  });

  // Update forms when salon data is loaded
  useEffect(() => {
    if (salon) {
      salonForm.reset({
        name: salon.name || "",
        address: salon.address || "",
        phone: salon.phone || "",
        email: salon.email || "",
      });

      if (salon.hours) {
        hoursForm.reset(salon.hours as HoursFormData);
      }

      if (salon.policies) {
        policiesForm.reset(salon.policies as PoliciesFormData);
      }

      if (salon.branding) {
        brandingForm.reset(salon.branding as BrandingFormData);
      }

      if (salon.socials) {
        socialsForm.reset(salon.socials as SocialsFormData);
      }
    }
  }, [salon, salonForm, hoursForm, policiesForm, brandingForm, socialsForm]);

  // Mutations
  const updateSalonMutation = useMutation({
    mutationFn: async (data: any) => {
      if (salon?.id) {
        return await apiRequest("PATCH", `/api/salon/${salon.id}`, data);
      } else {
        return await apiRequest("POST", "/api/salon", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/salon"]);
      toast({
        title: "Paramètres enregistrés",
        description: "Vos paramètres ont été mis à jour avec succès.",
      });
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
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    },
  });

  const handleSalonSubmit = (data: SalonFormData) => {
    updateSalonMutation.mutate(data);
  };

  const handleHoursSubmit = (data: HoursFormData) => {
    updateSalonMutation.mutate({ hours: data });
  };

  const handlePoliciesSubmit = (data: PoliciesFormData) => {
    updateSalonMutation.mutate({ policies: data });
  };

  const handleBrandingSubmit = (data: BrandingFormData) => {
    updateSalonMutation.mutate({ branding: data });
  };

  const handleSocialsSubmit = (data: SocialsFormData) => {
    updateSalonMutation.mutate({ socials: data });
  };

  const days = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' },
  ];

  if (authLoading || salonLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
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
                <SettingsIcon className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Paramètres</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/api/logout" className="text-sm hover:text-primary">Déconnexion</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Paramètres du Salon</h1>
          <p className="text-muted-foreground">
            Configurez votre salon et personnalisez votre expérience
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Store className="w-4 h-4" />
              <span>Général</span>
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Horaires</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Politiques</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Branding</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Intégrations</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <MetricCard className="p-6">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center">
                  <Store className="w-5 h-5 mr-2" />
                  Informations du salon
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Form {...salonForm}>
                  <form onSubmit={salonForm.handleSubmit(handleSalonSubmit)} className="space-y-4">
                    <FormField
                      control={salonForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du salon*</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-salon-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={salonForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="input-salon-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={salonForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-salon-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={salonForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} data-testid="input-salon-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <GlassButton 
                        type="submit" 
                        disabled={updateSalonMutation.isPending}
                        data-testid="button-save-general"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </GlassButton>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </MetricCard>
          </TabsContent>

          {/* Hours Settings */}
          <TabsContent value="hours">
            <MetricCard className="p-6">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Horaires d'ouverture
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Form {...hoursForm}>
                  <form onSubmit={hoursForm.handleSubmit(handleHoursSubmit)} className="space-y-4">
                    {days.map((day) => (
                      <div key={day.key} className="grid grid-cols-4 gap-4 items-center">
                        <div className="font-medium">{day.label}</div>
                        
                        <FormField
                          control={hoursForm.control}
                          name={`${day.key}.open` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="time" 
                                  {...field}
                                  disabled={hoursForm.watch(`${day.key}.closed` as any)}
                                  data-testid={`input-hours-${day.key}-open`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={hoursForm.control}
                          name={`${day.key}.close` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="time" 
                                  {...field}
                                  disabled={hoursForm.watch(`${day.key}.closed` as any)}
                                  data-testid={`input-hours-${day.key}-close`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={hoursForm.control}
                          name={`${day.key}.closed` as any}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch 
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid={`switch-hours-${day.key}-closed`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm">Fermé</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}

                    <div className="flex justify-end">
                      <GlassButton 
                        type="submit" 
                        disabled={updateSalonMutation.isPending}
                        data-testid="button-save-hours"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </GlassButton>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </MetricCard>
          </TabsContent>

          {/* Policies Settings */}
          <TabsContent value="policies">
            <MetricCard className="p-6">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Politiques de réservation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Form {...policiesForm}>
                  <form onSubmit={policiesForm.handleSubmit(handlePoliciesSubmit)} className="space-y-4">
                    <FormField
                      control={policiesForm.control}
                      name="cancellationHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Délai d'annulation (heures)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              data-testid="input-cancellation-hours"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={policiesForm.control}
                      name="depositRequired"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-deposit-required"
                            />
                          </FormControl>
                          <FormLabel>Acompte obligatoire</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={policiesForm.control}
                      name="depositPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pourcentage d'acompte (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              {...field}
                              disabled={!policiesForm.watch('depositRequired')}
                              data-testid="input-deposit-percentage"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={policiesForm.control}
                      name="noShowPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Politique de no-show</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="input-noshow-policy" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <GlassButton 
                        type="submit" 
                        disabled={updateSalonMutation.isPending}
                        data-testid="button-save-policies"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </GlassButton>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </MetricCard>
          </TabsContent>

          {/* Branding Settings */}
          <TabsContent value="branding">
            <MetricCard className="p-6">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Identité visuelle
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Form {...brandingForm}>
                  <form onSubmit={brandingForm.handleSubmit(handleBrandingSubmit)} className="space-y-4">
                    <FormField
                      control={brandingForm.control}
                      name="logo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL du logo</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-logo-url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={brandingForm.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Couleur primaire</FormLabel>
                            <FormControl>
                              <Input 
                                type="color" 
                                {...field}
                                data-testid="input-primary-color"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={brandingForm.control}
                        name="secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Couleur secondaire</FormLabel>
                            <FormControl>
                              <Input 
                                type="color" 
                                {...field}
                                data-testid="input-secondary-color"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <GlassButton 
                        type="submit" 
                        disabled={updateSalonMutation.isPending}
                        data-testid="button-save-branding"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </GlassButton>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </MetricCard>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations">
            <div className="space-y-6">
              {/* Social Media */}
              <MetricCard className="p-6">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Réseaux sociaux
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Form {...socialsForm}>
                    <form onSubmit={socialsForm.handleSubmit(handleSocialsSubmit)} className="space-y-4">
                      <FormField
                        control={socialsForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site web</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://monsite.com" data-testid="input-website" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={socialsForm.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://instagram.com/monsalon" data-testid="input-instagram" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={socialsForm.control}
                        name="facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facebook</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://facebook.com/monsalon" data-testid="input-facebook" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <GlassButton 
                          type="submit" 
                          disabled={updateSalonMutation.isPending}
                          data-testid="button-save-socials"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Enregistrer
                        </GlassButton>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </MetricCard>

              {/* API Keys */}
              <MetricCard className="p-6">
                <CardHeader className="p-0 mb-6">
                  <CardTitle>Clés d'API</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-4">
                    <div className="bg-muted/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Stripe</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Configuré dans les variables d'environnement
                      </p>
                      <div className="text-xs text-green-600">✓ Configuré</div>
                    </div>

                    <div className="bg-muted/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">OpenAI</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Pour l'assistant IA vocal
                      </p>
                      <div className="text-xs text-green-600">✓ Configuré</div>
                    </div>

                    <div className="bg-muted/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Notifications</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        SMS et email automatiques
                      </p>
                      <div className="text-xs text-orange-600">⚠ En développement</div>
                    </div>
                  </div>
                </CardContent>
              </MetricCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
