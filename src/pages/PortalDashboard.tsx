import { useEffect, useState } from "react";
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
import { DonationModal } from "@/components/modals/DonationModal";
import { DisbursementModal } from "@/components/modals/DisbursementModal";
import { NewInteractionModal } from "@/components/modals/NewInteractionModal";

const PortalDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Development mode detection
  const urlParams = new URLSearchParams(window.location.search);
  const isDevMode = import.meta.env.DEV && urlParams.get('dev') === 'true';
  
  // Modal states
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  
  // Search term for client lookup
  const [searchTerm, setSearchTerm] = useState("");
  
  // Real data states
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(true);
  const [interactionsPage, setInteractionsPage] = useState(0);
  const [hasMoreInteractions, setHasMoreInteractions] = useState(true);
  const [balance, setBalance] = useState(0);
  
  const lowFundThreshold = 100;
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadInteractions(0, true),
      loadBalance()
    ]);
  };

  const loadBalance = async () => {
    try {
      const [donationsRes, disbursementsRes] = await Promise.all([
        supabase.from('donations').select('amount'),
        supabase.from('disbursements').select('amount')
      ]);

      const totalDonations = donationsRes.data?.reduce((sum, d) => sum + d.amount, 0) || 0;
      const totalDisbursements = disbursementsRes.data?.reduce((sum, d) => sum + d.amount, 0) || 0;
      
      setBalance(totalDonations - totalDisbursements);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadInteractions = async (page: number, reset: boolean = false) => {
    try {
      setIsLoadingInteractions(true);
      
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          id,
          contact_name,
          channel,
          summary,
          status,
          assistance_type,
          requested_amount,
          occurred_at,
          client_id,
          clients(first_name, last_name)
        `)
        .order('occurred_at', { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      const processedData = data?.map(interaction => ({
        ...interaction,
        hasIndividual: !!interaction.client_id,
        isNewRequest: interaction.status === 'new',
        ageInDays: Math.floor((new Date().getTime() - new Date(interaction.occurred_at).getTime()) / (1000 * 60 * 60 * 24))
      })) || [];

      if (reset) {
        setInteractions(processedData);
      } else {
        setInteractions(prev => [...prev, ...processedData]);
      }

      setHasMoreInteractions(data?.length === ITEMS_PER_PAGE);
      setInteractionsPage(page);
    } catch (error) {
      console.error('Error loading interactions:', error);
      toast({
        title: "Error loading interactions",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingInteractions(false);
    }
  };

  const loadMoreInteractions = () => {
    if (!isLoadingInteractions && hasMoreInteractions) {
      loadInteractions(interactionsPage + 1, false);
    }
  };

  const handleViewDetails = (interaction: any) => {
    if (interaction.client_id) {
      navigate(`/portal/clients/${interaction.client_id}`);
    } else {
      toast({
        title: "No client linked",
        description: "This interaction is not linked to a specific client.",
        variant: "destructive"
      });
    }
  };

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

  const isLowFunds = balance < lowFundThreshold;

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
              <Button variant="outline" size="sm" onClick={() => navigate('/portal/reports')}>
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
                  ${balance.toFixed(2)}
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button variant="donation" size="sm" className="w-full" onClick={() => setShowDonationModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Donation
                </Button>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowDisbursementModal(true)}>
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <Button variant="default" className="w-full" onClick={() => navigate('/portal/clients')}>
                Search Clients
              </Button>

              <div className="text-center">
                <Button variant="ghost" size="sm" onClick={() => setShowInteractionModal(true)}>
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
              <Button variant="assistance" className="w-full justify-start" onClick={() => setShowInteractionModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Internal Intake
              </Button>
              
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/portal/reports')}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/portal/analytics')}>
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
            {isLoadingInteractions && interactions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-muted-foreground">Loading interactions...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {interactions.map((interaction) => (
                <div 
                  key={interaction.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-foreground">
                            {interaction.contact_name}
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
                        {new Date(interaction.occurred_at).toLocaleDateString()} at{' '}
                        {new Date(interaction.occurred_at).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(interaction)}>
                      View Details
                    </Button>
                  </div>
                  </div>
                ))}
                
                {interactions.length === 0 && !isLoadingInteractions && (
                  <p className="text-center text-muted-foreground py-8">
                    No interactions found. Create your first interaction to get started.
                  </p>
                )}
              </div>
            )}
            
            {interactions.length > 0 && (
              <div className="mt-4 text-center">
                {hasMoreInteractions ? (
                  <Button 
                    variant="ghost" 
                    onClick={loadMoreInteractions}
                    disabled={isLoadingInteractions}
                  >
                    {isLoadingInteractions ? "Loading..." : "Load More Interactions"}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">End of list</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <DonationModal open={showDonationModal} onOpenChange={setShowDonationModal} />
        <DisbursementModal open={showDisbursementModal} onOpenChange={setShowDisbursementModal} />
        <NewInteractionModal open={showInteractionModal} onOpenChange={setShowInteractionModal} />
      </main>
    </div>
  );
};

export default PortalDashboard;