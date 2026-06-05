import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Phone, Building2, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ContactProfile() {
  const [, params] = useRoute("/contacts/:id");
  const [, setLocation] = useLocation();
  const contactId = params?.id ? parseInt(params.id) : null;
  const [noteContent, setNoteContent] = useState("");

  // Fetch contact details
  const { data: contact, isLoading: contactLoading } = trpc.contacts.get.useQuery(
    { id: contactId! },
    { enabled: !!contactId }
  );

  // Fetch activity logs
  const { data: activities, isLoading: activitiesLoading } = trpc.activityLogs.byContact.useQuery(
    { contactId: contactId! },
    { enabled: !!contactId }
  );

  // Fetch notes
  const { data: notes, isLoading: notesLoading } = trpc.notes.byContact.useQuery(
    { contactId: contactId! },
    { enabled: !!contactId }
  );

  // Create note mutation
  const { mutate: addNote } = trpc.notes.create.useMutation({
    onSuccess: () => {
      toast.success("Note added successfully");
      setNoteContent("");
    },
    onError: () => {
      toast.error("Failed to add note");
    },
  });

  const handleAddNote = () => {
    if (!noteContent.trim() || !contactId) return;
    addNote({
      contactId,
      content: noteContent,
    });
  };

  if (!contactId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Contact not found</p>
      </div>
    );
  }

  if (contactLoading) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <Button variant="outline" onClick={() => setLocation("/contacts")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contacts
        </Button>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Contact not found</p>
        </div>
      </div>
    );
  }

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
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => setLocation("/contacts")}
        className="w-fit"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Contacts
      </Button>

      {/* Contact Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {contact.firstName} {contact.lastName}
          </h1>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(contact.status)}>
              {contact.status}
            </Badge>
            {contact.tags && (
              <div className="flex gap-1">
                {contact.tags.split(",").map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contact.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-foreground hover:text-primary break-all"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-foreground hover:text-primary"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>
            )}
            {contact.company && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="text-foreground">{contact.company}</p>
                </div>
              </div>
            )}
            {contact.jobTitle && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Job Title</p>
                  <p className="text-foreground">{contact.jobTitle}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 pt-2 border-t border-border">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Added</p>
                <p className="text-foreground text-sm">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Add a note about this contact..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[120px]"
            />
            <Button
              onClick={handleAddNote}
              disabled={!noteContent.trim()}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Add Note
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Notes Timeline */}
      {!notesLoading && notes && notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes ({notes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="pb-4 border-b border-border last:border-0">
                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                  <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      {!activitiesLoading && activities && activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-4 pb-4 border-b border-border last:border-0">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm capitalize">
                      {activity.type.replace(/_/g, " ")}
                    </p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
