import { and, eq, desc, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, contacts, deals, pipelineStages, notes, activityLogs, InsertContact, InsertDeal, InsertPipelineStage, InsertNote, InsertActivityLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== CONTACTS QUERIES =====
export async function getContactsByUserId(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).where(eq(contacts.userId, userId)).limit(limit).offset(offset);
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchContacts(userId: number, query: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).where(
    and(
      eq(contacts.userId, userId),
      ilike(contacts.firstName, `%${query}%`)
    )
  ).limit(20);
}

export async function createContact(contact: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(contacts).values(contact);
  // Get the last inserted contact
  const result = await db.select().from(contacts).where(eq(contacts.userId, contact.userId)).orderBy(desc(contacts.createdAt)).limit(1);
  return result[0];
}

export async function updateContact(id: number, updates: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contacts).set(updates).where(eq(contacts.id, id));
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result[0];
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contacts).where(eq(contacts.id, id));
  return { success: true };
}

// ===== DEALS QUERIES =====
export async function getDealsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deals).where(eq(deals.userId, userId));
}

export async function getDealsByStage(userId: number, stageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deals).where(
    and(
      eq(deals.userId, userId),
      eq(deals.stageId, stageId)
    )
  );
}

export async function getDealById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDeal(deal: InsertDeal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(deals).values(deal);
  const result = await db.select().from(deals).where(eq(deals.userId, deal.userId)).orderBy(desc(deals.createdAt)).limit(1);
  return result[0];
}

export async function updateDeal(id: number, updates: Partial<InsertDeal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deals).set(updates).where(eq(deals.id, id));
  const result = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
  return result[0];
}

export async function deleteDeal(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(deals).where(eq(deals.id, id));
  return { success: true };
}

// ===== PIPELINE STAGES QUERIES =====
export async function getPipelineStagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pipelineStages).where(eq(pipelineStages.userId, userId)).orderBy(pipelineStages.order);
}

export async function createPipelineStage(stage: InsertPipelineStage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertResult = await db.insert(pipelineStages).values(stage);
  // Get the inserted stage by ID
  const result = await db.select().from(pipelineStages).where(eq(pipelineStages.userId, stage.userId)).orderBy(desc(pipelineStages.id)).limit(1);
  return result[0];
}

export async function updatePipelineStage(id: number, updates: Partial<InsertPipelineStage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pipelineStages).set(updates).where(eq(pipelineStages.id, id));
  const result = await db.select().from(pipelineStages).where(eq(pipelineStages.id, id)).limit(1);
  return result[0];
}

export async function deletePipelineStage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pipelineStages).where(eq(pipelineStages.id, id));
  return { success: true };
}

// ===== NOTES QUERIES =====
export async function getNotesByContactId(contactId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notes).where(eq(notes.contactId, contactId)).orderBy(desc(notes.createdAt));
}

export async function getNotesByDealId(dealId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notes).where(eq(notes.dealId, dealId)).orderBy(desc(notes.createdAt));
}

export async function createNote(note: InsertNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notes).values(note);
  const result = await db.select().from(notes).orderBy(desc(notes.createdAt)).limit(1);
  return result[0];
}

export async function updateNote(id: number, updates: Partial<InsertNote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notes).set(updates).where(eq(notes.id, id));
  const result = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
  return result[0];
}

export async function deleteNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notes).where(eq(notes.id, id));
  return { success: true };
}

// ===== ACTIVITY LOG QUERIES =====
export async function getActivityLogsByContactId(contactId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).where(eq(activityLogs.contactId, contactId)).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

export async function getActivityLogsByDealId(dealId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).where(eq(activityLogs.dealId, dealId)).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

export async function createActivityLog(log: InsertActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(activityLogs).values(log);
  const result = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(1);
  return result[0];
}
