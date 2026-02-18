import React, { useState, useEffect } from 'react';
import { adminAPI, complaintAPI, getStatusColor, formatDate } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import MapComponent from '../components/MapComponent';
import toast from 'react-hot-toast';
import { 
  Users, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Clock,
  UserCheck,
  MapPin,
  Calendar,
  Award,
  Settings
} from 'lucide-react';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [mapComplaints, setMapComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [analyticsResponse, workersResponse, complaintsResponse] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getWorkers(),
        complaintAPI.getAll({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' })
      ]);

      setAnalytics(analyticsResponse);
      setWorkers(workersResponse.workers);
      setRecentComplaints(complaintsResponse.complaints);
      
      // Get complaints for map
      const mapResponse = await complaintAPI.getAll({ 
        limit: 100, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      setMapComplaints(mapResponse.complaints);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWorker = async () => {
    if (!selectedComplaint || !selectedWorker) return;

    try {
      await adminAPI.assignWorker(selectedComplaint.id, {
        workerId: selectedWorker,
        notes: `Assigned via admin dashboard`
      });
      
      toast.success('Worker assigned successfully');
      setAssignmentModal(false);
      setSelectedComplaint(null);
      setSelectedWorker('');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to assign worker:', error);
      toast.error('Failed to assign worker');
    }
  };

  const openAssignmentModal = (complaint) => {
    setSelectedComplaint(complaint);
    setAssignmentModal(true);
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor and manage the city's cleanliness operations</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.overview?.totalComplaints || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-warning-600">
                  {analytics?.overview?.pendingComplaints || 0}
                </p>
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
                <p className="text-2xl font-bold text-success-600">
                  {analytics?.overview?.resolvedComplaints || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold text-primary-600">
                  {analytics?.overview?.resolutionRate || 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Complaints */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Recent Complaints</h3>
            </div>
            <div className="card-content">
              {recentComplaints.length > 0 ? (
                <div className="space-y-4">
                  {recentComplaints.map((complaint) => (
                    <div key={complaint.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{complaint.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <MapPin size={14} />
                              <span>{complaint.address || 'No address'}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar size={14} />
                              <span>{formatDate(complaint.createdAt)}</span>
                            </span>
                            <span>By {complaint.citizen?.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`badge badge-${getStatusColor(complaint.status)}`}>
                            {complaint.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="text-sm text-gray-600">
                          {complaint.workerAssignment ? (
                            <span>Assigned to {complaint.workerAssignment.worker.name}</span>
                          ) : (
                            <span>Not assigned</span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {complaint.status === 'PENDING' && (
                            <button
                              onClick={() => openAssignmentModal(complaint)}
                              className="btn-primary text-xs px-3 py-1"
                            >
                              Assign Worker
                            </button>
                          )}
                          <a
                            href={`/complaints/${complaint.id}`}
                            className="btn-secondary text-xs px-3 py-1"
                          >
                            View Details
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent complaints</p>
                </div>
              )}
            </div>
          </div>

          {/* Map Overview */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">City Overview</h3>
            </div>
            <div className="card-content">
              <MapComponent 
                complaints={mapComplaints}
                height="400px"
                zoom={11}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Key Metrics</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Users</span>
                  <span className="font-semibold">{analytics?.overview?.totalUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Workers</span>
                  <span className="font-semibold">{analytics?.overview?.totalWorkers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Resolution Time</span>
                  <span className="font-semibold">
                    {analytics?.overview?.avgResolutionTime || 0} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="font-semibold text-primary-600">
                    {analytics?.overview?.inProgressComplaints || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Citizens */}
          {analytics?.topCitizens?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Top Contributors</h3>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {analytics.topCitizens.map((citizen, index) => (
                    <div key={citizen.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{citizen.name}</p>
                          <p className="text-xs text-gray-500">
                            {citizen._count.complaints} reports
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <Award size={14} />
                        <span className="text-sm font-medium">{citizen.points}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Worker Performance */}
          {analytics?.workerPerformance?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Worker Performance</h3>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {analytics.workerPerformance.map((worker, index) => (
                    <div key={worker.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{worker.name}</p>
                          <p className="text-xs text-gray-500">
                            {worker.completedTasks} completed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {worker.completedTasks}
                        </p>
                        <p className="text-xs text-gray-500">tasks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <a
                  href="/complaints?status=PENDING"
                  className="block w-full btn-primary text-center"
                >
                  Review Pending
                </a>
                <a
                  href="/complaints?status=IN_PROGRESS"
                  className="block w-full btn-secondary text-center"
                >
                  Monitor Progress
                </a>
                <a
                  href="/complaints"
                  className="block w-full btn-secondary text-center"
                >
                  View All Complaints
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {assignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Assign Worker</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Complaint:</p>
              <p className="font-medium">{selectedComplaint?.title}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Worker
              </label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="input w-full"
              >
                <option value="">Choose a worker...</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} ({worker.completedTasks} completed)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleAssignWorker}
                disabled={!selectedWorker}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Worker
              </button>
              <button
                onClick={() => {
                  setAssignmentModal(false);
                  setSelectedComplaint(null);
                  setSelectedWorker('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;