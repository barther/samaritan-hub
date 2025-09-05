import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, User } from "lucide-react";

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
}

interface ClientMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onMergeComplete: () => void;
}

export const ClientMergeModal = ({ isOpen, onClose, clients, onMergeComplete }: ClientMergeModalProps) => {
  const [mergedData, setMergedData] = useState<Partial<Client>>({});
  const [primaryClientId, setPrimaryClientId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize merged data when clients change
  useEffect(() => {
    if (clients.length > 0) {
      // Start with the first client as base
      const baseClient = clients[0];
      setPrimaryClientId(baseClient.id);
      
      // Smart merge: prefer non-empty values from any client
      const merged: Partial<Client> = {
        first_name: baseClient.first_name,
        last_name: baseClient.last_name,
      };

      // For each field, use the first non-empty value found
      const fields: (keyof Client)[] = ['email', 'phone', 'address', 'city', 'state', 'zip_code', 'county'];
      
      fields.forEach(field => {
        for (const client of clients) {
          if (client[field] && !merged[field]) {
            merged[field] = client[field];
            break;
          }
        }
      });

      setMergedData(merged);
    }
  }, [clients]);

  const handleMerge = async () => {
    if (!primaryClientId || !mergedData.first_name || !mergedData.last_name) {
      toast({
        title: "Missing required fields",
        description: "First name and last name are required.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Build duplicates list (all selected except primary)
      const duplicateIds = clients.filter(c => c.id !== primaryClientId).map(c => c.id);

      // Prepare merged payload (server preserves oldest created_at/created_by)
      const mergedPayload = {
        first_name: mergedData.first_name,
        last_name: mergedData.last_name,
        email: mergedData.email ?? "",
        phone: mergedData.phone ?? "",
        address: mergedData.address ?? "",
        city: mergedData.city ?? "",
        state: mergedData.state ?? "",
        zip_code: mergedData.zip_code ?? "",
        county: mergedData.county ?? "",
      };

      // Use transactional merge function (also repoints interactions, assistance requests, disbursements, public_intake)
      const { data, error } = await supabase.rpc('merge_clients', {
        p_primary: primaryClientId,
        p_duplicate_ids: duplicateIds,
        p_merged_data: mergedPayload as any,
      });

      if (error) throw error;

      toast({
        title: "Clients merged successfully",
        description: `${clients.length} clients merged. History and disbursements were preserved.`,
      });

      onMergeComplete();
      onClose();
    } catch (error: any) {
      console.error('Error merging clients:', error);
      toast({
        title: "Error merging clients",
        description: error?.message ?? "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge Client Records</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Clients */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Original Records</h3>
            <div className="space-y-4">
              {clients.map((client) => (
                <Card key={client.id} className="border-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {client.first_name} {client.last_name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={client.id} className="text-xs">Primary</Label>
                        <RadioGroup
                          value={primaryClientId}
                          onValueChange={setPrimaryClientId}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={client.id} id={client.id} />
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    {client.email && <p><strong>Email:</strong> {client.email}</p>}
                    {client.phone && <p><strong>Phone:</strong> {client.phone}</p>}
                    {client.address && (
                      <p><strong>Address:</strong> {client.address}
                        {client.city && `, ${client.city}`}
                        {client.state && `, ${client.state}`}
                        {client.zip_code && ` ${client.zip_code}`}
                      </p>
                    )}
                    {client.county && <p><strong>County:</strong> {client.county}</p>}
                    <p className="text-muted-foreground">
                      <strong>Added:</strong> {new Date(client.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Merged Data */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Merged Record (Edit as needed)</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name*</Label>
                  <Input
                    id="first_name"
                    value={mergedData.first_name || ""}
                    onChange={(e) => setMergedData({ ...mergedData, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name*</Label>
                  <Input
                    id="last_name"
                    value={mergedData.last_name || ""}
                    onChange={(e) => setMergedData({ ...mergedData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={mergedData.email || ""}
                  onChange={(e) => setMergedData({ ...mergedData, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={mergedData.phone || ""}
                  onChange={(e) => setMergedData({ ...mergedData, phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={mergedData.address || ""}
                  onChange={(e) => setMergedData({ ...mergedData, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={mergedData.city || ""}
                    onChange={(e) => setMergedData({ ...mergedData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={mergedData.state || ""}
                    onChange={(e) => setMergedData({ ...mergedData, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code">ZIP</Label>
                  <Input
                    id="zip_code"
                    value={mergedData.zip_code || ""}
                    onChange={(e) => setMergedData({ ...mergedData, zip_code: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="county">County</Label>
                <Input
                  id="county"
                  value={mergedData.county || ""}
                  onChange={(e) => setMergedData({ ...mergedData, county: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={isLoading}>
            {isLoading ? "Merging..." : `Merge ${clients.length} Records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};