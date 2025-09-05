import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  DollarSign, 
  FileText, 
  Search, 
  Plus,
  TrendingUp,
  AlertCircle,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PortalDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Development mode detection
  const urlParams = new URLSearchParams(window.location.search);
  const isDevMode = import.meta.env.DEV && urlParams.get('dev') === 'true';
  // Mock data - will be replaced with real data when Supabase is connected
  const mockBalance = 1250.75;
  const lowFundThreshold = 100;

  const mockInteractions = [
    {
      id: "1",
      occurredAt: "2024-01-15T10:30:00Z",
      contactName: "John Smith",
      channel: "public_form",
      summary: "Request for rent assistance",
      hasIndividual: true,
      isNewRequest: true,
      ageInDays: 1
    },
    {
      id: "2", 
      occurredAt: "2024-01-10T14:15:00Z",
      contactName: "Mary Johnson",
      channel: "phone",
      summary: "Follow-up on utility assistance",
      hasIndividual: true,
      isNewRequest: false,
      ageInDays: 6
    },
    {
      id: "3",
      occurredAt: "2024-01-08T09:45:00Z",
      contactName: "Unknown Caller",
      channel: "phone", 
      summary: "General inquiry about services",
      hasIndividual: false,
      isNewRequest: false,
      ageInDays: 8
    }
  ];

  // Enforce Azure auth and allowed domain
  const enforceSession = (session: any) => {
    if (!session?.user) {
      navigate("/portal", { replace: true });
      return;
    }
    const email = session.user.email?.toLowerCase() || "";
    if (!email.endsWith("@lithiaspringsmethodist.org")) {
      supabase.auth.signOut();
      toast({
        title: "Organization access only",
        description: "Please sign in with your @lithiaspringsmethodist.org account.",
        variant: "destructive",
      });
      navigate("/portal", { replace: true });
    }
  };

  useEffect(() => {
    // Skip auth enforcement in development mode
    if (isDevMode) {
      console.log('Development mode: skipping auth enforcement');
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      enforceSession(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => enforceSession(session));
    return () => subscription.unsubscribe();
  }, [isDevMode]);

  const isLowFunds = mockBalance < lowFundThreshold;

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta - No Index */}
      <meta name="robots" content="noindex" />
      
      {/* Development Mode Banner */}
      {isDevMode && (
        <div className="bg-orange-500 text-white text-center py-2 text-sm font-medium">
          🚧 Development Mode Active - Authentication Bypassed
        </div>
      )}
      
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Good Samaritan Dashboard</h1>
              <p className="text-sm text-muted-foreground">Staff Portal</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                Reports
              </Button>
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Low Funds Warning */}
        {isLowFunds && (
          <div className="mb-6 bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <h3 className="font-medium text-warning-foreground">Low Fund Balance</h3>
                <p className="text-sm text-muted-foreground">
                  Current balance is below the ${lowFundThreshold} threshold. Consider fundraising efforts.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Funds Overview */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                Funds Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className={`text-2xl font-bold ${isLowFunds ? 'text-warning' : 'text-success'}`}>
                  ${mockBalance.toFixed(2)}
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button variant="donation" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Donation
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Disbursement
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">30-Day Trend</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Donations: $850 | Disbursements: $420
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Client Lookup */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Client Lookup
              </CardTitle>
              <CardDescription>
                Search for existing clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Name, phone, email, or address..."
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <Button variant="default" className="w-full">
                Search Clients
              </Button>

              <div className="text-center">
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Interaction
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="assistance" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Internal Intake
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Logbook */}
        <Card className="shadow-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Interactions
            </CardTitle>
            <CardDescription>
              Latest client interactions and requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockInteractions.map((interaction) => (
                <div 
                  key={interaction.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-foreground">
                          {interaction.contactName}
                        </span>
                        <Badge 
                          variant={interaction.channel === 'public_form' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {interaction.channel.replace('_', ' ')}
                        </Badge>
                        
                        {!interaction.hasIndividual && (
                          <Badge variant="destructive" className="text-xs">
                            Unlinked
                          </Badge>
                        )}
                        
                        {interaction.isNewRequest && (
                          <Badge variant="secondary" className="text-xs">
                            New Request
                          </Badge>
                        )}
                        
                        {interaction.ageInDays > 7 && (
                          <Badge variant="destructive" className="text-xs">
                            Aging {interaction.ageInDays}d
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {interaction.summary}
                      </p>
                      
                      <p className="text-xs text-muted-foreground">
                        {new Date(interaction.occurredAt).toLocaleDateString()} at{' '}
                        {new Date(interaction.occurredAt).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <Button variant="ghost">
                Load More Interactions
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PortalDashboard;