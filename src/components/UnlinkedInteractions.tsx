import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Calendar, Phone, Mail, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UnlinkedInteraction {
  id: string;
  contact_name: string;
  channel: string;
  summary: string;
  occurred_at: string;
  assistance_type: string | null;
  requested_amount: number | null;
}

export const UnlinkedInteractions = () => {
  const [interactions, setInteractions] = useState<UnlinkedInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUnlinkedInteractions = async () => {
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('id, contact_name, channel, summary, occurred_at, assistance_type, requested_amount')
        .is('client_id', null)
        .order('occurred_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setInteractions(data || []);
    } catch (error) {
      console.error('Error fetching unlinked interactions:', error);
      toast({
        title: "Error",
        description: "Failed to load unlinked interactions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnlinkedInteractions();
  }, []);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'web_form': return <MessageSquare className="h-4 w-4" />;
      case 'walk_in': return <UserPlus className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const handleLinkToClient = (interactionId: string) => {
    navigate(`/portal/clients/new?interactionId=${interactionId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (interactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Unlinked Interactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">All interactions are linked to clients.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Unlinked Interactions ({interactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {interactions.map((interaction) => (
          <div key={interaction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getChannelIcon(interaction.channel)}
                <span className="font-medium text-sm">{interaction.contact_name}</span>
                <Badge variant="outline" className="text-xs">
                  {interaction.channel.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                {interaction.summary}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(interaction.occurred_at).toLocaleDateString()}
                {interaction.requested_amount && (
                  <span className="ml-2 font-medium">${interaction.requested_amount}</span>
                )}
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleLinkToClient(interaction.id)}
              className="ml-3"
            >
              Link to Client
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};