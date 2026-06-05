import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const dealFormSchema = z.object({
  contactId: z.number().min(1, "Contact is required"),
  title: z.string().min(1, "Deal title is required"),
  description: z.string().optional().or(z.literal("")),
  value: z.string().optional().or(z.literal("")),
  stageId: z.number().min(1, "Stage is required"),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional().or(z.literal("")),
});

type DealFormData = z.infer<typeof dealFormSchema>;

interface DealFormProps {
  initialData?: DealFormData & { id?: number };
  onSuccess?: () => void;
}

export default function DealForm({ initialData, onSuccess }: DealFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch contacts for dropdown
  const { data: contacts, isLoading: contactsLoading } = trpc.contacts.list.useQuery({
    limit: 1000,
  });

  // Fetch stages for dropdown
  const { data: stages, isLoading: stagesLoading } = trpc.pipelineStages.list.useQuery();

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: initialData || {
      contactId: 0,
      title: "",
      description: "",
      value: "",
      stageId: 0,
      probability: 50,
      expectedCloseDate: "",
    },
  });

  const { mutate: createDeal } = trpc.deals.create.useMutation({
    onSuccess: () => {
      toast.success("Deal created successfully");
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create deal");
    },
  });

  const { mutate: updateDeal } = trpc.deals.update.useMutation({
    onSuccess: () => {
      toast.success("Deal updated successfully");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update deal");
    },
  });

  const onSubmit = async (data: DealFormData) => {
    setIsSubmitting(true);
    try {
      const dealData = {
        ...data,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
      };
      if (initialData?.id) {
        updateDeal({
          id: initialData.id,
          ...dealData,
        });
      } else {
        createDeal(dealData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (contactsLoading || stagesLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData?.id ? "Edit Deal" : "Create New Deal"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Contact & Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a contact" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contacts?.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id.toString()}>
                            {contact.firstName} {contact.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Enterprise License Deal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details about this deal..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Value & Stage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Amount in USD</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages?.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id.toString()}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Probability & Close Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probability of Close</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Percentage (0-100)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedCloseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Close Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Clear
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                {isSubmitting ? "Saving..." : initialData?.id ? "Update Deal" : "Create Deal"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
