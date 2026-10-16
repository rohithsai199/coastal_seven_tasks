import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Lock, User, Mail, Shield, Layers, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!username.trim()) newErrors.username = 'Username is required';
    if (!email.trim()) newErrors.email = 'Email address is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        role,
      });

      showToast('Registration successful! Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      setErrors({ form: err.message || 'Registration failed' });
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card animate-fade-in">
      <div className="auth-header">
        <div className="brand-icon" style={{ width: '48px', height: '48px', margin: '0 auto' }}>
          <Layers size={26} />
        </div>
        <h2>Create an Account</h2>
        <p>Join TaskFlow with Role-Based Access</p>
      </div>

      {errors.form && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fb7185',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
          }}
        >
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input
          label="Username"
          name="username"
          placeholder="e.g., johndoe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
          icon={User}
          required
        />

        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="e.g., john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          icon={Mail}
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Create secure password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          icon={Lock}
          required
        />

        {/* Role Selection */}
        <div className="form-group">
          <label htmlFor="register-role-select" className="form-label">
            <span>User Role</span>
          </label>
          <div className="form-input-wrapper">
            <span className="input-icon">
              <Shield size={16} />
            </span>
            <select
              id="register-role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="form-select has-icon"
            >
              <option value="member">Member (View & manage assigned tasks)</option>
              <option value="manager">Manager (Create projects & assign tasks)</option>
              <option value="admin">Admin (Full administrative privileges)</option>
            </select>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          <span>Complete Registration</span>
          <ArrowRight size={16} />
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        Already registered?{' '}
        <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
          Sign In
        </Link>
      </div>
    </div>
  );
};
