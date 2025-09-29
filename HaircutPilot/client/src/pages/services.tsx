import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { GlassButton } from "@/components/ui/glass-button";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Plus, 
  Scissors, 
  Edit, 
  Trash2, 
  Clock, 
  Euro, 
  Tag,
  ArrowLeft,
  Save
} from "lucide-react";

const serviceSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().min(1, "La durée doit être d'au moins 1 minute"),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  tags: z.string().optional(),
  requiresDeposit: z.boolean().default(false),
  bufferBefore: z.coerce.number().min(0).default(0),
  bufferAfter: z.coerce.number().min(0).default(0),
  processingTime: z.coerce.number().min(0).default(0),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function Services() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      durationMinutes: 60,
      price: 0,
      tags: "",
      requiresDeposit: false,
      bufferBefore: 0,
      bufferAfter: 0,
      processingTime: 0,
    },
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["/api/services"],
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

  const createMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
      };
      return await apiRequest("POST", "/api/services", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/services"]);
      toast({
        title: "Service créé",
        description: "Le service a été créé avec succès.",
      });
      setIsDialogOpen(false);
      form.reset();
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
        description: "Impossible de créer le service.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ServiceFormData & { id: string }) => {
      const { id, ...payload } = data;
      const formattedPayload = {
        ...payload,
        tags: payload.tags ? payload.tags.split(',').map(tag => tag.trim()) : [],
      };
      return await apiRequest("PATCH", `/api/services/${id}`, formattedPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/services"]);
      toast({
        title: "Service modifié",
        description: "Le service a été modifié avec succès.",
      });
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
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
        description: "Impossible de modifier le service.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/services"]);
      toast({
        title: "Service supprimé",
        description: "Le service a été supprimé avec succès.",
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
        description: "Impossible de supprimer le service.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateMutation.mutate({ ...data, id: editingService.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description || "",
      durationMinutes: service.durationMinutes,
      price: Number(service.price),
      tags: service.tags?.join(', ') || "",
      requiresDeposit: service.requiresDeposit,
      bufferBefore: service.bufferBefore || 0,
      bufferAfter: service.bufferAfter || 0,
      processingTime: service.processingTime || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) {
      deleteMutation.mutate(id);
    }
  };

  const openCreateDialog = () => {
    setEditingService(null);
    form.reset();
    setIsDialogOpen(true);
  };

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
                <Scissors className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Services</span>
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
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Gestion des Services</h1>
            <p className="text-muted-foreground">
              Gérez les services proposés par votre salon
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <GlassButton onClick={openCreateDialog} data-testid="button-create-service">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Service
              </GlassButton>
            </DialogTrigger>
            <DialogContent className="glass max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? "Modifier le service" : "Créer un nouveau service"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du service*</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-service-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="durationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée (minutes)*</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-service-duration" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix (€)*</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} data-testid="input-service-price" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags (séparés par des virgules)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Coupe, Couleur, Brushing" data-testid="input-service-tags" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="input-service-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="bufferBefore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buffer avant (min)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-service-buffer-before" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bufferAfter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buffer après (min)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-service-buffer-after" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="processingTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temps de pose (min)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-service-processing-time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="requiresDeposit"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-service-deposit"
                          />
                        </FormControl>
                        <FormLabel>Acompte requis</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Annuler
                    </Button>
                    <GlassButton 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-service"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingService ? "Modifier" : "Créer"}
                    </GlassButton>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Services Grid */}
        {services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.filter(service => service.isActive).map((service) => (
              <MetricCard key={service.id} className="p-6" data-testid={`service-card-${service.id}`}>
                <CardHeader className="p-0 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold mb-1">
                        {service.name}
                      </CardTitle>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(service)}
                        data-testid={`button-edit-service-${service.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(service.id)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-service-${service.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{service.durationMinutes} min</span>
                      </div>
                      <div className="flex items-center text-lg font-semibold">
                        <Euro className="w-4 h-4 mr-1" />
                        <span>{Number(service.price).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {service.tags && service.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {service.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      {service.requiresDeposit && (
                        <span className="text-amber-600">Acompte requis</span>
                      )}
                      {(service.bufferBefore > 0 || service.bufferAfter > 0) && (
                        <span>
                          Buffer: {service.bufferBefore}min / {service.bufferAfter}min
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </MetricCard>
            ))}
          </div>
        ) : (
          <MetricCard className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Scissors className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucun service configuré</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre premier service pour permettre aux clients de prendre rendez-vous.
            </p>
            <GlassButton onClick={openCreateDialog} data-testid="button-create-first-service">
              <Plus className="w-4 h-4 mr-2" />
              Créer mon premier service
            </GlassButton>
          </MetricCard>
        )}
      </div>
    </div>
  );
}
