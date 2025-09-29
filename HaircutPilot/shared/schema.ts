import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  salonName: varchar("salon_name"),
  role: varchar("role").default("salon_owner"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Salons table
export const salons = pgTable("salons", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  address: text("address"),
  phone: varchar("phone"),
  email: varchar("email"),
  hours: jsonb("hours").$type<Record<string, { open: string; close: string; closed?: boolean }>>(),
  socials: jsonb("socials").$type<{ instagram?: string; facebook?: string; website?: string }>(),
  policies: jsonb("policies").$type<{ 
    cancellationHours: number; 
    depositRequired: boolean; 
    depositPercentage: number;
    noShowPolicy: string;
  }>(),
  branding: jsonb("branding").$type<{ logo?: string; primaryColor?: string; secondaryColor?: string }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: uuid("salon_id").notNull().references(() => salons.id),
  name: varchar("name").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  tags: text("tags").array(),
  requiresDeposit: boolean("requires_deposit").default(false),
  bufferBefore: integer("buffer_before").default(0),
  bufferAfter: integer("buffer_after").default(0),
  processingTime: integer("processing_time").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stylists table
export const stylists = pgTable("stylists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: uuid("salon_id").notNull().references(() => salons.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  photoUrl: varchar("photo_url"),
  specialties: text("specialties").array(),
  schedule: jsonb("schedule").$type<Record<string, { start: string; end: string; breaks?: Array<{ start: string; end: string }> }>>(),
  vacations: jsonb("vacations").$type<Array<{ start: string; end: string; reason?: string }>>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: uuid("salon_id").notNull().references(() => salons.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone").notNull(),
  preferences: jsonb("preferences").$type<{ stylistId?: string; services?: string[]; notes?: string }>(),
  notes: text("notes"),
  totalVisits: integer("total_visits").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default('0'),
  lastVisit: timestamp("last_visit"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: uuid("salon_id").notNull().references(() => salons.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  stylistId: uuid("stylist_id").references(() => stylists.id),
  serviceIds: text("service_ids").array().notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, confirmed, completed, cancelled, no_show
  channel: varchar("channel").default("form"), // form, voice, phone, walk_in
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  paymentStatus: varchar("payment_status").default("pending"), // pending, paid, partial, refunded
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  notes: text("notes"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  remindersSent: jsonb("reminders_sent").$type<Array<{ type: string; sentAt: string }>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice calls/interactions table
export const voiceCalls = pgTable("voice_calls", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: uuid("salon_id").notNull().references(() => salons.id),
  clientTempId: varchar("client_temp_id"), // For non-registered clients
  clientId: uuid("client_id").references(() => clients.id),
  transcript: text("transcript"),
  intent: varchar("intent"), // book, reschedule, cancel, inquiry
  entities: jsonb("entities").$type<Record<string, any>>(),
  result: jsonb("result").$type<{ type: string; appointmentId?: string; message?: string }>(),
  duration: integer("duration"), // in seconds
  status: varchar("status").default("completed"), // in_progress, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: uuid("salon_id").notNull().references(() => salons.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  stylistId: uuid("stylist_id").references(() => stylists.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  isPublic: boolean("is_public").default(true),
  response: text("response"), // Salon response to review
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  salon: one(salons, {
    fields: [users.id],
    references: [salons.ownerId],
  }),
}));

export const salonsRelations = relations(salons, ({ one, many }) => ({
  owner: one(users, {
    fields: [salons.ownerId],
    references: [users.id],
  }),
  services: many(services),
  stylists: many(stylists),
  clients: many(clients),
  appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  salon: one(salons, {
    fields: [services.salonId],
    references: [salons.id],
  }),
}));

export const stylistsRelations = relations(stylists, ({ one, many }) => ({
  salon: one(salons, {
    fields: [stylists.salonId],
    references: [salons.id],
  }),
  appointments: many(appointments),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  salon: one(salons, {
    fields: [clients.salonId],
    references: [salons.id],
  }),
  appointments: many(appointments),
  reviews: many(reviews),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  salon: one(salons, {
    fields: [appointments.salonId],
    references: [salons.id],
  }),
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),
  stylist: one(stylists, {
    fields: [appointments.stylistId],
    references: [stylists.id],
  }),
}));

// Insert schemas
export const insertSalonSchema = createInsertSchema(salons).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true });
export const insertStylistSchema = createInsertSchema(stylists).omit({ id: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, totalVisits: true, totalSpent: true, lastVisit: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVoiceCallSchema = createInsertSchema(voiceCalls).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertSalon = z.infer<typeof insertSalonSchema>;
export type Salon = typeof salons.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
export type InsertStylist = z.infer<typeof insertStylistSchema>;
export type Stylist = typeof stylists.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertVoiceCall = z.infer<typeof insertVoiceCallSchema>;
export type VoiceCall = typeof voiceCalls.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
