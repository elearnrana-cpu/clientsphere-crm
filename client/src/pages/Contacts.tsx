import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Mail, Phone, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import ContactForm from "@/components/ContactForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Contacts() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch contacts
  const { data: contacts, isLoading } = trpc.contacts.list.useQuery({ limit, offset });
  const { mutate: deleteContact } = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete contact");
    },
  });

  const filteredContacts = contacts?.filter((contact) => {
    const matchesSearch =
      contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "lead":
        return "bg-blue-100 text-blue-800";
      case "prospect":
        return "bg-purple-100 text-purple-800";
      case "customer":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Contacts</h1>
          <p className="text-muted-foreground">
            Manage all your customer and prospect relationships
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="gap-2 bg-primary hover:bg-primary/90 w-fit"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Search by name or email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Filter by status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Contacts ({filteredContacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">No contacts found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id} className="hover:bg-muted/50">
                      <TableCell>
                        <button
                          onClick={() => setLocation(`/contacts/${contact.id}`)}
                          className="font-medium text-primary hover:underline"
                        >
                          {contact.firstName} {contact.lastName}
                        </button>
                      </TableCell>
                      <TableCell>
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                          >
                            <Mail className="h-4 w-4" />
                            {contact.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.phone ? (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                          >
                            <Phone className="h-4 w-4" />
                            {contact.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.company ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            {contact.company}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contact.status)}>
                          {contact.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/contacts/${contact.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this contact?")) {
                                deleteContact({ id: contact.id });
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Contact Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Contact</DialogTitle>
          </DialogHeader>
          <ContactForm onSuccess={() => setShowCreateForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
