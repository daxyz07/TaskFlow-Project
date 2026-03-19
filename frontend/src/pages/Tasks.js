import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API, AuthContext } from '../App';
import { Search, Filter, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';

const Tasks = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
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

  const filterTasks = () => {
    let filtered = [...tasks];

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await axios.delete(`${API}/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete task');
    }
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setEditData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignee_id: task.assignee_id || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API}/tasks/${selectedTask.id}`, editData);
      setTasks(tasks.map(t => t.id === selectedTask.id ? response.data : t));
      toast.success('Task updated successfully');
      setEditDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update task');
    }
  };

  const getAssigneeName = (assigneeId) => {
    const assignee = users.find(u => u.id === assigneeId);
    return assignee?.name || 'Unassigned';
  };

  return (
    <div data-testid="tasks-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-2">Tasks</h1>
          <p className="text-muted-foreground">View and manage all tasks</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl border border-white/5 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="search-tasks-input"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-white/10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="status-filter-select" className="bg-secondary/50 border-white/10">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger data-testid="priority-filter-select" className="bg-secondary/50 border-white/10">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="glass-card rounded-xl border border-white/5 p-12 text-center">
            <p className="text-muted-foreground">No tasks found</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              data-testid={`task-item-${task.id}`}
              className="glass-card rounded-xl border border-white/5 p-6 hover:border-white/10 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold font-heading">{task.title}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      task.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                      task.priority === 'medium' ? 'bg-violet-400/20 text-violet-400' :
                      'bg-muted/50 text-muted-foreground'
                    }`}>
                      {task.priority}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full capitalize font-mono ${
                      task.status === 'done' ? 'bg-emerald-400/20 text-emerald-400' :
                      task.status === 'in_progress' ? 'bg-cyan-400/20 text-cyan-400' :
                      task.status === 'review' ? 'bg-violet-400/20 text-violet-400' :
                      'bg-muted/50 text-muted-foreground'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-muted-foreground mb-3">{task.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Assigned to: <span className="text-foreground">{getAssigneeName(task.assignee_id)}</span></span>
                    <span>•</span>
                    <span>Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    data-testid={`edit-task-${task.id}-btn`}
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(task)}
                    className="hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {(user.role === 'admin' || user.role === 'manager') && (
                    <Button
                      data-testid={`delete-task-${task.id}-btn`}
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(task.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4" data-testid="edit-task-form">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                data-testid="edit-task-title-input"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                required
                className="bg-secondary/50 border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                data-testid="edit-task-description-input"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="bg-secondary/50 border-white/10"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editData.status} onValueChange={(value) => setEditData({ ...editData, status: value })}>
                  <SelectTrigger data-testid="edit-task-status-select" className="bg-secondary/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={editData.priority} onValueChange={(value) => setEditData({ ...editData, priority: value })}>
                  <SelectTrigger data-testid="edit-task-priority-select" className="bg-secondary/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-assignee">Assignee</Label>
              <Select value={editData.assignee_id} onValueChange={(value) => setEditData({ ...editData, assignee_id: value })}>
                <SelectTrigger data-testid="edit-task-assignee-select" className="bg-secondary/50 border-white/10">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button data-testid="update-task-btn" type="submit" className="w-full bg-primary text-white hover:bg-primary/90">
              Update Task
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;