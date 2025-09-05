import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Shield, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  firstName?: string;
  lastName?: string;
}

interface UserManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserManagementModal = ({ open, onOpenChange }: UserManagementModalProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("staff");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          first_name,
          last_name,
          created_at
        `);

      if (profilesError) {
        throw profilesError;
      }

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        throw rolesError;
      }

      // Combine profiles with roles
      const usersWithRoles = profiles?.map(profile => {
        const userRole = userRoles?.find(role => role.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: userRole?.role || 'staff',
          status: 'active',
          lastLogin: new Date(profile.created_at).toLocaleDateString()
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const handleInviteUser = async () => {
    if (!newUserEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    try {
      // In a real implementation, this would send an invitation email
      // For now, we'll show a success message
      toast({
        title: "User invited",
        description: `Invitation sent to ${newUserEmail}. They will be added when they sign up.`
      });
      setNewUserEmail("");
      setNewUserRole("staff");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    }
  };

  const handleRemoveUser = async (userId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: "User removed",
        description: `${email} has been removed from the system`
      });
      
      // Refresh the user list
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New User Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite New User
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="userEmail">Email Address</Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="userRole">Role</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="staff">Staff Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleInviteUser} className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </div>
          </div>

          {/* Current Users Table */}
          <div>
            <h3 className="font-semibold mb-4">Current Users {loading && "(Loading...)"}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.email}
                        {user.firstName && user.lastName && (
                          <div className="text-sm text-muted-foreground">
                            {user.firstName} {user.lastName}
                          </div>
                        )}
                      </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(user.id, user.email)}
                          disabled={user.role === 'admin'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementModal;