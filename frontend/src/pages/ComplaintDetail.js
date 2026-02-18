import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { complaintAPI, getStatusColor, getStatusText, formatDate, getImageUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import MapComponent from '../components/MapComponent';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  Camera, 
  Star,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
  const [beforeImageFile, setBeforeImageFile] = useState(null);
  const [afterImageFile, setAfterImageFile] = useState(null);

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const response = await complaintAPI.getById(id);
      setComplaint(response.complaint);
    } catch (error) {
      console.error('Failed to fetch complaint:', error);
      toast.error('Failed to load complaint details');
      navigate('/complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus, notes = '') => {
    try {
      setActionLoading(true);
      await complaintAPI.updateStatus(id, { status: newStatus, notes });
      toast.success('Status updated successfully');
      fetchComplaint(); // Refresh data
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    try {
      setActionLoading(true);
      
      if (type === 'before') {
        await complaintAPI.uploadBeforeImage(id, file);
        toast.success('Before image uploaded successfully');
      } else {
        await complaintAPI.uploadAfterImage(id, file);
        toast.success('After image uploaded successfully');
      }
      
      fetchComplaint(); // Refresh data
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await complaintAPI.submitFeedback(id, feedback);
      toast.success('Feedback submitted successfully');
      setShowFeedbackForm(false);
      fetchComplaint(); // Refresh data
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setActionLoading(false);
    }
  };

  const canUpdateStatus = () => {
    return user.role === 'WORKER' && complaint?.workerAssignment?.workerId === user.id;
  };

  const canUploadImages = () => {
    return user.role === 'WORKER' && complaint?.workerAssignment?.workerId === user.id;
  };

  const canProvideFeedback = () => {
    return user.role === 'CITIZEN' && 
           complaint?.citizenId === user.id && 
           complaint?.status === 'RESOLVED' &&
           !complaint?.feedbacks?.length;
  };

  if (loading) {
    return <LoadingSpinner text="Loading complaint details..." />;
  }

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Complaint Not Found</h1>
          <button onClick={() => navigate('/complaints')} className="btn-primary">
            Back to Complaints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/complaints')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Complaints</span>
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{complaint.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <Calendar size={16} />
                <span>Submitted {formatDate(complaint.createdAt)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <User size={16} />
                <span>By {complaint.citizen.name}</span>
              </span>
            </div>
          </div>
          <span className={`badge badge-${getStatusColor(complaint.status)} text-lg px-4 py-2`}>
            {getStatusText(complaint.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Image */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Original Report</h3>
            </div>
            <div className="card-content">
              <img
                src={getImageUrl(complaint.imageUrl)}
                alt={complaint.title}
                className="w-full rounded-lg mb-4"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE4My4xMzcgMTAwIDE4NiAxMDIuODYzIDE4NiAxMzZIMTUwVjEwMFoiIGZpbGw9IiNFNUU3RUIiLz4KPC9zdmc+Cg==';
                }}
              />
              <p className="text-gray-700">{complaint.description}</p>
            </div>
          </div>

          {/* Before/After Images */}
          {(complaint.beforeImages?.length > 0 || complaint.afterImages?.length > 0 || canUploadImages()) && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Work Progress</h3>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Before Images */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Before Cleaning</h4>
                    {complaint.beforeImages?.length > 0 ? (
                      <div className="space-y-3">
                        {complaint.beforeImages.map((image, index) => (
                          <img
                            key={index}
                            src={getImageUrl(image.imageUrl)}
                            alt="Before cleaning"
                            className="w-full rounded-lg"
                          />
                        ))}
                      </div>
                    ) : canUploadImages() ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleImageUpload(file, 'before');
                          }}
                          className="hidden"
                          id="before-image"
                        />
                        <label htmlFor="before-image" className="cursor-pointer">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Upload before image</p>
                        </label>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No before image uploaded</p>
                    )}
                  </div>

                  {/* After Images */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">After Cleaning</h4>
                    {complaint.afterImages?.length > 0 ? (
                      <div className="space-y-3">
                        {complaint.afterImages.map((image, index) => (
                          <img
                            key={index}
                            src={getImageUrl(image.imageUrl)}
                            alt="After cleaning"
                            className="w-full rounded-lg"
                          />
                        ))}
                      </div>
                    ) : canUploadImages() ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleImageUpload(file, 'after');
                          }}
                          className="hidden"
                          id="after-image"
                        />
                        <label htmlFor="after-image" className="cursor-pointer">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Upload after image</p>
                        </label>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No after image uploaded</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Section */}
          {complaint.feedbacks?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Citizen Feedback</h3>
              </div>
              <div className="card-content">
                {complaint.feedbacks.map((fb, index) => (
                  <div key={index} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < fb.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        by {fb.citizen?.name} on {formatDate(fb.createdAt)}
                      </span>
                    </div>
                    {fb.comment && (
                      <p className="text-gray-700">{fb.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Form */}
          {canProvideFeedback() && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Provide Feedback</h3>
              </div>
              <div className="card-content">
                {!showFeedbackForm ? (
                  <button
                    onClick={() => setShowFeedbackForm(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <MessageSquare size={16} />
                    <span>Rate This Resolution</span>
                  </button>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setFeedback(prev => ({ ...prev, rating }))}
                            className="p-1"
                          >
                            <Star
                              size={24}
                              className={rating <= feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comment (Optional)
                      </label>
                      <textarea
                        value={feedback.comment}
                        onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                        className="textarea"
                        rows={3}
                        placeholder="Share your thoughts about the resolution..."
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="btn-primary"
                      >
                        {actionLoading ? <LoadingSpinner size="sm" text="" /> : 'Submit Feedback'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowFeedbackForm(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Location */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Location</h3>
            </div>
            <div className="card-content">
              <div className="mb-4">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">
                      {complaint.address || 'No address provided'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
              <MapComponent
                complaints={[complaint]}
                center={{ lat: complaint.latitude, lng: complaint.longitude }}
                height="200px"
                zoom={15}
              />
            </div>
          </div>

          {/* Status Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Status Timeline</h3>
            </div>
            <div className="card-content">
              <div className="status-timeline">
                <div className={`status-timeline-item ${complaint.status !== 'PENDING' ? 'completed' : 'active'}`}>
                  <div className="ml-4">
                    <h4 className="font-medium text-gray-900">Submitted</h4>
                    <p className="text-sm text-gray-600">{formatDate(complaint.createdAt)}</p>
                  </div>
                </div>
                
                {complaint.workerAssignment && (
                  <div className={`status-timeline-item ${['IN_PROGRESS', 'RESOLVED'].includes(complaint.status) ? 'completed' : complaint.status === 'ASSIGNED' ? 'active' : ''}`}>
                    <div className="ml-4">
                      <h4 className="font-medium text-gray-900">Assigned</h4>
                      <p className="text-sm text-gray-600">
                        To {complaint.workerAssignment.worker.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(complaint.workerAssignment.assignedAt)}
                      </p>
                    </div>
                  </div>
                )}
                
                {complaint.workerAssignment?.startedAt && (
                  <div className={`status-timeline-item ${complaint.status === 'RESOLVED' ? 'completed' : complaint.status === 'IN_PROGRESS' ? 'active' : ''}`}>
                    <div className="ml-4">
                      <h4 className="font-medium text-gray-900">Work Started</h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(complaint.workerAssignment.startedAt)}
                      </p>
                    </div>
                  </div>
                )}
                
                {complaint.workerAssignment?.completedAt && (
                  <div className="status-timeline-item completed">
                    <div className="ml-4">
                      <h4 className="font-medium text-gray-900">Completed</h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(complaint.workerAssignment.completedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Worker Actions */}
          {canUpdateStatus() && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Actions</h3>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {complaint.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleStatusUpdate('IN_PROGRESS')}
                      disabled={actionLoading}
                      className="w-full btn-primary flex items-center justify-center space-x-2"
                    >
                      <Clock size={16} />
                      <span>Start Work</span>
                    </button>
                  )}
                  
                  {complaint.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleStatusUpdate('RESOLVED')}
                      disabled={actionLoading}
                      className="w-full btn-success flex items-center justify-center space-x-2"
                    >
                      <CheckCircle size={16} />
                      <span>Mark as Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Details</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority:</span>
                  <span className="font-medium">
                    {complaint.priority === 1 ? 'Low' :
                     complaint.priority === 2 ? 'Medium' :
                     complaint.priority === 3 ? 'High' :
                     complaint.priority === 4 ? 'Critical' : 'Emergency'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">{formatDate(complaint.updatedAt)}</span>
                </div>
                {complaint.citizen && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reported by:</span>
                    <span className="font-medium">{complaint.citizen.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;