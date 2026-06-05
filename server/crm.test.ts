import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];

  const user: AuthenticatedUser = {
    id: userId,
    openId: `sample-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Sample User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("CRM Portal - Contact Management", () => {
  it("should create a new contact", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const contactData = {
      firstName: `John_${Date.now()}_${Math.random()}`,
      lastName: "Doe",
      email: `john${Date.now()}${Math.random()}@example.com`,
      phone: "+1234567890",
      company: "Acme Inc",
      jobTitle: "Sales Manager",
      status: "lead" as const,
      tags: "high-priority",
    };

    const result = await caller.contacts.create(contactData);

    expect(result).toBeDefined();
    expect(result?.firstName).toContain("John_");
    expect(result?.lastName).toBe("Doe");
    expect(result?.status).toBe("lead");
  });

  it("should list contacts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contacts.list({ limit: 10, offset: 0 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should update a contact", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.contacts.create({
      firstName: `Jane_${Date.now()}_${Math.random()}`,
      lastName: "Smith",
      email: `jane${Date.now()}${Math.random()}@example.com`,
      status: "prospect" as const,
    });

    const updated = await caller.contacts.update({
      id: created?.id,
      firstName: `Janet_${Date.now()}`,
      status: "customer" as const,
    });

    expect(updated?.status).toBe("customer");
  });

  it("should delete a contact", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.contacts.create({
      firstName: `Test_${Date.now()}_${Math.random()}`,
      lastName: "Contact",
      email: `test${Date.now()}${Math.random()}@example.com`,
      status: "lead" as const,
    });

    const result = await caller.contacts.delete({ id: created?.id });

    expect(result?.success).toBe(true);
  });
});

describe("CRM Portal - Deal Management", () => {
  it("should create a new deal", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const contact = await caller.contacts.create({
      firstName: `Deal_${Date.now()}_${Math.random()}`,
      lastName: "Contact",
      email: `deal${Date.now()}${Math.random()}@example.com`,
      status: "lead" as const,
    });

    const stage = await caller.pipelineStages.create({
      label: `Negotiation_${Date.now()}_${Math.random()}`,
      order: 2,
      color: "#ff6b6b",
    });

    const result = await caller.deals.create({
      contactId: contact?.id,
      title: "Enterprise License Deal",
      value: "50000",
      stageId: stage?.id,
      probability: 75,
    });

    expect(result).toBeDefined();
    expect(result?.title).toBe("Enterprise License Deal");
    expect(result?.probability).toBe(75);
  });

  it("should list deals", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.deals.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should update a deal stage", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const contact = await caller.contacts.create({
      firstName: `Update_${Date.now()}_${Math.random()}`,
      lastName: "Deal",
      email: `update${Date.now()}${Math.random()}@example.com`,
      status: "lead" as const,
    });

    const stage1 = await caller.pipelineStages.create({
      label: `Initial_${Date.now()}_${Math.random()}`,
      order: 0,
      color: "#3b82f6",
    });

    const stage2 = await caller.pipelineStages.create({
      label: `Advanced_${Date.now()}_${Math.random()}`,
      order: 1,
      color: "#8b5cf6",
    });

    const deal = await caller.deals.create({
      contactId: contact?.id,
      title: `TestDeal_${Date.now()}`,
      stageId: stage1?.id,
    });

    const updated = await caller.deals.update({
      id: deal?.id,
      stageId: stage2?.id,
    });

    expect(updated?.stageId).toBe(stage2?.id);
  });

  it("should delete a deal", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const contact = await caller.contacts.create({
      firstName: `Delete_${Date.now()}_${Math.random()}`,
      lastName: "Deal",
      email: `delete${Date.now()}${Math.random()}@example.com`,
      status: "lead" as const,
    });

    const stage = await caller.pipelineStages.create({
      label: `DeleteTest_${Date.now()}_${Math.random()}`,
      order: 0,
      color: "#ff0000",
    });

    const deal = await caller.deals.create({
      contactId: contact?.id,
      title: `DealToDelete_${Date.now()}`,
      stageId: stage?.id,
    });

    const result = await caller.deals.delete({ id: deal?.id });

    expect(result?.success).toBe(true);
  });
});

describe("CRM Portal - Pipeline Stages", () => {
  it("should create pipeline stages", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stage = await caller.pipelineStages.create({
      label: `Stage_${Date.now()}_${Math.random()}`,
      order: 1,
      color: "#10b981",
    });

    expect(stage).toBeDefined();
    expect(stage?.color).toBe("#10b981");
  });

  it("should list pipeline stages", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pipelineStages.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("CRM Portal - Notes", () => {
  it("should create a note for a contact", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const contact = await caller.contacts.create({
      firstName: `Note_${Date.now()}_${Math.random()}`,
      lastName: "Test",
      email: `note${Date.now()}${Math.random()}@example.com`,
      status: "lead" as const,
    });

    const note = await caller.notes.create({
      contactId: contact?.id,
      content: "This is an important note",
    });

    expect(note).toBeDefined();
    expect(note?.content).toBe("This is an important note");
  });

  it("should retrieve notes by contact", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const contact = await caller.contacts.create({
      firstName: `Notes_${Date.now()}_${Math.random()}`,
      lastName: "Retrieval",
      email: `notes${Date.now()}${Math.random()}@example.com`,
      status: "lead" as const,
    });

    await caller.notes.create({
      contactId: contact?.id,
      content: "First note",
    });

    const result = await caller.notes.byContact({ contactId: contact?.id });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("CRM Portal - Activity Logs", () => {
  it("should retrieve activity logs by contact", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const contact = await caller.contacts.create({
      firstName: `Activity_${Date.now()}_${Math.random()}`,
      lastName: "Test",
      email: `activity${Date.now()}${Math.random()}@example.com`,
      status: "lead" as const,
    });

    const result = await caller.activityLogs.byContact({ contactId: contact?.id });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("CRM Portal - Authentication", () => {
  it("should logout and clear session cookie", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result?.success).toBe(true);
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });

  it("should retrieve current user info", async () => {
    const { ctx } = createAuthContext(42);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.id).toBe(42);
  });
});
