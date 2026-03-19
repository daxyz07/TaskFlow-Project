import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Users, BarChart3, Calendar, FileCheck } from 'lucide-react';
import { Button } from '../components/ui/button';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <CheckCircle2 className="w-8 h-8 text-primary" />,
      title: "Smart Task Management",
      description: "Organize, prioritize, and track tasks with an intuitive Kanban board interface."
    },
    {
      icon: <Users className="w-8 h-8 text-cyan-400" />,
      title: "Team Collaboration",
      description: "Assign tasks, share updates, and collaborate seamlessly with your team."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-emerald-400" />,
      title: "Performance Analytics",
      description: "Track progress and productivity with comprehensive analytics and insights."
    },
    {
      icon: <Calendar className="w-8 h-8 text-violet-400" />,
      title: "Meeting Scheduler",
      description: "Schedule and manage team meetings with integrated calendar functionality."
    },
    {
      icon: <FileCheck className="w-8 h-8 text-pink-400" />,
      title: "Approval Workflows",
      description: "Streamline decision-making with built-in approval and review processes."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center glow">
                <span className="text-white font-bold text-xl font-heading">T</span>
              </div>
              <span className="text-2xl font-bold font-heading">TaskFlow</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                data-testid="nav-login-btn"
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-foreground hover:text-primary"
              >
                Login
              </Button>
              <Button
                data-testid="nav-signup-btn"
                onClick={() => navigate('/signup')}
                className="bg-primary text-white hover:bg-primary/90 glow-hover"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 gradient-hero">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight mb-6">
              Streamline Your Team's
              <br />
              <span className="text-primary">Workflow & Productivity</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              TaskFlow is the modern task management platform designed for teams who value clarity, collaboration, and results.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                data-testid="hero-get-started-btn"
                size="lg"
                onClick={() => navigate('/signup')}
                className="bg-primary text-white hover:bg-primary/90 px-8 py-6 text-lg glow-hover font-medium"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                data-testid="hero-learn-more-btn"
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg border-white/10 hover:bg-white/5"
              >
                Learn More
              </Button>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative"
          >
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1761319659795-543075eaeaad?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="TaskFlow Dashboard"
                className="w-full h-[400px] object-cover opacity-60"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading mb-4">
              Everything Your Team Needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help teams collaborate efficiently and deliver results faster.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card rounded-xl border border-white/5 p-8 hover:border-white/10 transition-all duration-300 group"
                data-testid={`feature-card-${index}`}
              >
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold font-heading mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-2xl border border-white/10 p-12 text-center glow"
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join teams who've already streamlined their operations with TaskFlow.
            </p>
            <Button
              data-testid="cta-get-started-btn"
              size="lg"
              onClick={() => navigate('/signup')}
              className="bg-primary text-white hover:bg-primary/90 px-10 py-6 text-lg glow-hover font-medium"
            >
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg font-heading">T</span>
            </div>
            <span className="text-xl font-bold font-heading">TaskFlow</span>
          </div>
          <p className="text-muted-foreground">
            © 2025 TaskFlow. Built for modern teams.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;