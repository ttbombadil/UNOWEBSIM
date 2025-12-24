import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ArduinoSimulator from "@/pages/arduino-simulator";
import NotFound from "@/pages/not-found";
import React from "react";
import SecretDialog from "@/components/features/secret-dialog";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ArduinoSimulator} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [secretOpen, setSecretOpen] = React.useState(false);

  React.useEffect(() => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");

    const onKey = (e: KeyboardEvent) => {
      const isSecret = (isMac ? e.metaKey : e.ctrlKey) && e.shiftKey && e.code === "KeyE";
      if (isSecret) {
        e.preventDefault();
        e.stopPropagation();
        setSecretOpen((s) => !s);
      }
    };

    document.addEventListener("keydown", onKey, { capture: true });
    return () => document.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SecretDialog open={secretOpen} onOpenChange={setSecretOpen} />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
