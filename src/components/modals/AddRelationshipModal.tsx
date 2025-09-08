import { useState, useEffect } from 'react';
import { Search, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
}

interface AddRelationshipModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onRelationshipAdded: () => void;
}

const relationshipTypes = [
  { value: 'spouse', label: 'Spouse/Partner' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'family', label: 'Family Member' },
  { value: 'household', label: 'Household Member' },
  { value: 'emergency_contact', label: 'Emergency Contact' },
];

export function AddRelationshipModal({ 
  open, 
  onClose, 
  clientId, 
  onRelationshipAdded 
}: AddRelationshipModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [relationshipType, setRelationshipType] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      searchClients();
    } else {
      setClients([]);
    }
  }, [debouncedSearchTerm, clientId]);

  const searchClients = async () => {
    try {
      setSearching(true);
      
      // Get existing relationships to exclude them from search
      const { data: existingRelationships } = await supabase
        .from('client_relationships')
        .select('client_id, related_client_id')
        .or(`client_id.eq.${clientId},related_client_id.eq.${clientId}`);

      const excludeIds = new Set([clientId]);
      existingRelationships?.forEach(rel => {
        excludeIds.add(rel.client_id);
        excludeIds.add(rel.related_client_id);
      });

      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone')
        .not('id', 'in', `(${Array.from(excludeIds).join(',')})`)
        .or(`first_name.ilike.%${debouncedSearchTerm}%,last_name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%`)
        .limit(10);

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error searching clients:', error);
      toast({
        title: "Error",
        description: "Failed to search clients",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const handleAddRelationship = async () => {
    if (!selectedClient || !relationshipType) {
      toast({
        title: "Error",
        description: "Please select a client and relationship type",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('client_relationships')
        .insert({
          client_id: clientId,
          related_client_id: selectedClient.id,
          relationship_type: relationshipType,
          relationship_notes: notes.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${selectedClient.first_name} ${selectedClient.last_name} as ${relationshipType}`
      });

      onRelationshipAdded();
      handleClose();
    } catch (error) {
      console.error('Error adding relationship:', error);
      toast({
        title: "Error",
        description: "Failed to add relationship",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setClients([]);
    setSelectedClient(null);
    setRelationshipType('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Link Client Relationship
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search for client */}
          <div className="space-y-2">
            <Label htmlFor="client-search">Search for Client</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="client-search"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Search results */}
            {clients.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full p-3 text-left hover:bg-muted transition-colors border-b last:border-b-0 ${
                      selectedClient?.id === client.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="font-medium">
                      {client.first_name} {client.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {client.email || client.phone || 'No contact info'}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {searching && (
              <div className="text-sm text-muted-foreground">Searching...</div>
            )}
            
            {debouncedSearchTerm.length >= 2 && !searching && clients.length === 0 && (
              <div className="text-sm text-muted-foreground">No clients found</div>
            )}
          </div>

          {/* Selected client */}
          {selectedClient && (
            <div className="p-3 border rounded-md bg-muted/50">
              <div className="font-medium">
                Selected: {selectedClient.first_name} {selectedClient.last_name}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedClient.email || selectedClient.phone || 'No contact info'}
              </div>
            </div>
          )}

          {/* Relationship type */}
          <div className="space-y-2">
            <Label htmlFor="relationship-type">Relationship Type</Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="relationship-notes">Memory Notes (Optional)</Label>
            <Textarea
              id="relationship-notes"
              placeholder="e.g., 'Lives together', 'John's mother-in-law', 'Emergency contact for kids'..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddRelationship} 
              disabled={!selectedClient || !relationshipType || loading}
            >
              {loading ? 'Adding...' : 'Add Relationship'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}