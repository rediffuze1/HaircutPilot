import {
  users,
  salons,
  services,
  stylists,
  clients,
  appointments,
  voiceCalls,
  reviews,
  type User,
  type UpsertUser,
  type Salon,
  type InsertSalon,
  type Service,
  type InsertService,
  type Stylist,
  type InsertStylist,
  type Client,
  type InsertClient,
  type Appointment,
  type InsertAppointment,
  type VoiceCall,
  type InsertVoiceCall,
  type Review,
  type InsertReview,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, count, sum, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User>;

  // Salon operations
  getUserSalon(userId: string): Promise<Salon | undefined>;
  createSalon(salon: InsertSalon): Promise<Salon>;
  updateSalon(id: string, salon: Partial<InsertSalon>): Promise<Salon>;

  // Service operations
  getSalonServices(salonId: string): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;

  // Stylist operations
  getSalonStylists(salonId: string): Promise<Stylist[]>;
  getStylist(id: string): Promise<Stylist | undefined>;
  createStylist(stylist: InsertStylist): Promise<Stylist>;
  updateStylist(id: string, stylist: Partial<InsertStylist>): Promise<Stylist>;
  deleteStylist(id: string): Promise<void>;

  // Client operations
  getSalonClients(salonId: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  getClientByPhone(salonId: string, phone: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;

  // Appointment operations
  getSalonAppointments(salonId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  cancelAppointment(id: string, reason: string): Promise<Appointment>;
  getAppointmentsByDateRange(salonId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;
  getAppointmentsByStatus(salonId: string, status: string): Promise<Appointment[]>;

  // Voice call operations
  createVoiceCall(voiceCall: InsertVoiceCall): Promise<VoiceCall>;
  getVoiceCall(id: string): Promise<VoiceCall | undefined>;
  updateVoiceCall(id: string, voiceCall: Partial<InsertVoiceCall>): Promise<VoiceCall>;

  // Review operations
  getSalonReviews(salonId: string, limit?: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Analytics operations
  getSalonMetrics(salonId: string, startDate: Date, endDate: Date): Promise<{
    totalAppointments: number;
    totalRevenue: number;
    noShows: number;
    completedAppointments: number;
    averageRating: number;
    topServices: Array<{ serviceName: string; count: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: stripeInfo.customerId,
        stripeSubscriptionId: stripeInfo.subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Salon operations
  async getUserSalon(userId: string): Promise<Salon | undefined> {
    const [salon] = await db.select().from(salons).where(eq(salons.ownerId, userId));
    return salon;
  }

  async createSalon(salon: InsertSalon): Promise<Salon> {
    const [newSalon] = await db.insert(salons).values(salon as any).returning();
    return newSalon;
  }

  async updateSalon(id: string, salon: Partial<InsertSalon>): Promise<Salon> {
    const [updatedSalon] = await db
      .update(salons)
      .set({ ...salon, updatedAt: new Date() } as any)
      .where(eq(salons.id, id))
      .returning();
    return updatedSalon;
  }

  // Service operations
  async getSalonServices(salonId: string): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.salonId, salonId));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set(service)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: string): Promise<void> {
    await db.update(services).set({ isActive: false }).where(eq(services.id, id));
  }

  // Stylist operations
  async getSalonStylists(salonId: string): Promise<Stylist[]> {
    return await db.select().from(stylists).where(eq(stylists.salonId, salonId));
  }

  async getStylist(id: string): Promise<Stylist | undefined> {
    const [stylist] = await db.select().from(stylists).where(eq(stylists.id, id));
    return stylist;
  }

  async createStylist(stylist: InsertStylist): Promise<Stylist> {
    const [newStylist] = await db.insert(stylists).values(stylist as any).returning();
    return newStylist;
  }

  async updateStylist(id: string, stylist: Partial<InsertStylist>): Promise<Stylist> {
    const [updatedStylist] = await db
      .update(stylists)
      .set(stylist as any)
      .where(eq(stylists.id, id))
      .returning();
    return updatedStylist;
  }

  async deleteStylist(id: string): Promise<void> {
    await db.update(stylists).set({ isActive: false }).where(eq(stylists.id, id));
  }

  // Client operations
  async getSalonClients(salonId: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.salonId, salonId)).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientByPhone(salonId: string, phone: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.salonId, salonId), eq(clients.phone, phone)));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client as any).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set(client as any)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  // Appointment operations
  async getSalonAppointments(salonId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]> {
    let query = db.select().from(appointments).where(eq(appointments.salonId, salonId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          gte(appointments.startTime, startDate),
          lte(appointments.startTime, endDate)
        )
      ) as any;
    }
    
    return await query.orderBy(asc(appointments.startTime));
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment as any).returning();
    return newAppointment;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() } as any)
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async cancelAppointment(id: string, reason: string): Promise<Appointment> {
    const [cancelledAppointment] = await db
      .update(appointments)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();
    return cancelledAppointment;
  }

  async getAppointmentsByDateRange(salonId: string, startDate: Date, endDate: Date): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.salonId, salonId),
          gte(appointments.startTime, startDate),
          lte(appointments.startTime, endDate)
        )
      )
      .orderBy(asc(appointments.startTime));
  }

  async getAppointmentsByStatus(salonId: string, status: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.salonId, salonId), eq(appointments.status, status)))
      .orderBy(desc(appointments.createdAt));
  }

  // Voice call operations
  async createVoiceCall(voiceCall: InsertVoiceCall): Promise<VoiceCall> {
    const [newVoiceCall] = await db.insert(voiceCalls).values(voiceCall as any).returning();
    return newVoiceCall;
  }

  async getVoiceCall(id: string): Promise<VoiceCall | undefined> {
    const [voiceCall] = await db.select().from(voiceCalls).where(eq(voiceCalls.id, id));
    return voiceCall;
  }

  async updateVoiceCall(id: string, voiceCall: Partial<InsertVoiceCall>): Promise<VoiceCall> {
    const [updatedVoiceCall] = await db
      .update(voiceCalls)
      .set(voiceCall as any)
      .where(eq(voiceCalls.id, id))
      .returning();
    return updatedVoiceCall;
  }

  // Review operations
  async getSalonReviews(salonId: string, limit: number = 10): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.salonId, salonId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review as any).returning();
    return newReview;
  }

  // Analytics operations
  async getSalonMetrics(salonId: string, startDate: Date, endDate: Date): Promise<{
    totalAppointments: number;
    totalRevenue: number;
    noShows: number;
    completedAppointments: number;
    averageRating: number;
    topServices: Array<{ serviceName: string; count: number }>;
  }> {
    const appointmentsInRange = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.salonId, salonId),
          gte(appointments.startTime, startDate),
          lte(appointments.startTime, endDate)
        )
      );

    const totalAppointments = appointmentsInRange.length;
    const noShows = appointmentsInRange.filter(apt => apt.status === 'no_show').length;
    const completedAppointments = appointmentsInRange.filter(apt => apt.status === 'completed').length;
    
    const totalRevenue = appointmentsInRange
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + Number(apt.totalAmount), 0);

    // Get average rating
    const salonReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.salonId, salonId));
    
    const averageRating = salonReviews.length > 0 
      ? salonReviews.reduce((sum, review) => sum + review.rating, 0) / salonReviews.length
      : 0;

    // Get services for name mapping
    const salonServices = await db.select().from(services).where(eq(services.salonId, salonId));
    const serviceMap = new Map(salonServices.map(s => [s.id, s.name]));

    // Calculate top services
    const serviceCount = new Map<string, number>();
    appointmentsInRange.forEach(apt => {
      apt.serviceIds.forEach(serviceId => {
        const serviceName = serviceMap.get(serviceId) || 'Unknown Service';
        serviceCount.set(serviceName, (serviceCount.get(serviceName) || 0) + 1);
      });
    });

    const topServices = Array.from(serviceCount.entries())
      .map(([serviceName, count]) => ({ serviceName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAppointments,
      totalRevenue,
      noShows,
      completedAppointments,
      averageRating,
      topServices,
    };
  }
}

export const storage = new DatabaseStorage();
