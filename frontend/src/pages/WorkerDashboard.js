import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { complaintAPI, userAPI, getStatusColor, formatDate, getImageUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import MapComponent from '../components/MapComponent';
import toast from 'react-hot-toast';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar,
  Camera,
  Play,
  Upload,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, tasksResponse] = await Promise.all([
        userAPI.getStats(),
        complaintAPI.getAll({ 
          sortBy: 'createdAt', 
          sortOrder: 'desc',
          limit: 20
        })
      ]);

      setStats(statsResponse.stats);
      setAssignedTasks(tasksResponse.complaints);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      setActionLoading(true);
      await complaintAPI.updateStatus(complaintId, { 
        status: newStatus,
        notes: `Status updated to ${newStatus} by worker`
      });
      
      toast.success('Status updated successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImageUpload = async (complaintId, file, type) => {
    try {
      setActionLoading(true);
      
      if (type === 'before') {
        await complaintAPI.uploadBeforeImage(complaintId, file);
        toast.success('Before image uploaded successfully');
      } else {
        await complaintAPI.uploadAfterImage(complaintId, file);
        toast.success('After image uploaded successfully');
      }
      
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
    } finally {
      setActionLoading(false);
    }
  };

  const getTasksByStatus = (status) => {
    return assignedTasks.filter(task => task.status === status);
  };

  const canStartWork = (task) => {
    return task.status === 'ASSIGNED';
  };

  const canCompleteWork = (task) => {
    return task.status === 'IN_PROGRESS';
  };

  const hasBeforeImage = (task) => {
    return task.beforeImages && task.beforeImages.length > 0;
  };

  const hasAfterImage = (task) => {
    return task.afterImages && task.afterImages.length > 0;
  };

  if (loading) {
    return <LoadingSpinner text="Loading worker dashboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Worker Dashboard</h1>
        <p className="text-gray-600">Manage your assigned cleaning tasks</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned Tasks</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.assignedTasks || 0}
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
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-warning-600">
                  {stats?.inProgressTasks || 0}
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
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-success-600">
                  {stats?.completedTasks || 0}
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
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-primary-600">
                  {stats?.completionRate || 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Task Sections */}
      <div className="space-y-8">
        {/* Assigned Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">
              New Assignments ({getTasksByStatus('ASSIGNED').length})
            </h3>
          </div>
          <div className="card-content">
            {getTasksByStatus('ASSIGNED').length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getTasksByStatus('ASSIGNED').map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <img
                        src={getImageUrl(task.imageUrl)}
                        alt={task.title}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yOCAzMkM2MS4xMzcgMzIgNjQgMzQuODYzIDY0IDY4SDI4VjMyWiIgZmlsbD0iI0U1RTdFQiIvPgo8L3N2Zz4K';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                        
                        <div className="space-y-1 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MapPin size={14} />
                            <span className="truncate">
                              {task.address || `${task.latitude.toFixed(4)}, ${task.longitude.toFixed(4)}`}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>Assigned {formatDate(task.workerAssignment?.assignedAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <span className={`badge badge-${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <div className="flex space-x-2">
                            <a
                              href={`/complaints/${task.id}`}
                              className="btn-secondary text-xs px-3 py-1"
                            >
                              View Details
                            </a>
                            {canStartWork(task) && (
                              <button
                                onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')}
                                disabled={actionLoading}
                                className="btn-primary text-xs px-3 py-1 flex items-center space-x-1"
                              >
                                <Play size={12} />
                                <span>Start Work</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No new assignments</p>
              </div>
            )}
          </div>
        </div>

        {/* In Progress Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">
              In Progress ({getTasksByStatus('IN_PROGRESS').length})
            </h3>
          </div>
          <div className="card-content">
            {getTasksByStatus('IN_PROGRESS').length > 0 ? (
              <div className="space-y-6">
                {getTasksByStatus('IN_PROGRESS').map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Task Info */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                        
                        <div className="space-y-1 text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-1">
                            <MapPin size={14} />
                            <span>{task.address || 'No address'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>Started {formatDate(task.workerAssignment?.startedAt)}</span>
                          </div>
                        </div>

                        <img
                          src={getImageUrl(task.imageUrl)}
                          alt={task.title}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>

                      {/* Before Image */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Before Cleaning</h5>
                        {hasBeforeImage(task) ? (
                          <img
                            src={getImageUrl(task.beforeImages[0].imageUrl)}
                            alt="Before cleaning"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-32 flex flex-col items-center justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) handleImageUpload(task.id, file, 'before');
                              }}
                              className="hidden"
                              id={`before-${task.id}`}
                            />
                            <label htmlFor={`before-${task.id}`} className="cursor-pointer">
                              <Camera className="w-6 h-6 text-gray-400 mb-1" />
                              <p className="text-xs text-gray-600">Upload before image</p>
                            </label>
                          </div>
                        )}
                      </div>

                      {/* After Image */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">After Cleaning</h5>
                        {hasAfterImage(task) ? (
                          <div>
                            <img
                              src={getImageUrl(task.afterImages[0].imageUrl)}
                              alt="After cleaning"
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                            {canCompleteWork(task) && (
                              <button
                                onClick={() => handleStatusUpdate(task.id, 'RESOLVED')}
                                disabled={actionLoading}
                                className="w-full btn-success text-sm flex items-center justify-center space-x-1"
                              >
                                <CheckCircle size={16} />
                                <span>Mark Complete</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-32 flex flex-col items-center justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) handleImageUpload(task.id, file, 'after');
                              }}
                              className="hidden"
                              id={`after-${task.id}`}
                            />
                            <label htmlFor={`after-${task.id}`} className="cursor-pointer">
                              <Camera className="w-6 h-6 text-gray-400 mb-1" />
                              <p className="text-xs text-gray-600">Upload after image</p>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className={`badge badge-${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <a
                        href={`/complaints/${task.id}`}
                        className="btn-secondary text-sm"
                      >
                        View Full Details
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tasks in progress</p>
              </div>
            )}
          </div>
        </div>

        {/* Map View */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Task Locations</h3>
          </div>
          <div className="card-content">
            <MapComponent 
              complaints={assignedTasks}
              height="400px"
              zoom={12}
            />
          </div>
        </div>

        {/* Recent Completed Tasks */}
        {getTasksByStatus('RESOLVED').length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">
                Recently Completed ({getTasksByStatus('RESOLVED').length})
              </h3>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getTasksByStatus('RESOLVED').slice(0, 6).map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {hasBeforeImage(task) && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Before</p>
                          <img
                            src={getImageUrl(task.beforeImages[0].imageUrl)}
                            alt="Before"
                            className="w-full h-16 object-cover rounded"
                          />
                        </div>
                      )}
                      {hasAfterImage(task) && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">After</p>
                          <img
                            src={getImageUrl(task.afterImages[0].imageUrl)}
                            alt="After"
                            className="w-full h-16 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="badge badge-success text-xs">Completed</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(task.workerAssignment?.completedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;