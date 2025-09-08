import { useState, useEffect } from 'react';
import { Users, UserPlus, MessageCircle, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AddRelationshipModal } from '@/components/modals/AddRelationshipModal';
import { format } from 'date-fns';

interface RelatedClient {
  client_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  relationship_type: string;
  relationship_notes: string | null;
  last_interaction_date: string | null;
  last_interaction_summary: string | null;
}

interface ClientRelationshipsProps {
  clientId: string;
  onClientSelect?: (clientId: string) => void;
}

export function ClientRelationships({ clientId, onClientSelect }: ClientRelationshipsProps) {
  const [relatedClients, setRelatedClients] = useState<RelatedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRelatedClients();
  }, [clientId]);

  const fetchRelatedClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_related_clients', {
        p_client_id: clientId
      });

      if (error) throw error;
      setRelatedClients(data || []);
    } catch (error) {
      console.error('Error fetching related clients:', error);
      toast({
        title: "Error",
        description: "Failed to load related clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRelationship = async (relatedClientId: string) => {
    try {
      const { error } = await supabase
        .from('client_relationships')
        .delete()
        .or(`and(client_id.eq.${clientId},related_client_id.eq.${relatedClientId}),and(client_id.eq.${relatedClientId},related_client_id.eq.${clientId})`);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client relationship removed"
      });
      
      fetchRelatedClients();
    } catch (error) {
      console.error('Error removing relationship:', error);
      toast({
        title: "Error",
        description: "Failed to remove relationship",
        variant: "destructive"
      });
    }
  };

  const getRelationshipBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'spouse': return 'default';
      case 'parent': return 'secondary';
      case 'child': return 'outline';
      case 'sibling': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Related Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Related Clients
              {relatedClients.length > 0 && (
                <Badge variant="secondary">{relatedClients.length}</Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Link Client
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {relatedClients.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No linked clients yet</p>
              <p className="text-sm">Link family members or household contacts for better context</p>
            </div>
          ) : (
            <div className="space-y-4">
              {relatedClients.map((client, index) => (
                <div key={client.client_id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => onClientSelect?.(client.client_id)}
                          className="font-medium hover:text-primary transition-colors cursor-pointer"
                        >
                          {client.first_name} {client.last_name}
                        </button>
                        <Badge variant={getRelationshipBadgeVariant(client.relationship_type)}>
                          {client.relationship_type}
                        </Badge>
                      </div>
                      
                      {/* Contact info */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        {client.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </div>
                        )}
                      </div>

                      {/* Relationship notes */}
                      {client.relationship_notes && (
                        <div className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium">Notes:</span> {client.relationship_notes}
                        </div>
                      )}

                      {/* Last interaction */}
                      {client.last_interaction_date && (
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1 mb-1">
                            <MessageCircle className="h-3 w-3" />
                            <span className="font-medium">Last contact:</span>
                            {format(new Date(client.last_interaction_date), 'MMM d, yyyy')}
                          </div>
                          {client.last_interaction_summary && (
                            <div className="text-xs pl-4 italic">
                              {client.last_interaction_summary}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRelationship(client.client_id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                  
                  {index < relatedClients.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddRelationshipModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        clientId={clientId}
        onRelationshipAdded={fetchRelatedClients}
      />
    </>
  );
}