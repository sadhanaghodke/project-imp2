import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, formatDate } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  User, 
  Mail, 
  Phone, 
  Award, 
  Calendar,
  TrendingUp,
  Edit,
  Save,
  X
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [statsResponse, rewardsResponse] = await Promise.all([
        userAPI.getStats(),
        userAPI.getRewards()
      ]);
      
      setStats(statsResponse.stats);
      setRewards(rewardsResponse.rewards);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      phone: user.phone || ''
    });
    setErrors({});
    setEditing(false);
  };

  if (loading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account information and view your activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {saving ? (
                        <LoadingSpinner size="sm" text="" />
                      ) : (
                        <>
                          <Save size={16} />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <X size={16} />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="card-content">
              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{user.name}</h4>
                    <p className="text-gray-600 capitalize">{user.role.toLowerCase()}</p>
                    {user.role === 'CITIZEN' && (
                      <div className="flex items-center space-x-2 mt-1">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-600">
                          {user.points} points
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {editing ? (
                      <div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`input ${errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900">{user.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{user.email}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {editing ? (
                      <div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`input ${errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter phone number"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900">
                          {user.phone || 'Not provided'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Member Since */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Since
                    </label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          {stats && (
            <div className="card mt-6">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Activity Statistics</h3>
              </div>
              <div className="card-content">
                {user.role === 'CITIZEN' ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-primary-600">{stats.totalComplaints || 0}</p>
                      <p className="text-sm text-gray-600">Total Reports</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-warning-600">{stats.pendingComplaints || 0}</p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-success-600">{stats.resolvedComplaints || 0}</p>
                      <p className="text-sm text-gray-600">Resolved</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-primary-600">{stats.resolutionRate || 0}%</p>
                      <p className="text-sm text-gray-600">Success Rate</p>
                    </div>
                  </div>
                ) : user.role === 'WORKER' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{stats.assignedTasks || 0}</p>
                      <p className="text-sm text-gray-600">Assigned Tasks</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-success-600">{stats.completedTasks || 0}</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-primary-600">{stats.completionRate || 0}%</p>
                      <p className="text-sm text-gray-600">Success Rate</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Points & Rewards (Citizens only) */}
          {user.role === 'CITIZEN' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Rewards</h3>
              </div>
              <div className="card-content">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="w-8 h-8 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{user.points}</p>
                  <p className="text-sm text-gray-600">Total Points</p>
                </div>

                {rewards.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Recent Activity</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {rewards.slice(0, 10).map((reward, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {reward.reason}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(reward.createdAt)}
                            </p>
                          </div>
                          <span className={`text-sm font-medium ${
                            reward.points > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {reward.points > 0 ? '+' : ''}{reward.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                {user.role === 'CITIZEN' && (
                  <>
                    <a
                      href="/submit-complaint"
                      className="block w-full btn-primary text-center"
                    >
                      Submit New Report
                    </a>
                    <a
                      href="/complaints"
                      className="block w-full btn-secondary text-center"
                    >
                      View My Reports
                    </a>
                  </>
                )}
                
                {user.role === 'WORKER' && (
                  <>
                    <a
                      href="/worker"
                      className="block w-full btn-primary text-center"
                    >
                      Worker Dashboard
                    </a>
                    <a
                      href="/complaints"
                      className="block w-full btn-secondary text-center"
                    >
                      View Assigned Tasks
                    </a>
                  </>
                )}
                
                {user.role === 'ADMIN' && (
                  <>
                    <a
                      href="/admin"
                      className="block w-full btn-primary text-center"
                    >
                      Admin Dashboard
                    </a>
                    <a
                      href="/complaints"
                      className="block w-full btn-secondary text-center"
                    >
                      Manage Complaints
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Account Information</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Type:</span>
                  <span className="font-medium capitalize">{user.role.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Joined:</span>
                  <span className="font-medium">{formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;