import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '@/components/ui/button';
import axiosClient from '../api/axiosClient';
import {
  User,
  Shield,
  Key,
  ShieldAlert,
  Terminal,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  LogOut,
  Edit
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProfileUpdateForm } from '../components/forms/ProfileUpdateForm';

export const ProfilePage = () => {
  const { user, token, logout } = useAuth();
  const { showToast } = useToast();
  const [testResult, setTestResult] = useState(null);

  // Decode JWT Payload without external library
  let decodedPayload = {};
  try {
    if (token) {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      decodedPayload = JSON.parse(jsonPayload);
    }
  } catch (err) {
    decodedPayload = { error: 'Could not parse token payload' };
  }

  // Interactive test for Axios 401 Interceptor:
  // Corrupts header token to verify that the interceptor intercepts the 401 and auto-ejects the session
  const testSimulated401 = async () => {
    try {
      showToast('Dispatching test request with invalid token to trigger 401...', 'info');
      // Directly call an endpoint with invalid token override
      await axiosClient.get('/auth/me', {
        headers: {
          Authorization: 'Bearer invalid_malformed_token_12345',
        },
      });
    } catch (err) {
      setTestResult({
        status: err.status || 401,
        message: err.message,
        timestamp: new Date().toLocaleTimeString(),
      });
      showToast(`Axios Interceptor caught 401: ${err.message}`, 'error');
    }
  };

  const handleProfileUpdate = (values) => {
    showToast(`Profile updated for ${values.username}!`, 'success');
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Account & Auth Inspector</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Inspect current JWT credentials, role permissions, and test Axios interceptors
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* User Profile Card */}
        <Card title="User Identity">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 700,
              }}
            >
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{user?.username}</h3>
                <Badge variant={user?.role}>{user?.role}</Badge>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div className="flex-between">
              <span style={{ color: 'var(--text-muted)' }}>User ID (sub):</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{user?.id}</span>
            </div>
            <div className="flex-between">
              <span style={{ color: 'var(--text-muted)' }}>Assigned Role:</span>
              <strong style={{ color: 'var(--accent-primary)' }}>{user?.role}</strong>
            </div>
            <div className="flex-between">
              <span style={{ color: 'var(--text-muted)' }}>Backend Auth Scheme:</span>
              <span style={{ color: '#34d399' }}>OAuth2 Bearer JWT</span>
            </div>
          </div>
        </Card>

        {/* Role Permissions Matrix */}
        <Card title="RBAC Permission Matrix">
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            FastAPI enforces role gates using dependency <code>require_roles()</code>:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem' }}>
            <div
              className="flex-between"
              style={{
                padding: '0.625rem 0.75rem',
                background: user?.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span>Create / Delete Projects</span>
              <span style={{ color: ['admin', 'manager'].includes(user?.role) ? '#34d399' : '#fb7185', fontWeight: 600 }}>
                {['admin', 'manager'].includes(user?.role) ? 'Allowed' : 'Forbidden (403)'}
              </span>
            </div>

            <div
              className="flex-between"
              style={{
                padding: '0.625rem 0.75rem',
                background: user?.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span>Create / Delete Any Task</span>
              <span style={{ color: ['admin', 'manager'].includes(user?.role) ? '#34d399' : '#fb7185', fontWeight: 600 }}>
                {['admin', 'manager'].includes(user?.role) ? 'Allowed' : 'Forbidden (403)'}
              </span>
            </div>

            <div
              className="flex-between"
              style={{
                padding: '0.625rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span>Update Assigned Tasks Status</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>Allowed (All Roles)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Advanced Profile Settings & Form Demo */}
      <Card
        title="Advanced Profile Settings"
        subtitle="Update your profile, upload an avatar, and manage your account details"
        style={{ marginTop: '1.5rem' }}
      >
        <div className="p-4 bg-muted/20 border rounded-md flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Update Profile Information</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Multi-step form with React Hook Form, Zod Validation, and Image Upload.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Update Profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <ProfileUpdateForm onSuccess={handleProfileUpdate} defaultValues={user} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Login Activity Table Demo */}
      <Card
        title="Recent Login Activity"
        subtitle="Manage your active sessions"
        style={{ marginTop: '1.5rem' }}
      >
        <div className="rounded-md border">
          <Table>
            <TableCaption>A list of your recent logins.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Date / Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Device / Browser</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { id: 1, date: '2026-09-30 10:45 AM', loc: 'San Francisco, CA', dev: 'MacBook Pro - Chrome' },
                { id: 2, date: '2026-09-29 08:30 PM', loc: 'San Francisco, CA', dev: 'iPhone 15 - Safari' },
                { id: 3, date: '2026-09-20 02:15 PM', loc: 'New York, NY', dev: 'Windows PC - Edge' },
              ].map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.date}</TableCell>
                  <TableCell>{session.loc}</TableCell>
                  <TableCell>{session.dev}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(session.dev)}>
                          Copy Device Info
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600">
                          <LogOut className="mr-2 h-4 w-4" /> Revoke Session
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* JWT & Axios Interceptor Inspection Card */}
      <Card
        title="Live JWT Token & Interceptor Inspector"
        subtitle="Automatic token injection in Request Interceptor & 401 handling in Response Interceptor"
        style={{ marginTop: '1.5rem' }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Raw Bearer Token (Stored in LocalStorage)
          </label>
          <div
            style={{
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#38bdf8',
              wordBreak: 'break-all',
              marginTop: '0.375rem',
            }}
          >
            {token || 'No token active'}
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Decoded JWT Claims (Payload)
          </label>
          <pre
            style={{
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#a78bfa',
              marginTop: '0.375rem',
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(decodedPayload, null, 2)}
          </pre>
        </div>

        {/* Interactive Axios Interceptor Test */}
        <div
          style={{
            padding: '1rem',
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px dashed var(--accent-primary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Test Axios 401 Response Interceptor
          </h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Click below to send an unauthenticated/corrupted request to the FastAPI backend.
            The Axios response interceptor will intercept the 401, clear credentials, and broadcast an auth expiry event.
          </p>

          <Button variant="destructive" size="sm" onClick={testSimulated401}>
            Trigger Simulated 401 Interceptor Ejection
          </Button>

          {testResult && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                color: '#fb7185',
              }}
            >
              <strong>Interceptor Event Handled at {testResult.timestamp}:</strong>
              <div>Status: {testResult.status} | Detail: {testResult.message}</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
