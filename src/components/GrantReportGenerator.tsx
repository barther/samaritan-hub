import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// DatePicker removed - using native date input instead
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FileText, Download } from "lucide-react";

export const GrantReportGenerator = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [narrative, setNarrative] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);

      // Fetch data for the report period
      const [clientsResult, disbursementsResult, intakesResult] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        supabase
          .from('disbursements')
          .select('*, clients(*)')
          .gte('disbursement_date', startDate.toISOString().split('T')[0])
          .lte('disbursement_date', endDate.toISOString().split('T')[0]),
        
        supabase
          .from('public_intake')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      ]);

      const clients = clientsResult.data || [];
      const disbursements = disbursementsResult.data || [];
      const intakes = intakesResult.data || [];

      // Calculate statistics
      const totalAssistanceAmount = disbursements.reduce((sum, d) => sum + Number(d.amount), 0);
      const uniqueFamilies = new Set(disbursements.map(d => d.client_id)).size;
      const repeatClients = clients.filter(c => c.assistance_count > 1).length;
      const repeatClientPercentage = clients.length > 0 ? (repeatClients / clients.length) * 100 : 0;
      const avgAssistancePerClient = uniqueFamilies > 0 ? totalAssistanceAmount / uniqueFamilies : 0;

      // Demographics analysis
      const demographics = {
        totalIntakes: intakes.length,
        countiesCovered: [...new Set(intakes.map(i => i.county).filter(Boolean))].length,
        averageHouseholdSize: 0, // Would need to calculate from assistance_requests
      };

      // Outcomes analysis
      const outcomes = {
        totalDisbursements: disbursements.length,
        assistanceTypes: disbursements.reduce((acc, d) => {
          acc[d.assistance_type] = (acc[d.assistance_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      // Save the report
      const { error } = await supabase
        .from('grant_reports')
        .insert({
          report_period_start: startDate.toISOString().split('T')[0],
          report_period_end: endDate.toISOString().split('T')[0],
          total_clients_served: clients.length,
          total_assistance_amount: totalAssistanceAmount,
          unique_families_helped: uniqueFamilies,
          repeat_client_percentage: repeatClientPercentage,
          avg_assistance_per_client: avgAssistancePerClient,
          demographics,
          outcomes,
          narrative_summary: narrative,
        });

      if (error) throw error;

      // Generate downloadable report
      const reportContent = generateReportContent({
        startDate,
        endDate,
        totalClients: clients.length,
        totalAssistance: totalAssistanceAmount,
        uniqueFamilies,
        repeatClientPercentage,
        avgAssistancePerClient,
        demographics,
        outcomes,
        narrative,
        disbursements,
      });

      // Create and download file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grant-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Grant report generated and downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate grant report",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateReportContent = (data: any) => {
    return `
GRANT ACCOUNTABILITY REPORT
Period: ${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()}

EXECUTIVE SUMMARY
================
Total Clients Served: ${data.totalClients}
Unique Families Helped: ${data.uniqueFamilies}
Total Assistance Provided: $${data.totalAssistance.toFixed(2)}
Average Assistance per Client: $${data.avgAssistancePerClient.toFixed(2)}
Repeat Client Rate: ${data.repeatClientPercentage.toFixed(1)}%

DEMOGRAPHIC BREAKDOWN
====================
Total Intake Requests: ${data.demographics.totalIntakes}
Counties Served: ${data.demographics.countiesCovered}

ASSISTANCE TYPE BREAKDOWN
========================
${Object.entries(data.outcomes.assistanceTypes)
  .map(([type, count]) => `${type}: ${count} disbursements`)
  .join('\n')}

FINANCIAL ACCOUNTABILITY
=======================
Total Disbursements Made: ${data.outcomes.totalDisbursements}
Average Disbursement Amount: $${(data.totalAssistance / data.outcomes.totalDisbursements).toFixed(2)}

NARRATIVE SUMMARY
================
${data.narrative}

DETAILED TRANSACTIONS
====================
${data.disbursements.map((d: any, index: number) => 
  `${index + 1}. ${d.clients?.first_name} ${d.clients?.last_name} - $${d.amount} - ${d.assistance_type} - ${d.disbursement_date}`
).join('\n')}

Generated on: ${new Date().toLocaleDateString()}
    `;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Grant Report Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="start-date">Report Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => setStartDate(new Date(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="end-date">Report End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => setEndDate(new Date(e.target.value))}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="narrative">Narrative Summary</Label>
          <Textarea
            id="narrative"
            placeholder="Provide a narrative summary of the impact and outcomes for this reporting period..."
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={4}
          />
        </div>

        <Button
          onClick={generateReport}
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            "Generating Report..."
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate Grant Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};