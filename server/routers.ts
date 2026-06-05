import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  contacts: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(({ ctx, input }) => db.getContactsByUserId(ctx.user.id, input.limit, input.offset)),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getContactById(input.id)),
    
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(({ ctx, input }) => db.searchContacts(ctx.user.id, input.query)),
    
    create: protectedProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        status: z.enum(["lead", "prospect", "customer", "inactive"]).optional(),
        tags: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => db.createContact({ ...input, userId: ctx.user.id })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        status: z.enum(["lead", "prospect", "customer", "inactive"]).optional(),
        tags: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...updates } = input;
        return db.updateContact(id, updates);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteContact(input.id)),
  }),

  deals: router({
    list: protectedProcedure
      .query(({ ctx }) => db.getDealsByUserId(ctx.user.id)),
    
    byStage: protectedProcedure
      .input(z.object({ stageId: z.number() }))
      .query(({ ctx, input }) => db.getDealsByStage(ctx.user.id, input.stageId)),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getDealById(input.id)),
    
    create: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        value: z.string().optional(),
        stageId: z.number(),
        probability: z.number().min(0).max(100).optional(),
        expectedCloseDate: z.date().optional(),
      }))
      .mutation(({ ctx, input }) => db.createDeal({ ...input, userId: ctx.user.id })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        value: z.string().optional(),
        stageId: z.number().optional(),
        probability: z.number().min(0).max(100).optional(),
        expectedCloseDate: z.date().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...updates } = input;
        return db.updateDeal(id, updates);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteDeal(input.id)),
  }),

  pipelineStages: router({
    list: protectedProcedure
      .query(({ ctx }) => db.getPipelineStagesByUserId(ctx.user.id)),
    
    create: protectedProcedure
      .input(z.object({
        label: z.string().min(1),
        order: z.number(),
        color: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => db.createPipelineStage({ ...input, userId: ctx.user.id })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        label: z.string().min(1).optional(),
        order: z.number().optional(),
        color: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...updates } = input;
        return db.updatePipelineStage(id, updates);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deletePipelineStage(input.id)),
  }),

  notes: router({
    byContact: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .query(({ input }) => db.getNotesByContactId(input.contactId)),
    
    byDeal: protectedProcedure
      .input(z.object({ dealId: z.number() }))
      .query(({ input }) => db.getNotesByDealId(input.dealId)),
    
    create: protectedProcedure
      .input(z.object({
        contactId: z.number().optional(),
        dealId: z.number().optional(),
        content: z.string().min(1),
      }))
      .mutation(({ ctx, input }) => db.createNote({ ...input, userId: ctx.user.id })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().min(1).optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...updates } = input;
        return db.updateNote(id, updates);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteNote(input.id)),
  }),

  activityLogs: router({
    byContact: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .query(({ input }) => db.getActivityLogsByContactId(input.contactId)),
    
    byDeal: protectedProcedure
      .input(z.object({ dealId: z.number() }))
      .query(({ input }) => db.getActivityLogsByDealId(input.dealId)),
  }),
});

export type AppRouter = typeof appRouter;
