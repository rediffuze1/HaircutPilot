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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  ArrowLeft,
  Save,
  Star
} from "lucide-react";

const stylistSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  photoUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  specialties: z.string().optional(),
  isActive: z.boolean().default(true),
});

type StylistFormData = z.infer<typeof stylistSchema>;

export default function Stylists() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStylist, setEditingStylist] = useState<any>(null);

  const form = useForm<StylistFormData>({
    resolver: zodResolver(stylistSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      photoUrl: "",
      specialties: "",
      isActive: true,
    },
  });

  const { data: stylists, isLoading } = useQuery({
    queryKey: ["/api/stylists"],
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
    mutationFn: async (data: StylistFormData) => {
      const payload = {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        photoUrl: data.photoUrl || null,
        specialties: data.specialties ? data.specialties.split(',').map(s => s.trim()) : [],
      };
      return await apiRequest("POST", "/api/stylists", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/stylists"]);
      toast({
        title: "Styliste créé",
        description: "Le styliste a été créé avec succès.",
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
        description: "Impossible de créer le styliste.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: StylistFormData & { id: string }) => {
      const { id, ...payload } = data;
      const formattedPayload = {
        ...payload,
        email: payload.email || null,
        phone: payload.phone || null,
        photoUrl: payload.photoUrl || null,
        specialties: payload.specialties ? payload.specialties.split(',').map(s => s.trim()) : [],
      };
      return await apiRequest("PATCH", `/api/stylists/${id}`, formattedPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/stylists"]);
      toast({
        title: "Styliste modifié",
        description: "Le styliste a été modifié avec succès.",
      });
      setIsDialogOpen(false);
      setEditingStylist(null);
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
        description: "Impossible de modifier le styliste.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/stylists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/stylists"]);
      toast({
        title: "Styliste supprimé",
        description: "Le styliste a été supprimé avec succès.",
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
        description: "Impossible de supprimer le styliste.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StylistFormData) => {
    if (editingStylist) {
      updateMutation.mutate({ ...data, id: editingStylist.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (stylist: any) => {
    setEditingStylist(stylist);
    form.reset({
      firstName: stylist.firstName,
      lastName: stylist.lastName,
      email: stylist.email || "",
      phone: stylist.phone || "",
      photoUrl: stylist.photoUrl || "",
      specialties: stylist.specialties?.join(', ') || "",
      isActive: stylist.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce styliste ?")) {
      deleteMutation.mutate(id);
    }
  };

  const openCreateDialog = () => {
    setEditingStylist(null);
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
                <Users className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Stylistes</span>
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
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Gestion des Stylistes</h1>
            <p className="text-muted-foreground">
              Gérez votre équipe de stylistes et leurs spécialités
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <GlassButton onClick={openCreateDialog} data-testid="button-create-stylist">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Styliste
              </GlassButton>
            </DialogTrigger>
            <DialogContent className="glass max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingStylist ? "Modifier le styliste" : "Ajouter un nouveau styliste"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom*</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-stylist-firstname" />
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
                            <Input {...field} data-testid="input-stylist-lastname" />
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
                            <Input type="email" {...field} data-testid="input-stylist-email" />
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
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-stylist-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de la photo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/photo.jpg" data-testid="input-stylist-photo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spécialités (séparées par des virgules)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Coupe, Couleur, Balayage" data-testid="input-stylist-specialties" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-stylist-active"
                          />
                        </FormControl>
                        <FormLabel>Styliste actif</FormLabel>
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
                      data-testid="button-save-stylist"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingStylist ? "Modifier" : "Créer"}
                    </GlassButton>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stylists Grid */}
        {stylists && stylists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stylists.filter(stylist => stylist.isActive).map((stylist) => (
              <MetricCard key={stylist.id} className="p-6" data-testid={`stylist-card-${stylist.id}`}>
                <CardHeader className="p-0 mb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={stylist.photoUrl} />
                        <AvatarFallback>
                          {stylist.firstName[0]}{stylist.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {stylist.firstName} {stylist.lastName}
                        </CardTitle>
                        <div className="flex items-center text-yellow-400 mt-1">
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-xs text-muted-foreground ml-1">5.0</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(stylist)}
                        data-testid={`button-edit-stylist-${stylist.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(stylist.id)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-stylist-${stylist.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-3">
                    {stylist.specialties && stylist.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {stylist.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      {stylist.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="w-4 h-4 mr-2" />
                          <span>{stylist.email}</span>
                        </div>
                      )}
                      {stylist.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{stylist.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">RDV cette semaine</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Prochaine dispo</span>
                        <span className="font-medium text-green-400">Demain 14h</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </MetricCard>
            ))}
          </div>
        ) : (
          <MetricCard className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucun styliste configuré</h3>
            <p className="text-muted-foreground mb-4">
              Ajoutez votre équipe de stylistes pour commencer à gérer les rendez-vous.
            </p>
            <GlassButton onClick={openCreateDialog} data-testid="button-create-first-stylist">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter mon premier styliste
            </GlassButton>
          </MetricCard>
        )}
      </div>
    </div>
  );
}
