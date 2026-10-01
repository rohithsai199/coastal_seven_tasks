import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Lock, User, Layers, ArrowRight, Shield, UserCheck } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after successful login
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await login(username.trim(), password);
      showToast(`Welcome back, ${username}!`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick switch credentials helper for evaluation
  const handleQuickLogin = (userVal, passVal) => {
    setUsername(userVal);
    setPassword(passVal);
    // Automatically submit after a brief pause so user sees the form fill
    setTimeout(() => {
      login(userVal, passVal)
        .then(() => {
          showToast(`Logged in as ${userVal}!`, 'success');
          navigate(from, { replace: true });
        })
        .catch((err) => {
          setError(err.message || 'Failed quick login');
        });
    }, 150);
  };

  return (
    <div className="auth-card animate-fade-in">
      {/* Brand Header */}
      <div className="auth-header">
        <div
          className="brand-icon"
          style={{ width: '48px', height: '48px', margin: '0 auto' }}
        >
          <Layers size={26} />
        </div>
        <h2>Sign In to TaskFlow</h2>
        <p>JWT-Authenticated FastAPI & React Router Application</p>
      </div>

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fb7185',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>{error}</span>
        </div>
      )}

      {/* Controlled Login Form */}
      <form onSubmit={handleSubmit}>
        <Input
          label="Username"
          name="username"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          icon={User}
          required
          autoFocus
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={Lock}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          <span>Sign In</span>
          <ArrowRight size={16} />
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
          Create account
        </Link>
      </div>

      {/* One-Click Demo Role Accounts for Testing RBAC & Protected Routes */}
      <div className="quick-logins">
        <div className="quick-logins-title">Quick Demo Login (Pre-seeded Accounts)</div>
        <div className="quick-login-grid">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickLogin('admin', 'admin123')}
            style={{ fontSize: '0.75rem', padding: '0.4rem' }}
            title="Role: admin (Full CRUD + Project Management)"
          >
            <Shield size={12} color="#a78bfa" />
            <span>Admin</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickLogin('manager', 'manager123')}
            style={{ fontSize: '0.75rem', padding: '0.4rem' }}
            title="Role: manager (Manage projects & tasks)"
          >
            <Shield size={12} color="#818cf8" />
            <span>Manager</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickLogin('sanjay', 'sanjay123')}
            style={{ fontSize: '0.75rem', padding: '0.4rem' }}
            title="Role: member (View & update assigned tasks)"
          >
            <UserCheck size={12} color="#94a3b8" />
            <span>Sanjay</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
