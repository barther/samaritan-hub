import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, TrendingUp, DollarSign, Users, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

const Analytics = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("6months");
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [assistanceTypes, setAssistanceTypes] = useState([]);
  const [keyMetrics, setKeyMetrics] = useState({
    currentBalance: 0,
    monthlyNet: 0,
    clientsHelped: 0,
    avgResponseTime: 0
  });
  
  const [quickStats, setQuickStats] = useState({
    avgDonation: 0,
    avgAssistance: 0,
    repeatClients: 0,
    processingEfficiency: 0,
    fundUtilization: 0
  });

  const timeRanges = [
    { value: "3months", label: "Last 3 Months" },
    { value: "6months", label: "Last 6 Months" },
    { value: "12months", label: "Last 12 Months" },
    { value: "ytd", label: "Year to Date" }
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange(timeRange);
      
      // Load monthly financial data
      const [donationsRes, disbursementsRes] = await Promise.all([
        supabase.from('donations')
          .select('amount, donation_date')
          .gte('donation_date', start)
          .lte('donation_date', end),
        supabase.from('disbursements')
          .select('amount, disbursement_date, assistance_type')
          .gte('disbursement_date', start)
          .lte('disbursement_date', end)
      ]);

      // Process monthly data
      const monthlyMap = new Map();
      
      donationsRes.data?.forEach(d => {
        const month = new Date(d.donation_date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { month, donations: 0, disbursements: 0 });
        }
        monthlyMap.get(month).donations += Number(d.amount);
      });

      disbursementsRes.data?.forEach(d => {
        const month = new Date(d.disbursement_date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { month, donations: 0, disbursements: 0 });
        }
        monthlyMap.get(month).disbursements += Number(d.amount);
      });

      setMonthlyData(Array.from(monthlyMap.values()).sort());

      // Process assistance types
      const typeMap = new Map();
      disbursementsRes.data?.forEach(d => {
        const type = d.assistance_type || 'Other';
        typeMap.set(type, (typeMap.get(type) || 0) + Number(d.amount));
      });

      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];
      const typeData = Array.from(typeMap.entries()).map(([name, value], index) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: colors[index % colors.length]
      }));

      setAssistanceTypes(typeData);

      // Calculate metrics
      const totalDonations = donationsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const totalDisbursements = disbursementsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      
      const clientsRes = await supabase.from('clients').select('id', { count: 'exact', head: true });
      const interactionsRes = await supabase.from('interactions').select('occurred_at, created_at, client_id');

      // Calculate average response time (simplified)
      const avgResponse = interactionsRes.data?.length > 0 ? 
        interactionsRes.data.reduce((sum, i) => {
          const occurred = new Date(i.occurred_at);
          const created = new Date(i.created_at);
          return sum + Math.abs(occurred.getTime() - created.getTime());
        }, 0) / interactionsRes.data.length / (1000 * 60 * 60 * 24) : 0;

      // Calculate quick stats
      const avgDonationAmount = donationsRes.data?.length > 0 ? 
        totalDonations / donationsRes.data.length : 0;
      
      const avgAssistanceAmount = disbursementsRes.data?.length > 0 ?
        totalDisbursements / disbursementsRes.data.length : 0;
      
      // Calculate repeat clients (clients with more than one interaction)
      const clientInteractionCounts = new Map();
      interactionsRes.data?.forEach(i => {
        if (i.client_id) {
          clientInteractionCounts.set(i.client_id, (clientInteractionCounts.get(i.client_id) || 0) + 1);
        }
      });
      
      const repeatClientsCount = Array.from(clientInteractionCounts.values())
        .filter(count => count > 1).length;
      const repeatClientsPercentage = clientsRes.count > 0 ? 
        (repeatClientsCount / clientsRes.count) * 100 : 0;

      const processingEfficiencyRes = await supabase
        .from('interactions')
        .select('status')
        .eq('status', 'completed');
      
      const processingEfficiency = interactionsRes.data?.length > 0 ? 
        ((processingEfficiencyRes.data?.length || 0) / interactionsRes.data.length) * 100 : 0;
      
      const fundUtilization = totalDonations > 0 ? 
        (totalDisbursements / totalDonations) * 100 : 0;

      setKeyMetrics({
        currentBalance: totalDonations - totalDisbursements,
        monthlyNet: Array.from(monthlyMap.values())[Array.from(monthlyMap.values()).length - 1]?.donations - 
                   Array.from(monthlyMap.values())[Array.from(monthlyMap.values()).length - 1]?.disbursements || 0,
        clientsHelped: clientsRes.count || 0,
        avgResponseTime: avgResponse
      });
      
      setQuickStats({
        avgDonation: avgDonationAmount,
        avgAssistance: avgAssistanceAmount,
        repeatClients: repeatClientsPercentage,
        processingEfficiency: processingEfficiency,
        fundUtilization: fundUtilization
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = (range) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case "3months":
        start.setMonth(start.getMonth() - 3);
        break;
      case "6months":
        start.setMonth(start.getMonth() - 6);
        break;
      case "12months":
        start.setMonth(start.getMonth() - 12);
        break;
      case "ytd":
        start.setMonth(0);
        start.setDate(1);
        break;
      default:
        start.setMonth(start.getMonth() - 6);
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const formatCurrency = (value) => `$${value.toLocaleString()}`;
  const formatTooltipCurrency = (value, name) => [formatCurrency(value), name === 'donations' ? 'Donations' : 'Disbursements'];

  const displayMonthlyData = monthlyData.length > 0 ? monthlyData : [];
  const displayAssistanceTypes = assistanceTypes.length > 0 ? assistanceTypes : [];

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
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-sm text-muted-foreground">Financial and operational insights</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="timeRange">Time Range:</Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold text-success">
                    {isLoading ? "Loading..." : formatCurrency(keyMetrics.currentBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold text-primary">
                    {isLoading ? "Loading..." : formatCurrency(keyMetrics.monthlyNet)}
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
                  <p className="text-sm text-muted-foreground">Clients Helped</p>
                  <p className="text-2xl font-bold text-primary">
                    {isLoading ? "Loading..." : keyMetrics.clientsHelped}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold text-primary">
                    {isLoading ? "Loading..." : `${keyMetrics.avgResponseTime.toFixed(1)} days`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {displayMonthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={displayMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                    />
                    <YAxis 
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                      label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={formatTooltipCurrency} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="donations" 
                      stroke="#22c55e" 
                      strokeWidth={2} 
                      name="Donations"
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="disbursements" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      name="Disbursements"
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No financial data available for the selected time period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assistance Types */}
          <Card>
            <CardHeader>
              <CardTitle>Assistance Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {displayAssistanceTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={displayAssistanceTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {displayAssistanceTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No assistance type data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Assistance Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Disbursements</CardTitle>
            </CardHeader>
            <CardContent>
              {displayMonthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={displayMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                    />
                    <YAxis 
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                      label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Disbursements']} />
                    <Legend />
                    <Bar 
                      dataKey="disbursements" 
                      fill="#3b82f6" 
                      name="Disbursements"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No disbursement data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Average donation amount</span>
                  <span className="font-bold">
                    {isLoading ? "Loading..." : formatCurrency(quickStats.avgDonation)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Average assistance amount</span>
                  <span className="font-bold">
                    {isLoading ? "Loading..." : formatCurrency(quickStats.avgAssistance)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Repeat clients</span>
                  <span className="font-bold">
                    {isLoading ? "Loading..." : `${quickStats.repeatClients.toFixed(1)}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Processing efficiency</span>
                  <span className="font-bold">
                    {isLoading ? "Loading..." : `${quickStats.processingEfficiency.toFixed(1)}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fund utilization rate</span>
                  <span className="font-bold">
                    {isLoading ? "Loading..." : `${quickStats.fundUtilization.toFixed(1)}%`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analytics;