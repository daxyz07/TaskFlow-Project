import { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API, AuthContext } from '../App';
import { CheckCircle2, Clock, AlertCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const Highlights = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/tasks`)
      ]);
      setStats(statsRes.data);
      setTasks(tasksRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setLoading(false);
    }
  };

  const myTasks = tasks.filter(t => t.assignee_id === user.id);
  const recentTasks = tasks.slice(0, 5);

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats?.total_tasks || 0,
      icon: <CheckCircle2 className="w-6 h-6 text-primary" />,
      change: '+12%',
      testId: 'stat-total-tasks'
    },
    {
      title: 'My Tasks',
      value: stats?.my_tasks || 0,
      icon: <Clock className="w-6 h-6 text-cyan-400" />,
      change: '+5%',
      testId: 'stat-my-tasks'
    },
    {
      title: 'Completed',
      value: stats?.completed_tasks || 0,
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
      change: '+18%',
      testId: 'stat-completed'
    },
    {
      title: 'Pending Approvals',
      value: stats?.pending_approvals || 0,
      icon: <AlertCircle className="w-6 h-6 text-violet-400" />,
      change: '-3%',
      testId: 'stat-approvals'
    }
  ];

  return (
    <div className="space-y-8" data-testid="highlights-page">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">Here's what's happening with your team today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card
              data-testid={stat.testId}
              className="stat-card glass-card border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading mb-1">{stat.value}</div>
                <p className="text-xs text-emerald-400">{stat.change} from last week</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Task Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-white/5" data-testid="status-breakdown-card">
          <CardHeader>
            <CardTitle className="font-heading">Task Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.task_by_status && Object.entries(stats.task_by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'done' ? 'bg-emerald-400' :
                      status === 'in_progress' ? 'bg-cyan-400' :
                      status === 'review' ? 'bg-violet-400' :
                      'bg-muted-foreground'
                    }`} />
                    <span className="capitalize font-mono text-sm">{status.replace('_', ' ')}</span>
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5" data-testid="recent-tasks-card">
          <CardHeader>
            <CardTitle className="font-heading">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No tasks yet</p>
              ) : (
                recentTasks.map((task) => (
                  <div
                    key={task.id}
                    data-testid={`recent-task-${task.id}`}
                    className="p-3 rounded-lg bg-secondary/30 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{task.title}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                        task.priority === 'medium' ? 'bg-violet-400/20 text-violet-400' :
                        'bg-muted/50 text-muted-foreground'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{task.status.replace('_', ' ')}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Highlights;