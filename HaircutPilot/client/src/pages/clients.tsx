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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Plus, 
  Users, 
  Edit, 
  Search,
  ArrowLeft,
  Save,
  Phone,
  Mail,
  Calendar,
  Euro,
  Star
} from "lucide-react";

const clientSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().min(1, "Le téléphone est requis"),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function Clients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  const { data: clients, isLoading } = useQuery({
    queryKey: ["/api/clients"],
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
    mutationFn: async (data: ClientFormData) => {
      const payload = {
        ...data,
        email: data.email || null,
      };
      return await apiRequest("POST", "/api/clients", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/clients"]);
      toast({
        title: "Client créé",
        description: "Le client a été créé avec succès.",
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
        description: "Impossible de créer le client.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ClientFormData & { id: string }) => {
      const { id, ...payload } = data;
      const formattedPayload = {
        ...payload,
        email: payload.email || null,
      };
      return await apiRequest("PATCH", `/api/clients/${id}`, formattedPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/clients"]);
      toast({
        title: "Client modifié",
        description: "Le client a été modifié avec succès.",
      });
      setIsDialogOpen(false);
      setEditingClient(null);
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
        description: "Impossible de modifier le client.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    if (editingClient) {
      updateMutation.mutate({ ...data, id: editingClient.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    form.reset({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email || "",
      phone: client.phone,
      notes: client.notes || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingClient(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const filteredClients = clients?.filter(client => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const phone = client.phone.toLowerCase();
    const email = (client.email || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || phone.includes(search) || email.includes(search);
  }) || [];

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
              <span className="text-xl font-bold">Clients</span>
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
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Gestion des Clients</h1>
            <p className="text-muted-foreground">
              Gérez votre base de clients et leur historique
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <GlassButton onClick={openCreateDialog} data-testid="button-create-client">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Client
              </GlassButton>
            </DialogTrigger>
            <DialogContent className="glass max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "Modifier le client" : "Ajouter un nouveau client"}
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
                            <Input {...field} data-testid="input-client-firstname" />
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
                            <Input {...field} data-testid="input-client-lastname" />
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
                            <Input type="email" {...field} data-testid="input-client-email" />
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
                            <Input {...field} data-testid="input-client-phone" />
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
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="input-client-notes" />
                        </FormControl>
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
                      data-testid="button-save-client"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingClient ? "Modifier" : "Créer"}
                    </GlassButton>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher par nom, téléphone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-clients"
            />
          </div>
        </div>

        {/* Clients Grid */}
        {filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <MetricCard key={client.id} className="p-6" data-testid={`client-card-${client.id}`}>
                <CardHeader className="p-0 mb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>
                          {client.firstName[0]}{client.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {client.firstName} {client.lastName}
                        </CardTitle>
                        <div className="flex items-center text-yellow-400 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">5.0</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(client)}
                      data-testid={`button-edit-client-${client.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="w-4 h-4 mr-2" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{client.phone}</span>
                      </div>
                    </div>
                    
                    {client.notes && (
                      <div className="text-sm text-muted-foreground">
                        <p className="line-clamp-2">{client.notes}</p>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-border">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Visites</span>
                          </div>
                          <span className="font-medium">{client.totalVisits || 0}</span>
                        </div>
                        <div>
                          <div className="flex items-center text-muted-foreground">
                            <Euro className="w-4 h-4 mr-1" />
                            <span>Total</span>
                          </div>
                          <span className="font-medium">{Number(client.totalSpent || 0).toFixed(0)} €</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        {client.lastVisit ? (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Dernière visite: </span>
                            <span className="font-medium">
                              {new Date(client.lastVisit).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Nouveau client
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </MetricCard>
            ))}
          </div>
        ) : clients?.length === 0 ? (
          <MetricCard className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucun client enregistré</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par ajouter vos premiers clients pour gérer leurs rendez-vous.
            </p>
            <GlassButton onClick={openCreateDialog} data-testid="button-create-first-client">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter mon premier client
            </GlassButton>
          </MetricCard>
        ) : (
          <MetricCard className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucun client trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Aucun client ne correspond à votre recherche "{searchTerm}".
            </p>
          </MetricCard>
        )}
      </div>
    </div>
  );
}
