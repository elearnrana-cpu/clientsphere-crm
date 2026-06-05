import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, GripVertical, DollarSign, Calendar, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DealForm from "@/components/DealForm";
import { toast } from "sonner";

export default function PipelineBoard() {
  const { user } = useAuth();
  const [stages, setStages] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [draggedDeal, setDraggedDeal] = useState<any>(null);
  const [showCreateDealForm, setShowCreateDealForm] = useState(false);

  // Fetch pipeline stages
  const { data: stagesData, isLoading: stagesLoading } = trpc.pipelineStages.list.useQuery();
  
  // Fetch deals
  const { data: dealsData, isLoading: dealsLoading } = trpc.deals.list.useQuery();
  
  // Update deal stage mutation
  const { mutate: updateDeal } = trpc.deals.update.useMutation({
    onSuccess: () => {
      toast.success("Deal moved successfully");
    },
    onError: () => {
      toast.error("Failed to move deal");
    },
  });

  // Delete deal mutation
  const { mutate: deleteDeal } = trpc.deals.delete.useMutation({
    onSuccess: () => {
      toast.success("Deal deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete deal");
    },
  });

  // Initialize default stages if none exist
  const { mutate: createStage } = trpc.pipelineStages.create.useMutation();

  useEffect(() => {
    if (stagesData) {
      setStages(stagesData);
      // If no stages exist, create default ones
      if (stagesData.length === 0) {
        const defaultStages = [
          { label: "Lead", order: 0, color: "#3b82f6" },
          { label: "Qualified", order: 1, color: "#8b5cf6" },
          { label: "Proposal", order: 2, color: "#ec4899" },
          { label: "Closed", order: 3, color: "#10b981" },
        ];
        defaultStages.forEach((stage) => createStage(stage));
      }
    }
  }, [stagesData]);

  useEffect(() => {
    if (dealsData) {
      setDeals(dealsData);
    }
  }, [dealsData]);

  const getDealsByStage = (stageId: number) => {
    return deals.filter((deal) => deal.stageId === stageId);
  };

  const handleDragStart = (deal: any) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageId: number) => {
    if (draggedDeal && draggedDeal.stageId !== stageId) {
      updateDeal({
        id: draggedDeal.id,
        stageId,
      });
      setDraggedDeal(null);
    }
  };

  const isLoading = stagesLoading || dealsLoading;

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Sales Pipeline</h1>
          <p className="text-muted-foreground">
            Drag and drop deals across stages to manage your pipeline
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDealForm(true)}
          className="gap-2 bg-primary hover:bg-primary/90 w-fit"
        >
          <Plus className="h-4 w-4" />
          Add Deal
        </Button>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageDeal = getDealsByStage(stage.id);
            return (
              <div
                key={stage.id}
                className="flex flex-col gap-3 bg-muted/30 rounded-lg p-4 min-w-[300px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-semibold text-foreground">{stage.label}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stageDeal.length}
                  </Badge>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(stage.id)}
                  className="flex flex-col gap-2 min-h-[400px]"
                >
                  {stageDeal.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                      <p className="text-sm text-muted-foreground">
                        No deals in this stage
                      </p>
                    </div>
                  ) : (
                    stageDeal.map((deal) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={() => handleDragStart(deal)}
                        className="bg-card border border-border rounded-lg p-3 cursor-move hover:shadow-md transition-shadow group"
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">
                              {deal.title}
                            </h4>
                            {deal.value && (
                              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                <span>${parseFloat(deal.value).toLocaleString()}</span>
                              </div>
                            )}
                            {deal.expectedCloseDate && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(deal.expectedCloseDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {deal.probability && (
                              <div className="mt-2 pt-2 border-t border-border">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Probability</span>
                                  <span className="font-medium text-foreground">
                                    {deal.probability}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this deal?")) {
                                deleteDeal({ id: deal.id });
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && stages.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">No pipeline stages configured</p>
              <p className="text-sm text-muted-foreground">
                Default stages will be created automatically
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Deal Dialog */}
      <Dialog open={showCreateDealForm} onOpenChange={setShowCreateDealForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
          </DialogHeader>
          <DealForm onSuccess={() => setShowCreateDealForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
