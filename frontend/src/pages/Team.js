import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API, AuthContext } from '../App';
import { Users as UsersIcon, UserPlus, Shield, UserCog } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const Team = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`${API}/users/${userId}/role?role=${newRole}`);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update role');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'manager':
        return 'bg-violet-400/20 text-violet-400 border-violet-400/30';
      default:
        return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'manager':
        return <UserCog className="w-4 h-4" />;
      default:
        return <UsersIcon className="w-4 h-4" />;
    }
  };

  return (
    <div data-testid="team-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-2">Team</h1>
          <p className="text-muted-foreground">Manage team members and roles</p>
        </div>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <UsersIcon className="w-5 h-5" />
          <span className="font-semibold">{users.length} members</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card className="glass-card border-white/5" data-testid="admin-count-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <Shield className="w-4 h-4 text-destructive" />
              <span>Admins</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5" data-testid="manager-count-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <UserCog className="w-4 h-4 text-violet-400" />
              <span>Managers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading">
              {users.filter(u => u.role === 'manager').length}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5" data-testid="member-count-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <UsersIcon className="w-4 h-4 text-primary" />
              <span>Members</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading">
              {users.filter(u => u.role === 'member').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((member) => (
          <Card
            key={member.id}
            data-testid={`team-member-${member.id}`}
            className="glass-card border-white/5 hover:border-white/10 transition-all duration-300"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center font-bold text-lg text-primary">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold font-heading">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <Badge className={`${getRoleBadgeColor(member.role)} border flex items-center space-x-1`}>
                    {getRoleIcon(member.role)}
                    <span className="capitalize">{member.role}</span>
                  </Badge>
                </div>
                
                {user.role === 'admin' && member.id !== user.id && (
                  <div>
                    <Select
                      value={member.role}
                      onValueChange={(newRole) => handleRoleChange(member.id, newRole)}
                    >
                      <SelectTrigger
                        data-testid={`role-select-${member.id}`}
                        className="w-full bg-secondary/50 border-white/10"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Team;