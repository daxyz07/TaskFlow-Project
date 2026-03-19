import { useEffect, useState, useContext } from 'react';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import { toast } from 'sonner';
import { API, AuthContext } from '../App';
import { Plus, MoreVertical, Clock, AlertCircle, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { motion } from 'framer-motion';

const TaskCard = ({ task, users, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignee = users.find(u => u.id === task.assignee_id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      data-testid={`task-card-${task.id}`}
      className="task-card-hover bg-zinc-800/50 hover:bg-zinc-800/80 border border-white/5 rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow-md hover:border-indigo-500/30 group relative overflow-hidden mb-3"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm pr-2">{task.title}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
          task.priority === 'high' ? 'bg-destructive/20 text-destructive' :
          task.priority === 'medium' ? 'bg-violet-400/20 text-violet-400' :
          'bg-muted/50 text-muted-foreground'
        }`}>
          {task.priority}
        </span>
      </div>
      
      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {assignee && (
          <div className="flex items-center space-x-1">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary">
              {assignee.name.charAt(0)}
            </div>
            <span>{assignee.name.split(' ')[0]}</span>
          </div>
        )}
        {task.tags?.length > 0 && (
          <div className="flex gap-1">
            {task.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-primary/10 rounded text-primary font-mono">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanColumn = ({ title, tasks, users, status, onTaskClick, onAddTask }) => {
  return (
    <div className="kanban-column flex-shrink-0" data-testid={`kanban-column-${status}`}>
      <div className="bg-zinc-900/30 backdrop-blur-sm rounded-xl border border-white/5 p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold font-heading">{title}</h3>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
          <Button
            data-testid={`add-task-${status}-btn`}
            size="icon"
            variant="ghost"
            onClick={() => onAddTask(status)}
            className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} users={users} onClick={() => onTaskClick(task)} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

const KanbanBoard = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState('todo');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee_id: '',
    status: 'todo',
    tags: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

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

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const columns = {
      'todo': tasks.filter(t => t.status === 'todo'),
      'in_progress': tasks.filter(t => t.status === 'in_progress'),
      'review': tasks.filter(t => t.status === 'review'),
      'done': tasks.filter(t => t.status === 'done')
    };

    let newStatus = task.status;
    for (const [status, statusTasks] of Object.entries(columns)) {
      if (statusTasks.some(t => t.id === over.id)) {
        newStatus = status;
        break;
      }
    }

    if (newStatus !== task.status) {
      if (user.role === 'member' && task.assignee_id !== user.id) {
        toast.error('Members can only change status of their own tasks');
        return;
      }

      try {
        await axios.put(`${API}/tasks/${taskId}`, { status: newStatus });
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        toast.success('Task status updated');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to update task');
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      };
      const response = await axios.post(`${API}/tasks`, taskData);
      setTasks([...tasks, response.data]);
      toast.success('Task created successfully');
      setCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assignee_id: '',
        status: 'todo',
        tags: ''
      });
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleAddTask = (status) => {
    setDefaultStatus(status);
    setFormData({ ...formData, status });
    setCreateDialogOpen(true);
  };

  const columns = [
    { title: 'To Do', status: 'todo' },
    { title: 'In Progress', status: 'in_progress' },
    { title: 'Review', status: 'review' },
    { title: 'Done', status: 'done' }
  ];

  return (
    <div data-testid="kanban-board-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-2">Kanban Board</h1>
          <p className="text-muted-foreground">Drag and drop tasks to update their status</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-task-btn" className="bg-primary text-white hover:bg-primary/90 glow-hover">
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle className="font-heading">Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4" data-testid="create-task-form">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  data-testid="task-title-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="bg-secondary/50 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  data-testid="task-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-secondary/50 border-white/10"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger data-testid="task-priority-select" className="bg-secondary/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select value={formData.assignee_id} onValueChange={(value) => setFormData({ ...formData, assignee_id: value })}>
                    <SelectTrigger data-testid="task-assignee-select" className="bg-secondary/50 border-white/10">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  data-testid="task-tags-input"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="frontend, urgent"
                  className="bg-secondary/50 border-white/10"
                />
              </div>
              <Button data-testid="submit-task-btn" type="submit" className="w-full bg-primary text-white hover:bg-primary/90">
                Create Task
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              title={column.title}
              status={column.status}
              tasks={tasks.filter(t => t.status === column.status)}
              users={users}
              onTaskClick={setSelectedTask}
              onAddTask={handleAddTask}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;