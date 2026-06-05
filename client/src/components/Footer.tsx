import { useLocation } from "wouter";
import { LayoutDashboard, Users, BarChart3, Settings } from "lucide-react";
import { Button } from "./ui/button";

export default function Footer() {
  const [location, setLocation] = useLocation();

  const footerLinks = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Users, label: "Contacts", path: "/contacts" },
    { icon: BarChart3, label: "Pipeline", path: "/pipeline" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-foreground">ClientSphere</h3>
            <p className="text-xs text-muted-foreground">
              Professional CRM for managing your sales pipeline
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-2">
            {footerLinks.map((link) => (
              <Button
                key={link.path}
                variant={location === link.path ? "default" : "ghost"}
                size="sm"
                onClick={() => setLocation(link.path)}
                className="gap-2"
              >
                <link.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Button>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ClientSphere. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
