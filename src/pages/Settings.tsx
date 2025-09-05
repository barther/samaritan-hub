import { useState } from "react";
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

const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your changes have been saved successfully."
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export initiated",
      description: "Your data export will be ready for download shortly."
    });
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
                    <Input
                      id="lowFundThreshold"
                      type="number"
                      value={settings.lowFundThreshold}
                      onChange={(e) => setSettings(prev => ({ ...prev, lowFundThreshold: Number(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Show warning when funds fall below this amount
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="defaultAssistanceAmount">Default Assistance Amount ($)</Label>
                    <Input
                      id="defaultAssistanceAmount"
                      type="number"
                      value={settings.defaultAssistanceAmount}
                      onChange={(e) => setSettings(prev => ({ ...prev, defaultAssistanceAmount: Number(e.target.value) }))}
                    />
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
                    <Switch
                      checked={settings.autoArchiveInteractions}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoArchiveInteractions: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require client link for disbursements</Label>
                      <p className="text-xs text-muted-foreground">
                        Force all disbursements to be linked to a client
                      </p>
                    </div>
                    <Switch
                      checked={settings.requireClientLink}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireClientLink: checked }))}
                    />
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
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low fund alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified when funds are running low
                    </p>
                  </div>
                  <Switch
                    checked={settings.lowFundAlerts}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, lowFundAlerts: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>New request alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified about new assistance requests
                    </p>
                  </div>
                  <Switch
                    checked={settings.newRequestAlerts}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, newRequestAlerts: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Approval Email Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Email template for approved requests..."
                    value={settings.approvalEmailTemplate}
                    onChange={(e) => setSettings(prev => ({ ...prev, approvalEmailTemplate: e.target.value }))}
                    rows={8}
                  />
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
                  <Textarea
                    placeholder="Email template for denied requests..."
                    value={settings.denialEmailTemplate}
                    onChange={(e) => setSettings(prev => ({ ...prev, denialEmailTemplate: e.target.value }))}
                    rows={8}
                  />
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
                    <Switch
                      checked={settings.enableAuditLog}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableAuditLog: checked }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataRetention">Data Retention (months)</Label>
                    <Select value={settings.dataRetentionMonths.toString()} onValueChange={(value) => setSettings(prev => ({ ...prev, dataRetentionMonths: Number(value) }))}>
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
                    <Button variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave}>
            Save All Settings
          </Button>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;