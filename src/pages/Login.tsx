import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@leadloom.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid place-items-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-soft p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">LeadFlow Login</h1>
          <p className="text-sm text-muted-foreground mt-1">Use demo account to continue.</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-foreground">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-input bg-background"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-foreground">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-input bg-background"
            required
          />
        </div>
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
        <p className="text-xs text-muted-foreground">Demo: demo@leadloom.com / demo123</p>
      </form>
    </div>
  );
};

export default Login;
