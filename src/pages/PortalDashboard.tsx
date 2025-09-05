import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, FileText, Search, Plus, TrendingUp, AlertCircle, Clock, Zap, Menu, X, FileDown, Download, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DonationModal } from "@/components/modals/DonationModal";
import { DisbursementModal } from "@/components/modals/DisbursementModal";
import { NewInteractionModal } from "@/components/modals/NewInteractionModal";
import { QuickEntryModal } from "@/components/modals/QuickEntryModal";
import { UnlinkedInteractions } from "@/components/UnlinkedInteractions";
import { TransactionLedger } from "@/components/TransactionLedger";
import { generatePDFReport, downloadPDF } from "@/utils/pdfGenerator";
import { ImportWizard } from "@/components/ImportWizard";
const PortalDashboard = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // User profile state
  const [userProfile, setUserProfile] = useState<{
    displayName: string;
  } | null>(null);

  // User roles state
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // Modal states
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showQuickEntryModal, setShowQuickEntryModal] = useState(false);

  // Search term for client lookup
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Real data states
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(true);
  const [interactionsPage, setInteractionsPage] = useState(0);
  const [hasMoreInteractions, setHasMoreInteractions] = useState(true);
  const [balance, setBalance] = useState(0);
  const [monthlyDonations, setMonthlyDonations] = useState(0);
  const [monthlyDisbursements, setMonthlyDisbursements] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInteractionsHidden, setIsInteractionsHidden] = useState(false);
  const lowFundThreshold = 100;
  const ITEMS_PER_PAGE = 5;

  // Derived role flags
  const isAdmin = userRoles.includes('admin');
  const isStaff = userRoles.includes('staff');
  const canViewFinancials = isAdmin; // Only admins can view financial data now
  const canEditData = isAdmin || isStaff;
  useEffect(() => {
    loadUserRoles();
  }, []);
  useEffect(() => {
    if (!isLoadingRoles) {
      loadInitialData();
    }
  }, [isLoadingRoles]);
  const loadUserRoles = async () => {
    try {
      const {
        data: session
      } = await supabase.auth.getSession();
      if (!session.session?.user) {
        navigate("/portal", {
          replace: true
        });
        return;
      }

      // Validate email domain
      const email = session.session.user.email?.toLowerCase() || "";
      if (!email.endsWith("@lithiaspringsmethodist.org")) {
        supabase.auth.signOut();
        toast({
          title: "Organization access only",
          description: "Please sign in with your @lithiaspringsmethodist.org account.",
          variant: "destructive"
        });
        navigate("/portal", {
          replace: true
        });
        return;
      }

      // Use secure RPC function to check roles instead of direct table access
      try {
        const userId = session.session.user.id;

        // Check for admin role
        const {
          data: hasAdminRole,
          error: adminError
        } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'admin'
        });

        // Check for staff role  
        const {
          data: hasStaffRole,
          error: staffError
        } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'staff'
        });
        if (adminError && staffError) {
          console.error('Error checking user roles:', adminError, staffError);
          toast({
            title: "Error loading permissions",
            description: "Please contact an administrator.",
            variant: "destructive"
          });
          navigate("/portal", {
            replace: true
          });
          return;
        }

        // User must have at least admin or staff role
        if (!hasAdminRole && !hasStaffRole) {
          toast({
            title: "No permissions assigned",
            description: "Please contact an administrator to assign your role.",
            variant: "destructive"
          });
          navigate("/portal", {
            replace: true
          });
          return;
        }

        // Build roles array for compatibility with existing code
        const roleNames: string[] = [];
        if (hasAdminRole) roleNames.push('admin');
        if (hasStaffRole) roleNames.push('staff');
        setUserRoles(roleNames);

        // Load user profile from Azure
        await loadUserProfile(session.session.user.email!);
      } catch (roleError) {
        console.error('Failed to load roles:', roleError);
        toast({
          title: "Permission check failed",
          description: "Please contact an administrator to assign your role.",
          variant: "destructive"
        });
        navigate("/portal", {
          replace: true
        });
        return;
      }
    } catch (error) {
      console.error('Error in loadUserRoles:', error);
      navigate("/portal", {
        replace: true
      });
    } finally {
      setIsLoadingRoles(false);
    }
  };
  const loadUserProfile = async (email: string) => {
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('get-user-profile', {
        body: {
          userEmail: email
        }
      });
      if (error) {
        console.error('Error loading user profile:', error);
        // Set fallback profile
        setUserProfile({
          displayName: email.split('@')[0]
        });
        return;
      }
      if (data?.profile) {
        setUserProfile({
          displayName: data.profile.displayName
        });
      } else {
        // Set fallback profile
        setUserProfile({
          displayName: email.split('@')[0]
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Set fallback profile
      setUserProfile({
        displayName: email.split('@')[0]
      });
    }
  };
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/portal", {
        replace: true
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };
  const loadInitialData = async () => {
    await Promise.all([loadInteractions(0, true), loadBalance(), loadMonthlyTrends()]);
  };
  const loadMonthlyTrends = async () => {
    if (!canViewFinancials) {
      setMonthlyDonations(0);
      setMonthlyDisbursements(0);
      return;
    }
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const [donationsRes, disbursementsRes] = await Promise.all([supabase.from('donations').select('amount').gte('donation_date', thirtyDaysAgo.toISOString().split('T')[0]), supabase.from('disbursements').select('amount').gte('disbursement_date', thirtyDaysAgo.toISOString().split('T')[0])]);
      const monthlyDonationsTotal = donationsRes.data?.reduce((sum, d) => sum + d.amount, 0) || 0;
      const monthlyDisbursementsTotal = disbursementsRes.data?.reduce((sum, d) => sum + d.amount, 0) || 0;
      setMonthlyDonations(monthlyDonationsTotal);
      setMonthlyDisbursements(monthlyDisbursementsTotal);
    } catch (error) {
      console.error('Error loading monthly trends:', error);
      setMonthlyDonations(0);
      setMonthlyDisbursements(0);
    }
  };
  const loadBalance = async () => {
    if (!canViewFinancials) {
      setBalance(0);
      return;
    }
    try {
      const [donationsRes, disbursementsRes] = await Promise.all([supabase.from('donations').select('amount'), supabase.from('disbursements').select('amount')]);
      const totalDonations = donationsRes.data?.reduce((sum, d) => sum + d.amount, 0) || 0;
      const totalDisbursements = disbursementsRes.data?.reduce((sum, d) => sum + d.amount, 0) || 0;
      setBalance(totalDonations - totalDisbursements);
    } catch (error) {
      console.error('Error loading balance:', error);
      setBalance(0);
    }
  };
  const loadInteractions = async (page: number, reset: boolean = false) => {
    try {
      setIsLoadingInteractions(true);

      // Load regular staff interactions
      const {
        data: staffInteractions,
        error: staffError
      } = await supabase.from('interactions').select(`
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
        `).order('occurred_at', {
        ascending: false
      });
      if (staffError) {
        console.error('Error loading staff interactions:', staffError);
        if (staffError.code === 'PGRST301') {
          toast({
            title: "Access denied",
            description: "You don't have permission to view interactions. Contact an administrator.",
            variant: "destructive"
          });
          return;
        }
        throw staffError;
      }

      // Load public intake requests
      const {
        data: intakeRequests,
        error: intakeError
      } = await supabase.from('public_intake').select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          help_needed,
          status,
          created_at,
          viewed_at,
          client_id,
          interaction_id
        `).order('created_at', {
        ascending: false
      });
      if (intakeError) {
        console.error('Error loading intake requests:', intakeError);
        // Don't fail completely if just intake fails
      }

      // Process staff interactions
      const processedStaffInteractions = staffInteractions?.map(interaction => ({
        ...interaction,
        type: 'staff_interaction',
        hasIndividual: !!interaction.client_id,
        isNewRequest: interaction.status === 'new',
        isUnread: false,
        ageInDays: Math.floor((new Date().getTime() - new Date(interaction.occurred_at).getTime()) / (1000 * 60 * 60 * 24)),
        timestamp: new Date(interaction.occurred_at).getTime()
      })) || [];

      // Process public intake requests
      const processedIntakeRequests = intakeRequests?.map(intake => ({
        id: intake.id,
        contact_name: `${intake.first_name} ${intake.last_name}`,
        channel: 'public_form',
        summary: `Public intake: ${intake.help_needed.substring(0, 100)}${intake.help_needed.length > 100 ? '...' : ''}`,
        status: intake.status,
        assistance_type: null,
        requested_amount: null,
        occurred_at: intake.created_at,
        client_id: intake.client_id,
        clients: null,
        interaction_id: intake.interaction_id,
        type: 'public_intake',
        hasIndividual: !!intake.client_id,
        isNewRequest: intake.status === 'pending',
        isUnread: !intake.viewed_at,
        ageInDays: Math.floor((new Date().getTime() - new Date(intake.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        timestamp: new Date(intake.created_at).getTime(),
        email: intake.email,
        phone: intake.phone,
        help_needed: intake.help_needed
      })) || [];

      // Merge and sort chronologically
      const allInteractions = [...processedStaffInteractions, ...processedIntakeRequests].sort((a, b) => b.timestamp - a.timestamp);

      // Count unread items
      const unreadItems = processedIntakeRequests.filter(item => item.isUnread).length;
      setUnreadCount(unreadItems);

      // Apply pagination
      const startIndex = page * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedItems = allInteractions.slice(startIndex, endIndex);
      if (reset) {
        setInteractions(paginatedItems);
      } else {
        setInteractions(prev => [...prev, ...paginatedItems]);
      }
      setHasMoreInteractions(endIndex < allInteractions.length);
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
  const handleViewDetails = async (interaction: any) => {
    // Mark public intake as viewed if it's unread
    if (interaction.type === 'public_intake' && interaction.isUnread) {
      try {
        await supabase.from('public_intake').update({
          viewed_at: new Date().toISOString()
        }).eq('id', interaction.id);

        // Refresh interactions to show updated status
        loadInteractions(0, true);
      } catch (error) {
        console.error('Error marking intake as viewed:', error);
      }
    }
    if (interaction.type === 'public_intake') {
      // Navigate to intake requests page for public form submissions
      navigate('/portal/intake');
    } else if (interaction.client_id) {
      // Navigate to client detail for staff interactions
      navigate(`/portal/clients/${interaction.client_id}`);
    } else {
      toast({
        title: "No client linked",
        description: "This interaction is not linked to a specific client.",
        variant: "destructive"
      });
    }
  };
  const handleAddNewClient = (interaction: any) => {
    // Navigate to new client page with pre-filled data
    navigate('/portal/clients/new', {
      state: {
        interactionId: interaction.id,
        contactName: interaction.contact_name,
        summary: interaction.summary,
        // Include intake-specific data if available
        email: interaction.email || '',
        phone: interaction.phone || '',
        helpNeeded: interaction.help_needed || interaction.summary,
        type: interaction.type
      }
    });
  };

  const generateQuickPDFReport = async (reportType: string) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      let data: any[] = [];
      let reportData: any = {};

      switch (reportType) {
        case 'financial':
          const [donationsRes, disbursementsRes] = await Promise.all([
            supabase.from('donations').select('*').gte('donation_date', startDate).lte('donation_date', endDate),
            supabase.from('disbursements').select('*').gte('disbursement_date', startDate).lte('disbursement_date', endDate)
          ]);
          
          const totalDonations = donationsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
          const totalDisbursements = disbursementsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
          
          reportData = {
            reportType,
            startDate,
            endDate,
            data: [...(donationsRes.data || []), ...(disbursementsRes.data || [])],
            totalDonations,
            totalDisbursements
          };
          break;

        case 'disbursements':
          const { data: disbursements } = await supabase
            .from('disbursements')
            .select('*, clients(first_name, last_name)')
            .gte('disbursement_date', startDate)
            .lte('disbursement_date', endDate)
            .order('disbursement_date', { ascending: false });
          
          reportData = {
            reportType,
            startDate,
            endDate,
            data: disbursements || []
          };
          break;

        case 'interactions':
          const { data: interactionsData } = await supabase
            .from('interactions')
            .select('*, clients(first_name, last_name)')
            .gte('occurred_at', `${startDate}T00:00:00`)
            .lte('occurred_at', `${endDate}T23:59:59`)
            .order('occurred_at', { ascending: false });
          
          reportData = {
            reportType,
            startDate,
            endDate,
            data: interactionsData || []
          };
          break;
      }

      const doc = generatePDFReport(reportData);
      downloadPDF(doc, `${reportType}-report-${startDate}-to-${endDate}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: `Your ${reportType} report has been downloaded.`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report.",
        variant: "destructive"
      });
    }
  };

  // Show loading state while checking roles
  if (isLoadingRoles) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your permissions...</p>
        </div>
      </div>;
  }
  const isLowFunds = balance < lowFundThreshold;
  return <div className="min-h-screen bg-background">
      {/* SEO Meta - No Index */}
      <meta name="robots" content="noindex" />
      
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Good Samaritan Dashboard</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Staff Portal
                {userRoles.length > 0 && <span className="ml-1 sm:ml-2 text-xs bg-primary/10 text-primary px-1 sm:px-2 py-1 rounded">
                    {userRoles.join(', ')}
                  </span>}
              </p>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-3">
              {userProfile && <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{userProfile.displayName}</p>
                  <p className="text-xs text-muted-foreground">Logged in</p>
                </div>}
              <Button variant="outline" size="sm" onClick={() => navigate('/portal/intake')}>
                Intake Requests
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/portal/reports')}>
                Reports
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/portal/settings')}>
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Log Out
              </Button>
            </div>

            {/* Mobile Menu Button & User */}
            <div className="flex lg:hidden items-center gap-2">
              {userProfile && <div className="text-right">
                  <p className="text-sm font-medium text-foreground truncate max-w-24">{userProfile.displayName}</p>
                </div>}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md hover:bg-muted"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 text-foreground" />
                ) : (
                  <Menu className="h-5 w-5 text-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-border bg-background">
              <nav className="flex flex-col space-y-2 px-4 py-4">
                <Button variant="outline" size="sm" onClick={() => { navigate('/portal/intake'); setIsMobileMenuOpen(false); }} className="justify-start">
                  Intake Requests
                </Button>
                <Button variant="outline" size="sm" onClick={() => { navigate('/portal/reports'); setIsMobileMenuOpen(false); }} className="justify-start">
                  Reports
                </Button>
                <Button variant="outline" size="sm" onClick={() => { navigate('/portal/settings'); setIsMobileMenuOpen(false); }} className="justify-start">
                  Settings
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="justify-start">
                  Log Out
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Low Funds Warning */}
        {canViewFinancials && isLowFunds && <div className="mb-6 bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <h3 className="font-medium text-rose-600">Low Fund Balance</h3>
                <p className="text-sm text-muted-foreground">
                  Current balance is below the ${lowFundThreshold} threshold. Consider fundraising efforts.
                </p>
              </div>
            </div>
          </div>}

        {/* Balance and Quick Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Current Balance - Prominent Display */}
          <Card className="md:col-span-2 lg:col-span-2 border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-primary" />
                Good Samaritan Fund Balance
              </CardTitle>
              <CardDescription>Current available funds for assistance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-baseline gap-2 sm:gap-3">
                  <span className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    ${Math.abs(balance).toFixed(2)}
                  </span>
                  {balance < 0 && <Badge variant="destructive" className="text-xs">OVERDRAWN</Badge>}
                  {balance > 0 && balance < lowFundThreshold && <Badge variant="outline" className="text-xs border-warning text-warning">LOW FUNDS</Badge>}
                </div>
                
                {canViewFinancials && <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">This Month Donations</p>
                      <p className="font-semibold text-green-600">+${monthlyDonations.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">This Month Disbursements</p>
                      <p className="font-semibold text-red-600">-${monthlyDisbursements.toFixed(2)}</p>
                    </div>
                  </div>}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canEditData && <>
                  <Button onClick={() => setShowQuickEntryModal(true)} className="w-full justify-start gap-2 bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-white font-medium shadow-lg" size="sm">
                    <Zap className="h-4 w-4" />
                    Quick Entry
                  </Button>
                  {canViewFinancials && <Button variant="outline" onClick={() => setShowDonationModal(true)} className="w-full justify-start gap-2 text-green-700 border-green-200 hover:bg-green-50" size="sm">
                      <Plus className="h-4 w-4" />
                      Add Donation
                    </Button>}
                  <Button variant="outline" onClick={() => setShowInteractionModal(true)} className="w-full justify-start gap-2" size="sm">
                    <FileText className="h-4 w-4" />
                    Full Interaction Form
                  </Button>
                  <Button variant="outline" onClick={() => { 
                    setShowInteractionModal(true);
                    // Pre-fill with walk-in channel
                  }} className="w-full justify-start gap-2 text-blue-700 border-blue-200 hover:bg-blue-50" size="sm">
                    <Users className="h-4 w-4" />
                    Log Walk-in
                  </Button>
                </>}
              <Button variant="outline" onClick={() => navigate('/portal/clients/search')} className="w-full justify-start gap-2" size="sm">
                <Search className="h-4 w-4" />
                Search Clients
              </Button>
              
              {/* Import Wizard */}
              <ImportWizard 
                trigger={
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <Upload className="h-4 w-4" />
                    Import Wizard
                  </Button>
                }
              />
              
              {/* Quick PDF Export Section */}
              <div className="border-t pt-2 mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Quick PDF Exports</p>
                {canViewFinancials && <Button variant="outline" onClick={() => generateQuickPDFReport('financial')} className="w-full justify-start gap-2 mb-1" size="sm">
                    <FileDown className="h-4 w-4" />
                    Financial Report (30d)
                  </Button>}
                <Button variant="outline" onClick={() => generateQuickPDFReport('disbursements')} className="w-full justify-start gap-2 mb-1" size="sm">
                  <Download className="h-4 w-4" />
                  Disbursements (30d)
                </Button>
                <Button variant="outline" onClick={() => generateQuickPDFReport('interactions')} className="w-full justify-start gap-2 mb-1" size="sm">
                  <FileText className="h-4 w-4" />
                  Interactions (30d)
                </Button>
                <Button variant="ghost" onClick={() => navigate('/portal/reports')} className="w-full justify-start gap-2 text-xs" size="sm">
                  <FileDown className="h-3 w-3" />
                  All Reports & Custom Dates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unlinked Interactions Widget */}
        <div className="mb-6">
          <UnlinkedInteractions />
        </div>

        {/* Recent Interactions */}
        <Card className="shadow-card mt-4 sm:mt-6">
          <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
              <span className="text-base sm:text-lg">Recent Interactions</span>
              {unreadCount > 0 && <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsInteractionsHidden(!isInteractionsHidden)} className="text-xs sm:text-sm">
              {isInteractionsHidden ? 'Show' : 'Clear'}
            </Button>
          </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Latest client interactions and requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isInteractionsHidden ? <div className="flex items-center justify-center py-8">
                <div className="text-center text-muted-foreground">
                  <p>Interactions hidden for privacy</p>
                  <p className="text-xs mt-1">Click "Show" to view interactions</p>
                </div>
              </div> : isLoadingInteractions && interactions.length === 0 ? <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-muted-foreground">Loading interactions...</span>
              </div> : <div className="space-y-3 sm:space-y-4">
                {interactions.map(interaction => <div key={interaction.id} className="border border-border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-medium text-foreground text-sm sm:text-base truncate">
                              {interaction.contact_name}
                            </span>
                            <Badge variant={interaction.channel === 'public_form' ? 'default' : 'outline'} className="text-xs shrink-0">
                              {interaction.channel === 'public_form' ? 'Public Form' : interaction.channel.replace('_', ' ')}
                            </Badge>
                          
                          {interaction.isUnread && <Badge variant="destructive" className="text-xs animate-pulse shrink-0">
                             UNREAD
                           </Badge>}
                         
                         {!interaction.hasIndividual && <Badge variant="destructive" className="text-xs">
                             Unlinked
                           </Badge>}
                         
                         {interaction.isNewRequest && <Badge variant="secondary" className="text-xs">
                             {interaction.type === 'public_intake' ? 'Pending Review' : 'New Request'}
                           </Badge>}
                         
                         {interaction.ageInDays > 7 && <Badge variant="destructive" className="text-xs">
                             Aging {interaction.ageInDays}d
                           </Badge>}
                         
                         {/* Triage Status Badge */}
                         {interaction.type !== 'public_intake' && interaction.assistance_type && <Badge variant="outline" className="text-xs">
                             Triage: {interaction.triage_completed_at ? 'Complete' : 'Pending'}
                           </Badge>}
                       </div>
                      
                       <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                         {interaction.summary}
                       </p>
                       
                       <p className="text-xs text-muted-foreground">
                         {new Date(interaction.occurred_at).toLocaleDateString()} at{' '}
                         {new Date(interaction.occurred_at).toLocaleTimeString()}
                       </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {interaction.client_id || interaction.hasIndividual ? <Button variant="outline" size="sm" onClick={() => handleViewDetails(interaction)} className="text-xs sm:text-sm">
                            View Client
                          </Button> : <Button variant="default" size="sm" onClick={() => handleAddNewClient(interaction)} className="text-xs sm:text-sm">
                            Add New Client
                          </Button>}
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(interaction)} className="text-xs sm:text-sm">
                          View Details
                        </Button>
                      </div>
                  </div>
                  </div>)}
                
                {interactions.length === 0 && !isLoadingInteractions && <p className="text-center text-muted-foreground py-8">
                    No interactions found. Create your first interaction to get started.
                  </p>}
              </div>}
            
            {interactions.length > 0 && <div className="mt-4 text-center">
                {hasMoreInteractions ? <Button variant="ghost" onClick={loadMoreInteractions} disabled={isLoadingInteractions}>
                    {isLoadingInteractions ? "Loading..." : "Load More Interactions"}
                  </Button> : <p className="text-sm text-muted-foreground">End of list</p>}
              </div>}
          </CardContent>
        </Card>

        {/* Transaction Ledger */}
        {canViewFinancials && <TransactionLedger balance={balance} onRefresh={() => {
        loadBalance();
        loadMonthlyTrends();
      }} />}

        {/* Modals */}
        {canViewFinancials && <>
            <DonationModal open={showDonationModal} onOpenChange={setShowDonationModal} />
            <DisbursementModal open={showDisbursementModal} onOpenChange={setShowDisbursementModal} />
          </>}
        {canEditData && <>
            <NewInteractionModal open={showInteractionModal} onOpenChange={setShowInteractionModal} onSuccess={() => loadInteractions(0, true)} />
            <QuickEntryModal open={showQuickEntryModal} onOpenChange={setShowQuickEntryModal} onSuccess={() => {
          loadInteractions(0, true);
          loadBalance();
          loadMonthlyTrends();
        }} />
          </>}
      </main>
    </div>;
};
export default PortalDashboard;