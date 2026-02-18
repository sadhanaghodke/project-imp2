import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { complaintAPI, getStatusColor, getStatusText, formatDate, getImageUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ComplaintsList = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'title', label: 'Title' },
    { value: 'status', label: 'Status' }
  ];

  useEffect(() => {
    fetchComplaints();
  }, [filters, pagination.currentPage]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.currentPage,
        limit: 10,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const response = await complaintAPI.getAll(params);
      setComplaints(response.complaints);
      setPagination(response.pagination);
      
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  const getPageTitle = () => {
    switch (user.role) {
      case 'CITIZEN':
        return 'My Reports';
      case 'WORKER':
        return 'Assigned Tasks';
      case 'ADMIN':
        return 'All Complaints';
      default:
        return 'Complaints';
    }
  };

  const getEmptyMessage = () => {
    switch (user.role) {
      case 'CITIZEN':
        return 'You haven\'t submitted any reports yet.';
      case 'WORKER':
        return 'No tasks assigned to you yet.';
      case 'ADMIN':
        return 'No complaints in the system yet.';
      default:
        return 'No complaints found.';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{getPageTitle()}</h1>
        <p className="text-gray-600">
          {user.role === 'CITIZEN' && 'Track the status of your submitted reports'}
          {user.role === 'WORKER' && 'View and manage your assigned cleaning tasks'}
          {user.role === 'ADMIN' && 'Monitor and manage all complaints in the system'}
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search complaints..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input pl-10 appearance-none"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="input"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  Sort by {option.label}
                </option>
              ))}
            </select>

            {/* Sort Order */}
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="input"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSpinner text="Loading complaints..." />
      ) : complaints.length > 0 ? (
        <>
          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalCount)} of {pagination.totalCount} results
            </p>
          </div>

          {/* Complaints Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="card hover:shadow-md transition-shadow">
                <div className="card-content">
                  <div className="flex items-start space-x-4">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={getImageUrl(complaint.imageUrl)}
                        alt={complaint.title}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yOCAzMkM2MS4xMzcgMzIgNjQgMzQuODYzIDY0IDY4SDI4VjMyWiIgZmlsbD0iI0U1RTdFQiIvPgo8L3N2Zz4K';
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {complaint.title}
                        </h3>
                        <span className={`badge badge-${getStatusColor(complaint.status)} ml-2`}>
                          {getStatusText(complaint.status)}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {complaint.description}
                      </p>

                      <div className="space-y-2">
                        {/* Location */}
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin size={14} className="mr-1" />
                          <span className="truncate">
                            {complaint.address || `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={14} className="mr-1" />
                          <span>Submitted {formatDate(complaint.createdAt)}</span>
                        </div>

                        {/* Citizen info (for workers and admins) */}
                        {(user.role === 'WORKER' || user.role === 'ADMIN') && complaint.citizen && (
                          <div className="text-sm text-gray-500">
                            Reported by: {complaint.citizen.name}
                          </div>
                        )}

                        {/* Worker info (for citizens and admins) */}
                        {(user.role === 'CITIZEN' || user.role === 'ADMIN') && complaint.workerAssignment?.worker && (
                          <div className="text-sm text-gray-500">
                            Assigned to: {complaint.workerAssignment.worker.name}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <Link
                          to={`/complaints/${complaint.id}`}
                          className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          <Eye size={14} />
                          <span>View Details</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="btn-secondary flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-md text-sm font-medium ${
                          pageNum === pagination.currentPage
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="btn-secondary flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
          <p className="text-gray-600 mb-6">{getEmptyMessage()}</p>
          {user.role === 'CITIZEN' && (
            <Link to="/submit-complaint" className="btn-primary">
              Submit Your First Report
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplaintsList;