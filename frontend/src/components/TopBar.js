import { Bell, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useContext, useState, useEffect } from 'react';
import { AuthContext, API } from '../App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

const TopBar = ({ user }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`);
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="sticky top-0 z-20 glass border-b border-white/5 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="notifications-btn"
                variant="ghost"
                size="icon"
                className="relative hover:bg-secondary"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge
                    data-testid="notification-badge"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-white text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-card border-white/10">
              <div className="p-3 border-b border-white/5">
                <h3 className="font-semibold font-heading">Notifications</h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <DropdownMenuItem
                      key={notif.id}
                      data-testid={`notification-${notif.id}`}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                      className={`p-4 cursor-pointer ${
                        !notif.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-sm mb-1">{notif.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <div className="flex items-center space-x-3 pl-4 border-l border-white/10">
            <div className="text-right">
              <p className="text-sm font-medium" data-testid="user-name">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize" data-testid="user-role">{user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center font-semibold text-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <Button
              data-testid="logout-btn"
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;