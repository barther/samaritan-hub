import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Users, Phone, Mail, MapPin, ArrowLeft, GitMerge, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClientMergeModal } from "@/components/modals/ClientMergeModal";
import { ClientRiskBadge } from "@/components/ClientRiskBadge";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  county?: string;
  created_at: string;
  risk_level?: string;
  assistance_count?: number;
  total_assistance_received?: number;
  flagged_for_review?: boolean;
}

const ClientSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchClients = useCallback(async (term: string) => {
    if (!term.trim()) {
      setClients([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*, risk_level, assistance_count, total_assistance_received, flagged_for_review')
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Deduplicate by unique client ID
      const uniqueClients = data?.filter((client, index, self) => 
        index === self.findIndex(c => c.id === client.id)
      ) || [];
      
      setClients(uniqueClients);
    } catch (error) {
      console.error('Error searching clients:', error);
      toast({
        title: "Error searching clients",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Auto-search when debounced term changes
  useEffect(() => {
    searchClients(debouncedSearchTerm);
  }, [debouncedSearchTerm, searchClients]);

  const handleManualSearch = () => {
    searchClients(searchTerm);
  };

  const handleClientSelect = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients(prev => [...prev, clientId]);
    } else {
      setSelectedClients(prev => prev.filter(id => id !== clientId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(clients.map(c => c.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleMergeClients = () => {
    if (selectedClients.length < 2) {
      toast({
        title: "Select at least 2 clients",
        description: "You need to select at least 2 clients to merge them.",
        variant: "destructive"
      });
      return;
    }
    setShowMergeModal(true);
  };

  const handleMergeComplete = () => {
    setSelectedClients([]);
    searchClients(debouncedSearchTerm); // Refresh the search results
  };

  const selectedClientObjects = clients.filter(c => selectedClients.includes(c.id));

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
                <h1 className="text-2xl font-bold text-foreground">Client Search</h1>
                <p className="text-sm text-muted-foreground">Find existing clients</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/portal/clients/new')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Client
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone... (searches as you type)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              <Button onClick={handleManualSearch} variant="outline" size="sm">
                Search Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {clients.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Search Results ({clients.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  {selectedClients.length > 0 && (
                    <Badge variant="secondary">
                      {selectedClients.length} selected
                    </Badge>
                  )}
                  {selectedClients.length > 1 && (
                    <Button
                      onClick={handleMergeClients}
                      size="sm"
                      className="gap-2"
                    >
                      <GitMerge className="h-4 w-4" />
                      Merge Selected ({selectedClients.length})
                    </Button>
                  )}
                </div>
              </div>
              {clients.length > 1 && (
                <div className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id="select-all"
                    checked={selectedClients.length === clients.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm font-normal">
                    Select all clients
                  </Label>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className={`border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors ${
                      selectedClients.includes(client.id) ? 'bg-muted/30 border-primary' : ''
                    }`}
                  >
                     <div className="flex items-start gap-3">
                       <Checkbox
                         id={`client-${client.id}`}
                         checked={selectedClients.includes(client.id)}
                         onCheckedChange={(checked) => handleClientSelect(client.id, checked as boolean)}
                         className="mt-1"
                       />
                       <div className="flex-1">
                         <div className="flex items-start justify-between">
                           <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-foreground">
                                  {client.first_name} {client.last_name}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  Client
                                </Badge>
                                {client.risk_level && (
                                  <ClientRiskBadge 
                                    riskLevel={client.risk_level}
                                    assistanceCount={client.assistance_count}
                                    totalReceived={client.total_assistance_received}
                                  />
                                )}
                              </div>
                             
                             <div className="space-y-1 text-sm text-muted-foreground">
                               {client.email && (
                                 <div className="flex items-center gap-2">
                                   <Mail className="h-3 w-3" />
                                   {client.email}
                                 </div>
                               )}
                               {client.phone && (
                                 <div className="flex items-center gap-2">
                                   <Phone className="h-3 w-3" />
                                   {client.phone}
                                 </div>
                               )}
                               {client.address && (
                                 <div className="flex items-center gap-2">
                                   <MapPin className="h-3 w-3" />
                                   {client.address}
                                   {client.city && `, ${client.city}`}
                                   {client.state && `, ${client.state}`}
                                   {client.zip_code && ` ${client.zip_code}`}
                                 </div>
                               )}
                             </div>
                             
                             <p className="text-xs text-muted-foreground mt-2">
                               Added: {new Date(client.created_at).toLocaleDateString()}
                             </p>
                           </div>
                           
                           <Button variant="outline" size="sm" onClick={() => navigate(`/portal/clients/${client.id}`)}>
                             View Details
                           </Button>
                         </div>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {debouncedSearchTerm && clients.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No clients found matching your search for "{debouncedSearchTerm}".</p>
            </CardContent>
          </Card>
        )}

        {!debouncedSearchTerm && clients.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Start typing to search for clients...</p>
            </CardContent>
          </Card>
        )}

        <ClientMergeModal
          isOpen={showMergeModal}
          onClose={() => setShowMergeModal(false)}
          clients={selectedClientObjects}
          onMergeComplete={handleMergeComplete}
        />
      </main>
    </div>
  );
};

export default ClientSearch;