import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, ArrowLeft, Calendar, DollarSign, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Reports = () => {
  const [reportType, setReportType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalDisbursements: 0,
    totalClients: 0,
    loading: true
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const reportTypes = [
    { value: "donations", label: "Donations Report", description: "Summary of all donations received" },
    { value: "disbursements", label: "Disbursements Report", description: "Summary of all assistance provided" },
    { value: "interactions", label: "Interactions Report", description: "Summary of all client interactions" },
    { value: "financial", label: "Financial Summary", description: "Combined donations and disbursements" },
    { value: "clients", label: "Client Report", description: "List of all clients and their interactions" }
  ];

  const datePresets = [
    { 
      label: "Last 7 days", 
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
      }
    },
    { 
      label: "Last 30 days", 
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
      }
    },
    { 
      label: "Year to Date", 
      getValue: () => {
        const end = new Date();
        const start = new Date(end.getFullYear(), 0, 1);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
      }
    }
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get total donations
      const { data: donations, error: donationsError } = await supabase
        .from('donations')
        .select('amount');
      
      if (donationsError) throw donationsError;
      
      // Get total disbursements
      const { data: disbursements, error: disbursementsError } = await supabase
        .from('disbursements')
        .select('amount');
      
      if (disbursementsError) throw disbursementsError;
      
      // Get total clients count
      const { count: clientsCount, error: clientsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
      
      if (clientsError) throw clientsError;
      
      const totalDonations = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const totalDisbursements = disbursements?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      
      setStats({
        totalDonations,
        totalDisbursements,
        totalClients: clientsCount || 0,
        loading: false
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const generateReport = async () => {
    if (!reportType) {
      toast({
        title: "Missing information",
        description: "Please select a report type.",
        variant: "destructive"
      });
      return;
    }

    // Use default date range if not specified
    let finalStartDate = startDate;
    let finalEndDate = endDate;
    
    if (!startDate || !endDate) {
      const defaultRange = datePresets[1].getValue(); // Last 30 days
      finalStartDate = defaultRange.start;
      finalEndDate = defaultRange.end;
      
      toast({
        title: "Using default date range",
        description: "Last 30 days will be used since no date range was specified."
      });
    }

    setIsGenerating(true);
    
    try {
      let data = [];
      let csvContent = "";
      
      switch (reportType) {
        case "donations":
          const { data: donationsData, error: donationsError } = await supabase
            .from('donations')
            .select('*')
            .gte('donation_date', finalStartDate)
            .lte('donation_date', finalEndDate)
            .order('donation_date', { ascending: false });
          
          if (donationsError) throw donationsError;
          
          console.log('Donations data:', donationsData?.length, 'records found');
          
          csvContent = "Date,Donor Name,Amount,Source,Notes\n" + 
            (donationsData?.map(d => 
              `${d.donation_date},"${d.donor_name || 'Anonymous'}","$${d.amount}","${d.source}","${d.notes || ''}"`
            ).join('\n') || '');
          break;
          
        case "disbursements":
          const { data: disbursementsData, error: disbursementsError } = await supabase
            .from('disbursements')
            .select('*, clients(first_name, last_name)')
            .gte('disbursement_date', finalStartDate)
            .lte('disbursement_date', finalEndDate)
            .order('disbursement_date', { ascending: false });
          
          if (disbursementsError) throw disbursementsError;
          
          console.log('Disbursements data:', disbursementsData?.length, 'records found');
          
          csvContent = "Date,Recipient,Amount,Type,Payment Method,Check Number,Notes\n" + 
            (disbursementsData?.map(d => 
              `${d.disbursement_date},"${d.recipient_name}","$${d.amount}","${d.assistance_type}","${d.payment_method}","${d.check_number || ''}","${d.notes || ''}"`
            ).join('\n') || '');
          break;
          
        case "interactions":
          const { data: interactionsData, error: interactionsError } = await supabase
            .from('interactions')
            .select('*, clients(first_name, last_name)')
            .gte('occurred_at', `${finalStartDate}T00:00:00`)
            .lte('occurred_at', `${finalEndDate}T23:59:59`)
            .order('occurred_at', { ascending: false });
          
          if (interactionsError) throw interactionsError;
          
          console.log('Interactions data:', interactionsData?.length, 'records found');
          
          csvContent = "Date,Client,Channel,Status,Summary,Requested Amount,Approved Amount\n" + 
            (interactionsData?.map(i => 
              `${new Date(i.occurred_at).toLocaleDateString()},"${i.clients?.first_name || ''} ${i.clients?.last_name || ''}","${i.channel}","${i.status}","${i.summary}","$${i.requested_amount || 0}","$${i.approved_amount || 0}"`
            ).join('\n') || '');
          break;
          
        case "clients":
          const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('*')
            .gte('created_at', `${finalStartDate}T00:00:00`)
            .lte('created_at', `${finalEndDate}T23:59:59`)
            .order('created_at', { ascending: false });
          
          if (clientsError) throw clientsError;
          
          console.log('Clients data:', clientsData?.length, 'records found');
          
          csvContent = "Date Created,First Name,Last Name,Email,Phone,City,State,County\n" + 
            (clientsData?.map(c => 
              `${new Date(c.created_at).toLocaleDateString()},"${c.first_name}","${c.last_name}","${c.email || ''}","${c.phone || ''}","${c.city || ''}","${c.state || ''}","${c.county || ''}"`
            ).join('\n') || '');
          break;
          
        case "financial":
          // Combined financial report
          const [donationsRes, disbursementsRes] = await Promise.all([
            supabase.from('donations').select('*').gte('donation_date', finalStartDate).lte('donation_date', finalEndDate),
            supabase.from('disbursements').select('*').gte('disbursement_date', finalStartDate).lte('disbursement_date', finalEndDate)
          ]);
          
          if (donationsRes.error || disbursementsRes.error) {
            throw donationsRes.error || disbursementsRes.error;
          }
          
          const totalDonations = donationsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
          const totalDisbursements = disbursementsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
          
          csvContent = `Financial Summary (${finalStartDate} to ${finalEndDate})\n\n` +
            `Total Donations,$${totalDonations}\n` +
            `Total Disbursements,$${totalDisbursements}\n` +
            `Net Balance,$${totalDonations - totalDisbursements}\n\n` +
            `Donations Detail:\nDate,Donor,Amount,Source\n` +
            donationsRes.data?.map(d => `${d.donation_date},"${d.donor_name || 'Anonymous'}","$${d.amount}","${d.source}"`).join('\n') +
            `\n\nDisbursements Detail:\nDate,Recipient,Amount,Type\n` +
            disbursementsRes.data?.map(d => `${d.disbursement_date},"${d.recipient_name}","$${d.amount}","${d.assistance_type}"`).join('\n');
          break;
          
        default:
          throw new Error("Invalid report type");
      }
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${reportType}-report-${finalStartDate}-to-${finalEndDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Report generated successfully",
        description: "Your report has been downloaded."
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: "Error generating report",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/portal/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Reports</h1>
                <p className="text-sm text-muted-foreground">Generate various reports</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Start Date (Optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Leave empty for default (last 30 days)"
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Leave empty for default (today)"
                />
              </div>

              <div className="space-y-2">
                <Label>Quick Date Ranges</Label>
                <div className="flex flex-wrap gap-2">
                  {datePresets.map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const range = preset.getValue();
                        setStartDate(range.start);
                        setEndDate(range.end);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={generateReport} 
                disabled={isGenerating}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Report"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportTypes.map((type) => (
                  <div key={type.value} className="border border-border rounded-lg p-3">
                    <h4 className="font-medium text-foreground">{type.label}</h4>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Donations</p>
                  <p className="text-2xl font-bold text-success">
                    {stats.loading ? "Loading..." : `$${stats.totalDonations.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Disbursements</p>
                  <p className="text-2xl font-bold text-destructive">
                    {stats.loading ? "Loading..." : `$${stats.totalDisbursements.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.loading ? "Loading..." : stats.totalClients.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Reports;