import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import ContactProfile from "./pages/ContactProfile";
import PipelineBoard from "./pages/PipelineBoard";

function Router() {
  return (
    <Switch>
      <Route path={"/"}>
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path={"/contacts"}>
        <DashboardLayout>
          <Contacts />
        </DashboardLayout>
      </Route>
      <Route path={"/contacts/:id"}>
        <DashboardLayout>
          <ContactProfile />
        </DashboardLayout>
      </Route>
      <Route path={"/pipeline"}>
        <DashboardLayout>
          <PipelineBoard />
        </DashboardLayout>
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
