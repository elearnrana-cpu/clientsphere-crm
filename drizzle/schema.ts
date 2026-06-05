import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Contacts table: stores customer/prospect information
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("jobTitle", { length: 255 }),
  status: mysqlEnum("status", ["lead", "prospect", "customer", "inactive"]).default("lead").notNull(),
  tags: text("tags"), // JSON array stored as string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Pipeline stages table: stores custom pipeline stage definitions
 */
export const pipelineStages = mysqlTable("pipelineStages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  order: int("order").notNull(),
  color: varchar("color", { length: 20 }).default("#3b82f6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PipelineStage = typeof pipelineStages.$inferSelect;
export type InsertPipelineStage = typeof pipelineStages.$inferInsert;

/**
 * Deals table: stores sales opportunities/deals
 */
export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  value: decimal("value", { precision: 12, scale: 2 }),
  stageId: int("stageId").notNull(),
  probability: int("probability").default(0), // 0-100 percentage
  expectedCloseDate: timestamp("expectedCloseDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

/**
 * Notes table: stores contact and deal notes
 */
export const notes = mysqlTable("notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId"),
  dealId: int("dealId"),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

/**
 * Activity logs table: tracks all CRM activities
 */
export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId"),
  dealId: int("dealId"),
  type: mysqlEnum("type", ["contact_created", "contact_updated", "contact_deleted", "deal_created", "deal_updated", "deal_moved", "deal_deleted", "note_added", "note_updated"]).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// Relations
export const contactsRelations = relations(contacts, ({ many }) => ({
  deals: many(deals),
  notes: many(notes),
  activityLogs: many(activityLogs),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
  stage: one(pipelineStages, {
    fields: [deals.stageId],
    references: [pipelineStages.id],
  }),
  notes: many(notes),
  activityLogs: many(activityLogs),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  contact: one(contacts, {
    fields: [notes.contactId],
    references: [contacts.id],
  }),
  deal: one(deals, {
    fields: [notes.dealId],
    references: [deals.id],
  }),
}));