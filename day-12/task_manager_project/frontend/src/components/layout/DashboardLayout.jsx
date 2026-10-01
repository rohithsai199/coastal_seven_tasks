import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

/**
 * Dashboard Layout Component
 * Demonstrates React Router v6 nested routes pattern with <Outlet />
 */
export const DashboardLayout = () => {
  return (
    <div className="app-layout">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <Navbar />
        <main className="content-body">
          {/* Nested child routes are rendered here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
