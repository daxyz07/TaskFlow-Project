import { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingUp, Activity, Target, Award } from 'lucide-react';

const Performance = () => {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);

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
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  const statusData = stats?.task_by_status ? [
    { name: 'To Do', value: stats.task_by_status.todo || 0, color: '#a1a1aa' },
    { name: 'In Progress', value: stats.task_by_status.in_progress || 0, color: '#22d3ee' },
    { name: 'Review', value: stats.task_by_status.review || 0, color: '#818cf8' },
    { name: 'Done', value: stats.task_by_status.done || 0, color: '#34d399' }
  ] : [];

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#f43f5e' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#818cf8' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#a1a1aa' }
  ];

  const completionRate = stats ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0;

  return (
    <div data-testid="performance-page">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-2">Performance</h1>
        <p className="text-muted-foreground">Track team productivity and task metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="glass-card border-white/5" data-testid="completion-rate-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <Target className="w-4 h-4 text-primary" />
              <span>Completion Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading text-primary">{completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">of total tasks completed</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5" data-testid="active-tasks-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Active Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading text-cyan-400">
              {(stats?.task_by_status?.in_progress || 0) + (stats?.task_by_status?.review || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">currently in progress</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5" data-testid="high-priority-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-destructive" />
              <span>High Priority</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading text-destructive">
              {tasks.filter(t => t.priority === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">urgent tasks</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5" data-testid="team-efficiency-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Team Efficiency</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading text-emerald-400">85%</div>
            <p className="text-xs text-muted-foreground mt-1">overall productivity</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-white/5" data-testid="status-chart-card">
          <CardHeader>
            <CardTitle className="font-heading">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5" data-testid="priority-chart-card">
          <CardHeader>
            <CardTitle className="font-heading">Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Performance;