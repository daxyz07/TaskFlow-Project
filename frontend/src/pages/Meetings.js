import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { Plus, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { format } from 'date-fns';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    datetime: '',
    attendees: []
  });

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get(`${API}/meetings`);
      setMeetings(response.data);
    } catch (error) {
      toast.error('Failed to fetch meetings');
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
      const meetingData = {
        ...formData,
        datetime: new Date(formData.datetime).toISOString()
      };
      const response = await axios.post(`${API}/meetings`, meetingData);
      setMeetings([...meetings, response.data]);
      toast.success('Meeting scheduled successfully');
      setDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        datetime: '',
        attendees: []
      });
    } catch (error) {
      toast.error('Failed to schedule meeting');
    }
  };

  const upcomingMeetings = meetings.filter(m => new Date(m.datetime) > new Date());
  const pastMeetings = meetings.filter(m => new Date(m.datetime) <= new Date());

  const MeetingCard = ({ meeting }) => {
    const isPast = new Date(meeting.datetime) <= new Date();
    return (
      <Card
        data-testid={`meeting-${meeting.id}`}
        className={`glass-card border-white/5 hover:border-white/10 transition-all duration-300 ${
          isPast ? 'opacity-60' : ''
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold font-heading mb-2">{meeting.title}</h3>
              {meeting.description && (
                <p className="text-muted-foreground text-sm mb-3">{meeting.description}</p>
              )}
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${
              isPast ? 'bg-muted/50 text-muted-foreground' : 'bg-primary/20 text-primary'
            }`}>
              {meeting.status}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <CalendarIcon className="w-4 h-4" />
              <span>{format(new Date(meeting.datetime), 'PPP')}</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(meeting.datetime), 'p')}</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{meeting.attendees?.length || 0} attendees</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div data-testid="meetings-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-2">Meetings</h1>
          <p className="text-muted-foreground">Schedule and manage team meetings</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="schedule-meeting-btn" className="bg-primary text-white hover:bg-primary/90 glow-hover">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle className="font-heading">Schedule New Meeting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="schedule-meeting-form">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  data-testid="meeting-title-input"
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
                  data-testid="meeting-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-secondary/50 border-white/10"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="datetime">Date & Time</Label>
                <Input
                  id="datetime"
                  data-testid="meeting-datetime-input"
                  type="datetime-local"
                  value={formData.datetime}
                  onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                  required
                  className="bg-secondary/50 border-white/10"
                />
              </div>
              <Button data-testid="submit-meeting-btn" type="submit" className="w-full bg-primary text-white hover:bg-primary/90">
                Schedule Meeting
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Meetings */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold font-heading mb-4">Upcoming Meetings</h2>
        {upcomingMeetings.length === 0 ? (
          <Card className="glass-card border-white/5">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No upcoming meetings</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold font-heading mb-4">Past Meetings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;