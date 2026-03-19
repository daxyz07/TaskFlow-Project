import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API, AuthContext } from '../App';
import { CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const Approvals = () => {
  const { user } = useContext(AuthContext);
  const [approvals, setApprovals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    task_id: '',
    approver_id: '',
    description: ''
  });

  useEffect(() => {
    fetchApprovals();
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchApprovals = async () => {
    try {
      const response = await axios.get(`${API}/approvals`);
      setApprovals(response.data);
    } catch (error) {
      toast.error('Failed to fetch approvals');
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/approvals`, formData);
      setApprovals([...approvals, response.data]);
      toast.success('Approval request sent');
      setDialogOpen(false);
      setFormData({
        task_id: '',
        approver_id: '',
        description: ''
      });
    } catch (error) {
      toast.error('Failed to create approval request');
    }
  };

  const handleApprove = async (approvalId) => {
    try {
      await axios.put(`${API}/approvals/${approvalId}?status=approved`);
      setApprovals(approvals.map(a => a.id === approvalId ? { ...a, status: 'approved' } : a));
      toast.success('Approval granted');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleReject = async (approvalId) => {
    try {
      await axios.put(`${API}/approvals/${approvalId}?status=rejected`);
      setApprovals(approvals.map(a => a.id === approvalId ? { ...a, status: 'rejected' } : a));
      toast.success('Approval rejected');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject');
    }
  };

  const getTaskTitle = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.title || 'Unknown Task';
  };

  const getUserName = (userId) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.name || 'Unknown User';
  };

  const myApprovals = approvals.filter(a => a.approver_id === user.id);
  const myRequests = approvals.filter(a => a.requester_id === user.id);

  const ApprovalCard = ({ approval, isApprover }) => {
    const statusColors = {
      pending: 'bg-violet-400/20 text-violet-400 border-violet-400/30',
      approved: 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30',
      rejected: 'bg-destructive/20 text-destructive border-destructive/30'
    };

    return (
      <Card
        data-testid={`approval-${approval.id}`}
        className="glass-card border-white/5 hover:border-white/10 transition-all duration-300"
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold font-heading mb-2">{getTaskTitle(approval.task_id)}</h3>
              {approval.description && (
                <p className="text-muted-foreground text-sm mb-3">{approval.description}</p>
              )}
            </div>
            <Badge className={`${statusColors[approval.status]} border capitalize`}>
              {approval.status}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <div>Requester: <span className="text-foreground">{getUserName(approval.requester_id)}</span></div>
            <div>Approver: <span className="text-foreground">{getUserName(approval.approver_id)}</span></div>
            <div>Created {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}</div>
          </div>
          
          {isApprover && approval.status === 'pending' && (
            <div className="flex items-center space-x-2">
              <Button
                data-testid={`approve-${approval.id}-btn`}
                size="sm"
                onClick={() => handleApprove(approval.id)}
                className="flex-1 bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                data-testid={`reject-${approval.id}-btn`}
                size="sm"
                variant="outline"
                onClick={() => handleReject(approval.id)}
                className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div data-testid="approvals-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-2">Approvals</h1>
          <p className="text-muted-foreground">Manage approval requests and workflows</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="request-approval-btn" className="bg-primary text-white hover:bg-primary/90 glow-hover">
              <Plus className="w-4 h-4 mr-2" />
              Request Approval
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle className="font-heading">Request Approval</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="request-approval-form">
              <div>
                <Label htmlFor="task">Task</Label>
                <Select value={formData.task_id} onValueChange={(value) => setFormData({ ...formData, task_id: value })}>
                  <SelectTrigger data-testid="approval-task-select" className="bg-secondary/50 border-white/10">
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="approver">Approver</Label>
                <Select value={formData.approver_id} onValueChange={(value) => setFormData({ ...formData, approver_id: value })}>
                  <SelectTrigger data-testid="approval-approver-select" className="bg-secondary/50 border-white/10">
                    <SelectValue placeholder="Select approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.role === 'admin' || u.role === 'manager').map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  data-testid="approval-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-secondary/50 border-white/10"
                  rows={3}
                />
              </div>
              <Button data-testid="submit-approval-btn" type="submit" className="w-full bg-primary text-white hover:bg-primary/90">
                Send Request
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Approvals (for approver) */}
      {myApprovals.filter(a => a.status === 'pending').length > 0 && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-semibold font-heading">Pending Your Approval</h2>
            <Badge className="bg-violet-400/20 text-violet-400">
              {myApprovals.filter(a => a.status === 'pending').length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myApprovals.filter(a => a.status === 'pending').map((approval) => (
              <ApprovalCard key={approval.id} approval={approval} isApprover={true} />
            ))}
          </div>
        </div>
      )}

      {/* My Requests */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold font-heading mb-4">My Requests</h2>
        {myRequests.length === 0 ? (
          <Card className="glass-card border-white/5">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No approval requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myRequests.map((approval) => (
              <ApprovalCard key={approval.id} approval={approval} isApprover={false} />
            ))}
          </div>
        )}
      </div>

      {/* All Approvals */}
      <div>
        <h2 className="text-xl font-semibold font-heading mb-4">All Approvals</h2>
        {approvals.length === 0 ? (
          <Card className="glass-card border-white/5">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No approvals yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvals.map((approval) => (
              <ApprovalCard key={approval.id} approval={approval} isApprover={approval.approver_id === user.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;