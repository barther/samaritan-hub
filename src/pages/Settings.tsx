import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Settings, Bell, DollarSign, Mail, Users, Shield, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import UserManagementModal from "@/components/modals/UserManagementModal";
import { supabase } from "@/integrations/supabase/client";
import { AccountabilityDashboard } from "@/components/AccountabilityDashboard";
import { GrantReportGenerator } from "@/components/GrantReportGenerator";
const SettingsPage = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  // Settings state
  const [settings, setSettings] = useState({
    // General settings
    lowFundThreshold: 100,
    autoArchiveInteractions: true,
    defaultAssistanceAmount: 200,
    // Notification settings
    emailNotifications: true,
    lowFundAlerts: true,
    newRequestAlerts: true,
    // Email settings
    emailProvider: 'msgraph',
    // Email templates
    approvalEmailTemplate: `Dear {client_name},

Your request for {assistance_type} assistance has been approved for ${'{amount}'}.

Please contact us at your earliest convenience to arrange disbursement.

Best regards,
Good Samaritan Assistance Team`,
    denialEmailTemplate: `Dear {client_name},

Thank you for your assistance request. Unfortunately, we are unable to approve your request at this time due to {reason}.

Please feel free to contact us if your circumstances change.

Best regards,
Good Samaritan Assistance Team`,
    // System settings
    requireClientLink: false,
    enableAuditLog: true,
    dataRetentionMonths: 36
  });
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const loadSettings = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('settings').select('key, value');
      if (error) {
        throw error;
      }
      if (data) {
        const settingsObj: any = {};
        data.forEach(setting => {
          const value = setting.value as any;
          if (setting.key === 'financial') {
            settingsObj.lowFundThreshold = value.lowFundThreshold;
            settingsObj.defaultAssistanceAmount = value.defaultAssistanceAmount;
          } else if (setting.key === 'system') {
            settingsObj.autoArchiveInteractions = value.autoArchiveInteractions;
            settingsObj.requireClientLink = value.requireClientLink;
            settingsObj.dataRetentionMonths = value.dataRetentionMonths;
            settingsObj.enableAuditLog = value.enableAuditLog;
          } else if (setting.key === 'notifications') {
            settingsObj.emailNotifications = value.emailNotifications;
            settingsObj.lowFundAlerts = value.lowFundAlerts;
            settingsObj.newRequestAlerts = value.newRequestAlerts;
          } else if (setting.key === 'email_templates') {
            settingsObj.approvalEmailTemplate = value.approvalEmailTemplate;
            settingsObj.denialEmailTemplate = value.denialEmailTemplate;
          } else if (setting.key === 'email') {
            settingsObj.emailProvider = value.emailProvider;
          }
        });
        setSettings(prev => ({
          ...prev,
          ...settingsObj
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can modify settings.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      // Save all settings to database
      const updates = [{
        key: 'financial',
        value: {
          lowFundThreshold: settings.lowFundThreshold,
          defaultAssistanceAmount: settings.defaultAssistanceAmount
        }
      }, {
        key: 'system',
        value: {
          autoArchiveInteractions: settings.autoArchiveInteractions,
          requireClientLink: settings.requireClientLink,
          dataRetentionMonths: settings.dataRetentionMonths,
          enableAuditLog: settings.enableAuditLog
        }
      }, {
        key: 'notifications',
        value: {
          emailNotifications: settings.emailNotifications,
          lowFundAlerts: settings.lowFundAlerts,
          newRequestAlerts: settings.newRequestAlerts
        }
      }, {
        key: 'email_templates',
        value: {
          approvalEmailTemplate: settings.approvalEmailTemplate,
          denialEmailTemplate: settings.denialEmailTemplate
        }
      }, {
        key: 'email',
        value: {
          emailProvider: settings.emailProvider
        }
      }];
      const {
        data: userRes
      } = await supabase.auth.getUser();
      const userId = userRes.user?.id ?? null;
      for (const update of updates) {
        const {
          error
        } = await supabase.from('settings').upsert({
          key: update.key,
          value: update.value,
          updated_by: userId
        }, {
          onConflict: 'key'
        });
        if (error) throw error;
      }
      toast({
        title: "Settings Saved",
        description: "All settings have been saved successfully."
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleAutoSave = async (settingType: string, newValue: any) => {
    if (!isAdmin) return;
    try {
      const {
        data: userRes
      } = await supabase.auth.getUser();
      const userId = userRes.user?.id ?? null;
      const {
        error
      } = await supabase.from('settings').upsert({
        key: settingType,
        value: newValue,
        updated_by: userId
      });
      if (error) throw error;
      toast({
        title: "Settings saved",
        description: "Your changes have been saved automatically."
      });
    } catch (error) {
      console.error('Error auto-saving setting:', error);
      toast({
        title: "Save Error",
        description: "Failed to save setting. Please try again.",
        variant: "destructive"
      });
    }
  };
  useEffect(() => {
    const checkRoleAndLoad = async () => {
      try {
        const {
          data: hasAdminRole
        } = await supabase.rpc('verify_user_role', {
          required_role: 'admin'
        });
        setIsAdmin(!!hasAdminRole);
        if (hasAdminRole) {
          await loadSettings();
        }
      } catch (e) {
        console.error('Role check failed', e);
      } finally {
        setCheckingRole(false);
      }
    };
    checkRoleAndLoad();
  }, []);
  const handleExportData = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can export data.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      toast({
        title: "Export started",
        description: "Preparing your data export..."
      });

      const { data: sessionRes } = await supabase.auth.getSession();
      const authToken = sessionRes.session?.access_token;

      if (!authToken) {
        throw new Error("Authentication required");
      }

      const response = await supabase.functions.invoke('export-data', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      // The response should be CSV data
      const csvData = response.data;
      
      // Create blob and download
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `good-samaritan-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export completed",
        description: "Your data has been downloaded successfully."
      });

    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast({
        title: "Error",
        description: "Please enter an email address to test the system.",
        variant: "destructive"
      });
      return;
    }
    setSendingTestEmail(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('send-email-msgraph', {
        body: {
          to: testEmailAddress,
          subject: 'Test Email from Good Samaritan System',
          html: `
            <h2>Test Email</h2>
            <p>This is a test email to verify Microsoft Graph integration is working correctly.</p>
            <p>Sent at: ${new Date().toLocaleString()}</p>
            <p>From: Good Samaritan Assistance System</p>
          `,
          sender: 'donotreply@lithiaspringsmethodist.org'
        }
      });
      if (error) {
        throw error;
      }
      toast({
        title: "Test email sent",
        description: `Test email sent successfully to ${testEmailAddress}`
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: `Failed to send test email: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSendingTestEmail(false);
    }
  };
  return <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/portal/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground">Configure system preferences</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Mail className="h-4 w-4 mr-2" />
              Email Templates
            </TabsTrigger>
            <TabsTrigger value="accountability">
              <Users className="h-4 w-4 mr-2" />
              Accountability
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security & Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="lowFundThreshold">Low Fund Alert Threshold ($)</Label>
                    <Input id="lowFundThreshold" type="number" value={settings.lowFundThreshold} onChange={e => {
                    const newSettings = {
                      ...settings,
                      lowFundThreshold: Number(e.target.value)
                    };
                    setSettings(newSettings);
                  }} onBlur={e => {
                    const newSettings = {
                      ...settings,
                      lowFundThreshold: Number(e.target.value)
                    };
                    handleAutoSave('financial', {
                      lowFundThreshold: newSettings.lowFundThreshold,
                      defaultAssistanceAmount: settings.defaultAssistanceAmount
                    });
                  }} />
                    <p className="text-xs text-muted-foreground mt-1">
                      Show warning when funds fall below this amount
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="defaultAssistanceAmount">Default Assistance Amount ($)</Label>
                    <Input id="defaultAssistanceAmount" type="number" value={settings.defaultAssistanceAmount} onChange={e => setSettings(prev => ({
                    ...prev,
                    defaultAssistanceAmount: Number(e.target.value)
                  }))} />
                    <p className="text-xs text-muted-foreground mt-1">
                      Pre-fill amount for new assistance requests
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-archive old interactions</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically archive interactions older than 1 year
                      </p>
                    </div>
                    <Switch checked={settings.autoArchiveInteractions} onCheckedChange={checked => setSettings(prev => ({
                    ...prev,
                    autoArchiveInteractions: checked
                  }))} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require client link for disbursements</Label>
                      <p className="text-xs text-muted-foreground">
                        Force all disbursements to be linked to a client
                      </p>
                    </div>
                    <Switch checked={settings.requireClientLink} onCheckedChange={checked => setSettings(prev => ({
                    ...prev,
                    requireClientLink: checked
                  }))} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive email updates for important events
                    </p>
                  </div>
                  <Switch checked={settings.emailNotifications} onCheckedChange={checked => setSettings(prev => ({
                  ...prev,
                  emailNotifications: checked
                }))} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low fund alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified when funds are running low
                    </p>
                  </div>
                  <Switch checked={settings.lowFundAlerts} onCheckedChange={checked => setSettings(prev => ({
                  ...prev,
                  lowFundAlerts: checked
                }))} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>New request alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified about new assistance requests
                    </p>
                  </div>
                  <Switch checked={settings.newRequestAlerts} onCheckedChange={checked => setSettings(prev => ({
                  ...prev,
                  newRequestAlerts: checked
                }))} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Provider Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                      <div>
                        <Label htmlFor="testEmailAddress">Test Email System</Label>
                        <Input id="testEmailAddress" type="email" value={testEmailAddress} onChange={e => setTestEmailAddress(e.target.value)} placeholder="your-email@example.com" className="mt-1" />
                        <p className="text-xs text-muted-foreground mt-1">Enter your email address to test the system. All emails will be sent from donotreply@lithiaspringsmethodist.org</p>
                      </div>

                      <div className="pt-2">
                        <Button variant="outline" onClick={handleSendTestEmail} disabled={sendingTestEmail || !testEmailAddress}>
                          {sendingTestEmail ? "Sending..." : "Send Test Email"}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Send a test email to verify Microsoft Graph configuration
                        </p>
                      </div>
                    </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Approval Email Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="Email template for approved requests..." value={settings.approvalEmailTemplate} onChange={e => setSettings(prev => ({
                  ...prev,
                  approvalEmailTemplate: e.target.value
                }))} rows={8} />
                  <p className="text-xs text-muted-foreground mt-2">
                    Use {"{client_name}"}, {"{assistance_type}"}, and {"{amount}"} as placeholders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Denial Email Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="Email template for denied requests..." value={settings.denialEmailTemplate} onChange={e => setSettings(prev => ({
                  ...prev,
                  denialEmailTemplate: e.target.value
                }))} rows={8} />
                  <p className="text-xs text-muted-foreground mt-2">
                    Use {"{client_name}"} and {"{reason}"} as placeholders
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable audit logging</Label>
                      <p className="text-xs text-muted-foreground">
                        Track all user actions for security
                      </p>
                    </div>
                    <Switch checked={settings.enableAuditLog} onCheckedChange={checked => setSettings(prev => ({
                    ...prev,
                    enableAuditLog: checked
                  }))} />
                  </div>

                  <div>
                    <Label htmlFor="dataRetention">Data Retention (months)</Label>
                    <Select value={settings.dataRetentionMonths.toString()} onValueChange={value => setSettings(prev => ({
                    ...prev,
                    dataRetentionMonths: Number(value)
                  }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="24">24 months</SelectItem>
                        <SelectItem value="36">36 months</SelectItem>
                        <SelectItem value="60">60 months</SelectItem>
                        <SelectItem value="120">10 years</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      How long to keep archived data
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Data Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Export Data</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Download all client data, interactions, and financial records
                    </p>
                    <Button variant="outline" onClick={handleExportData}>
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data
                    </Button>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">User Management</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Manage staff access and permissions
                    </p>
                    <Button variant="outline" onClick={() => setShowUserManagement(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="accountability">
            <div className="space-y-6">
              <AccountabilityDashboard />
              <GrantReportGenerator />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={loading || !isAdmin}>
            {loading ? "Saving..." : isAdmin ? "Save All Settings" : "Admin Only"}
          </Button>
        </div>
      </main>

      <UserManagementModal open={showUserManagement} onOpenChange={setShowUserManagement} />
    </div>;
};
export default SettingsPage;