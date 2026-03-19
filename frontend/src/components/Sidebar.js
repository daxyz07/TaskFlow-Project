import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Kanban, ListChecks, Users, BarChart3, Calendar, FileCheck, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: 'Highlights', path: '/app/highlights', icon: LayoutDashboard },
    { name: 'Kanban Board', path: '/app/kanban', icon: Kanban },
    { name: 'Tasks', path: '/app/tasks', icon: ListChecks },
    { name: 'Team', path: '/app/team', icon: Users },
    { name: 'Performance', path: '/app/performance', icon: BarChart3 },
    { name: 'Meetings', path: '/app/meetings', icon: Calendar },
    { name: 'Approvals', path: '/app/approvals', icon: FileCheck }
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center glow">
            <span className="text-white font-bold text-xl font-heading">T</span>
          </div>
          <span className="text-2xl font-bold font-heading">TaskFlow</span>
        </div>
      </div>

      <nav className="p-4 space-y-2" data-testid="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 glow'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
            onClick={() => setMobileOpen(false)}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                <span className="font-medium">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        data-testid="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-secondary border border-white/10 text-foreground"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 20 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-white/5 z-40"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-white/5 z-30">
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;