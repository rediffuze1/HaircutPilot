import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertSalonSchema, 
  insertServiceSchema, 
  insertStylistSchema, 
  insertClientSchema, 
  insertAppointmentSchema,
  insertVoiceCallSchema,
  insertReviewSchema 
} from "@shared/schema";
import { processVoiceInput, analyzeBusinessData } from "./openai";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_demo", {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Salon routes
  app.get('/api/salon', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const salon = await storage.getUserSalon(userId);
      res.json(salon);
    } catch (error) {
      console.error("Error fetching salon:", error);
      res.status(500).json({ message: "Failed to fetch salon" });
    }
  });

  app.post('/api/salon', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const salonData = insertSalonSchema.parse({ ...req.body, ownerId: userId });
      const salon = await storage.createSalon(salonData);
      res.json(salon);
    } catch (error) {
      console.error("Error creating salon:", error);
      res.status(500).json({ message: "Failed to create salon" });
    }
  });

  app.patch('/api/salon/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const salon = await storage.updateSalon(id, updates);
      res.json(salon);
    } catch (error) {
      console.error("Error updating salon:", error);
      res.status(500).json({ message: "Failed to update salon" });
    }
  });

  // Service routes
  app.get('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const salon = await storage.getUserSalon(userId);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      const services = await storage.getSalonServices(salon.id);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const salon = await storage.getUserSalon(userId);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      const serviceData = insertServiceSchema.parse({ ...req.body, salonId: salon.id });
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.patch('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const service = await storage.updateService(id, updates);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteService(id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Stylist routes
  app.get('/api/stylists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const salon = await storage.getUserSalon(userId);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      const stylists = await storage.getSalonStylists(salon.id);
      res.json(stylists);
    } catch (error) {
      console.error("Error fetching stylists:", error);
      res.status(500).json({ message: "Failed to fetch stylists" });
    }
  });

  app.post('/api/stylists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const salon = await storage.getUserSalon(userId);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      const stylistData = insertStylistSchema.parse({ ...req.body, salonId: salon.id });
      const stylist = await storage.createStylist(stylistData);
      res.json(stylist);
    } catch (error) {
      console.error("Error creating stylist:", error);
      res.status(500).json({ message: "Failed to create stylist" });
    }
  });

  app.patch('/api/stylists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const stylist = await storage.updateStylist(id, updates);
      res.json(stylist);
    } catch (error) {
      console.error("Error updating stylist:", error);
      res.status(500).json({ message: "Failed to update stylist" });
    }
  });

  app.delete('/api/stylists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStylist(id);
      res.json({ message: "Stylist deleted successfully" });
    } catch (error) {
      console.error("Error deleting stylist:", error);
      res.status(500).json({ message: "Failed to delete stylist" });
    }
  });

  // Client routes
  app.get('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const salon = await storage.getUserSalon(userId);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      const clients = await storage.getSalonClients(salon.id);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const salon = await storage.getUserSalon(userId);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      const clientData = insertClientSchema.parse({ ...req.body, salonId: salon.id });
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  // Public booking routes (no auth required)
  app.get('/api/public/salon/:salonId/services', async (req, res) => {
    try {
      const { salonId } = req.params;
      const services = await storage.getSalonServices(salonId);
      res.json(services.filter(s => s.isActive));
    } catch (error) {
      console.error("Error fetching public services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get('/api/public/salon/:salonId/stylists', async (req, res) => {
    try {
      const { salonId } = req.params;
      const stylists = await storage.getSalonStylists(salonId);
      res.json(stylists.filter(s => s.isActive));
    } catch (error) {
      console.error("Error fetching public stylists:", error);
      res.status(500).json({ message: "Failed to fetch stylists" });
    }
  });

  // Appointment routes
  app.get('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const salon = await storage.getUserSalon(userId);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const appointments = await storage.getSalonAppointments(salon.id, start, end);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post('/api/appointments', async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(appointmentData);
      res.json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.patch('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const appointment = await storage.updateAppointment(id, updates);
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.post('/api/appointments/:id/cancel', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const appointment = await storage.cancelAppointment(id, reason || "Cancelled by client");
      res.json(appointment);
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      res.status(500).json({ message: "Failed to cancel appointment" });
    }
  });

  // Voice assistant routes
  app.post('/api/voice/process', async (req, res) => {
    try {
      const { transcript, salonId } = req.body;
      
      // Get salon context
      const services = await storage.getSalonServices(salonId);
      const stylists = await storage.getSalonStylists(salonId);
      
      // Mock available slots (in real app, this would calculate based on actual bookings)
      const availableSlots = [
        { start: "2025-01-15T14:00:00Z", end: "2025-01-15T15:00:00Z" },
        { start: "2025-01-15T15:30:00Z", end: "2025-01-15T16:30:00Z" },
        { start: "2025-01-16T10:00:00Z", end: "2025-01-16T11:00:00Z" },
      ];

      const result = await processVoiceInput(transcript, {
        services: services.map(s => ({ 
          id: s.id, 
          name: s.name, 
          duration: s.durationMinutes, 
          price: Number(s.price) 
        })),
        stylists: stylists.map(s => ({ 
          id: s.id, 
          name: `${s.firstName} ${s.lastName}`, 
          specialties: s.specialties || [] 
        })),
        availableSlots
      });

      // Save voice call record
      const voiceCall = await storage.createVoiceCall({
        salonId,
        transcript,
        intent: result.intent,
        entities: result.entities,
        result: { type: "response", message: result.response }
      });

      res.json({ ...result, callId: voiceCall.id });
    } catch (error) {
      console.error("Error processing voice input:", error);
      res.status(500).json({ message: "Failed to process voice input" });
    }
  });

  // AI Analytics routes
  app.post('/api/ai/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const salon = await storage.getUserSalon(userId);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }

      const { question } = req.body;
      
      // Get salon metrics for context
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const metrics = await storage.getSalonMetrics(salon.id, startDate, endDate);
      
      const context = {
        salon: salon.name,
        metrics,
        period: "30 derniers jours"
      };

      const analysis = await analyzeBusinessData({ question, context });
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing data:", error);
      res.status(500).json({ message: "Failed to analyze data" });
    }
  });

  // Metrics routes
  app.get('/api/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const salon = await storage.getUserSalon(userId);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }

      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const metrics = await storage.getSalonMetrics(salon.id, startDate, endDate);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, appointmentId } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "eur",
        metadata: {
          appointmentId: appointmentId || '',
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Webhook for Stripe events
  app.post('/api/webhooks/stripe', async (req, res) => {
    try {
      // Handle Stripe webhook events (payment success, etc.)
      const event = req.body;
      
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const appointmentId = paymentIntent.metadata.appointmentId;
        
        if (appointmentId) {
          await storage.updateAppointment(appointmentId, {
            paymentStatus: 'paid',
            stripePaymentIntentId: paymentIntent.id
          });
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Error handling webhook:", error);
      res.status(500).json({ message: "Webhook error" });
    }
  });

  // Reviews routes
  app.get('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const salon = await storage.getUserSalon(userId);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      const reviews = await storage.getSalonReviews(salon.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
