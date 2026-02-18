import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { complaintAPI, userAPI, getStatusColor, formatDate } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import MapComponent from '../components/MapComponent';
import { 
  Plus, 
  List, 
  MapPin, 
  Award, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [mapComplaints, setMapComplaints] = useState([]);

  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('Fetching dashboard data...');
      
      const [statsResponse, complaintsResponse] = await Promise.all([
        userAPI.getStats(),
        complaintAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
      ]);

      console.log('Stats response:', statsResponse);
      console.log('Complaints response:', complaintsResponse);

      setStats(statsResponse.stats);
      setRecentComplaints(complaintsResponse.complaints);
      
      // Get complaints for map (limit to recent ones for performance)
      const mapResponse = await complaintAPI.getAll({ 
        limit: 50, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      setMapComplaints(mapResponse.complaints);
      
      console.log('Dashboard data loaded successfully');
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Refresh data when returning from other pages
  useEffect(() => {
    if (location.state?.refresh) {
      fetchDashboardData(true);
    }
  }, [location.state, fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const renderCitizenDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user.name}!</h1>
            <p className="text-primary-100 mb-4">
              Thank you for helping keep our city clean. Your contributions make a difference!
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span className="font-semibold">{user.points} Points</span>
              </div>
              <Link
                to="/submit-complaint"
                className="bg-white text-primary-600 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Report Issue
              </Link>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-md transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalComplaints || 0}</p>
              </div>
              <List className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-warning-600">{stats?.pendingComplaints || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-success-600">{stats?.resolvedComplaints || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-primary-600">{stats?.resolutionRate || 0}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/submit-complaint"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <Plus className="w-6 h-6 text-primary-600" />
              <div>
                <h4 className="font-medium text-gray-900">Report New Issue</h4>
                <p className="text-sm text-gray-600">Submit a cleanliness complaint</p>
              </div>
            </Link>

            <Link
              to="/complaints"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <List className="w-6 h-6 text-primary-600" />
              <div>
                <h4 className="font-medium text-gray-900">View My Reports</h4>
                <p className="text-sm text-gray-600">Track your submissions</p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <Award className="w-6 h-6 text-primary-600" />
              <div>
                <h4 className="font-medium text-gray-900">Rewards & Points</h4>
                <p className="text-sm text-gray-600">View your achievements</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkerDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome, {user.name}!</h1>
        <p className="text-blue-100 mb-4">
          Ready to make our city cleaner? Check your assigned tasks below.
        </p>
        <Link
          to="/worker"
          className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
        >
          View Worker Panel
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.assignedTasks || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-success-600">{stats?.completedTasks || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-primary-600">{stats?.completionRate || 0}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-purple-100 mb-4">
          Monitor and manage the city's cleanliness operations.
        </p>
        <Link
          to="/admin"
          className="bg-white text-purple-600 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
        >
          Open Admin Panel
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Reports</p>
                <p className="text-2xl font-bold text-warning-600">{stats?.activeComplaints || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                <p className="text-2xl font-bold text-success-600">{stats?.resolvedToday || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efficiency</p>
                <p className="text-2xl font-bold text-primary-600">{stats?.efficiency || 0}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Role-specific dashboard */}
      {user.role === 'CITIZEN' && renderCitizenDashboard()}
      {user.role === 'WORKER' && renderWorkerDashboard()}
      {user.role === 'ADMIN' && renderAdminDashboard()}

      {/* Common sections for all roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
          <div className="card-content">
            {recentComplaints.length > 0 ? (
              <div className="space-y-4">
                {recentComplaints.map((complaint) => (
                  <div key={complaint.id} className="flex items-start space-x-3 p-3 border border-gray-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {complaint.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {complaint.address || `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`badge badge-${getStatusColor(complaint.status)}`}>
                          {complaint.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(complaint.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <Link
                  to="/complaints"
                  className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <List className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Area Overview</h3>
          </div>
          <div className="card-content">
            <MapComponent 
              complaints={mapComplaints}
              height="300px"
              zoom={12}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;