import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { BarChart3, Users, TrendingUp, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Fetch metrics data
  const { data: contacts, isLoading: contactsLoading } = trpc.contacts.list.useQuery({ limit: 1 });
  const { data: deals, isLoading: dealsLoading } = trpc.deals.list.useQuery();
  const { data: stages, isLoading: stagesLoading } = trpc.pipelineStages.list.useQuery();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const totalContacts = contacts?.length || 0;
  const openDeals = deals?.filter(d => d.stageId !== deals[deals.length - 1]?.stageId).length || 0;
  const pipelineValue = deals?.reduce((sum, deal) => {
    const value = deal.value ? parseFloat(deal.value.toString()) : 0;
    return sum + value;
  }, 0) || 0;

  const isLoading = contactsLoading || dealsLoading || stagesLoading;

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8">
      {/* Header with greeting */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {getGreeting()}, {user?.name?.split(" ")[0] || "there"}!
        </h1>
        <p className="text-muted-foreground">
          Welcome back to ClientSphere. Here's your CRM overview.
        </p>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Contacts Card */}
        <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Contacts
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{totalContacts}</span>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Manage all your customer relationships
            </p>
          </CardContent>
        </Card>

        {/* Open Deals Card */}
        <Card className="border-l-4 border-l-accent hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open Deals
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{openDeals}</span>
                <Badge variant="outline" className="text-xs">In Progress</Badge>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Opportunities in your pipeline
            </p>
          </CardContent>
        </Card>

        {/* Pipeline Value Card */}
        <Card className="border-l-4 border-l-secondary hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pipeline Value
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  ${(pipelineValue / 1000).toFixed(1)}K
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Total value of open opportunities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={() => setLocation("/contacts")}
              variant="outline"
              className="justify-start gap-2"
            >
              <Users className="h-4 w-4" />
              View All Contacts
            </Button>
            <Button
              onClick={() => setLocation("/pipeline")}
              variant="outline"
              className="justify-start gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              View Pipeline Board
            </Button>
            <Button
              onClick={() => setLocation("/contacts?action=new")}
              className="justify-start gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add New Contact
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Your latest CRM updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Welcome to ClientSphere!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Start by adding your first contact
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-accent mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Explore the pipeline board
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Organize your deals by stage
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
