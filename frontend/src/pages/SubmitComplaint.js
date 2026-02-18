import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintAPI } from '../services/api';
import CameraCapture from '../components/CameraCapture';
import CameraTest from '../components/CameraTest';
import MapComponent from '../components/MapComponent';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  Camera, 
  MapPin, 
  Upload, 
  X, 
  AlertCircle,
  CheckCircle,
  Send,
  Settings
} from 'lucide-react';

const SubmitComplaint = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    latitude: null,
    longitude: null,
    address: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showCameraTest, setShowCameraTest] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Image, 2: Location, 3: Details

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setSelectedLocation(location);
          setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng
          }));
          
          // Reverse geocode to get address
          reverseGeocode(location.lat, location.lng);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          toast.error('Unable to get your location. Please select manually on the map.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      // Using a simple reverse geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setFormData(prev => ({
          ...prev,
          address: data.display_name
        }));
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
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

  const handleImageCapture = (file) => {
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setShowCamera(false);
    setStep(2); // Move to location step
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }
      
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setStep(2); // Move to location step
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng
    }));
    
    // Reverse geocode the selected location
    reverseGeocode(location.lat, location.lng);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedImage) {
      newErrors.image = 'Please capture or upload an image';
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.location = 'Please select a location on the map';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('image', selectedImage);
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('latitude', formData.latitude);
      submitData.append('longitude', formData.longitude);
      if (formData.address) {
        submitData.append('address', formData.address);
      }

      const response = await complaintAPI.create(submitData);
      
      toast.success('Complaint submitted successfully!');
      navigate('/dashboard', { state: { refresh: true } });
      
    } catch (error) {
      console.error('Submit error:', error);
      const message = error.response?.data?.message || 'Failed to submit complaint';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    setStep(1);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((stepNumber) => (
          <React.Fragment key={stepNumber}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= stepNumber 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step > stepNumber ? (
                <CheckCircle size={16} />
              ) : (
                <span className="text-sm font-medium">{stepNumber}</span>
              )}
            </div>
            {stepNumber < 3 && (
              <div className={`w-12 h-0.5 ${
                step > stepNumber ? 'bg-primary-600' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderImageStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Capture Evidence</h2>
        <p className="text-gray-600">
          Take a photo of the cleanliness issue you want to report
        </p>
      </div>

      {!selectedImage ? (
        <div className="space-y-4">
          {/* Camera Test Button */}
          <div className="text-center mb-4">
            <button
              onClick={() => setShowCameraTest(true)}
              className="inline-flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
            >
              <Settings size={14} />
              <span>Test Camera</span>
            </button>
          </div>

          {/* Camera Capture Button */}
          <button
            onClick={() => setShowCamera(true)}
            className="w-full flex items-center justify-center space-x-3 p-6 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <Camera className="w-8 h-8 text-primary-600" />
            <div className="text-left">
              <p className="font-medium text-primary-600">Use Camera</p>
              <p className="text-sm text-gray-600">Recommended for best results</p>
            </div>
          </button>

          {/* File Upload Alternative */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="w-full flex items-center justify-center space-x-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Upload className="w-8 h-8 text-gray-600" />
              <div className="text-left">
                <p className="font-medium text-gray-600">Upload from Device</p>
                <p className="text-sm text-gray-500">Select an existing photo</p>
              </div>
            </label>
          </div>

          {errors.image && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle size={16} />
              <span>{errors.image}</span>
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Selected"
              className="w-full max-w-md mx-auto rounded-lg shadow-md"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="text-center">
            <button
              onClick={() => setStep(2)}
              className="btn-primary"
            >
              Continue to Location
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderLocationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Location</h2>
        <p className="text-gray-600">
          Confirm or adjust the location where the issue was found
        </p>
      </div>

      <div className="space-y-4">
        <MapComponent
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          clickable={true}
          height="400px"
          center={selectedLocation}
          zoom={15}
        />

        {formData.address && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Detected Address:</p>
            <p className="font-medium text-gray-900">{formData.address}</p>
          </div>
        )}

        {errors.location && (
          <p className="text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle size={16} />
            <span>{errors.location}</span>
          </p>
        )}

        <div className="flex space-x-4">
          <button
            onClick={() => setStep(1)}
            className="btn-secondary flex-1"
          >
            Back to Image
          </button>
          <button
            onClick={() => setStep(3)}
            disabled={!selectedLocation}
            className="btn-primary flex-1"
          >
            Continue to Details
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Provide Details</h2>
        <p className="text-gray-600">
          Add a title and description to help us understand the issue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`input ${errors.title ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
            placeholder="Brief description of the issue"
            maxLength={100}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.title.length}/100 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            className={`textarea ${errors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
            placeholder="Provide more details about the cleanliness issue..."
            maxLength={500}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Address (optional) */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address (Optional)
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="input"
            placeholder="Street address or landmark"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="btn-secondary flex-1"
          >
            Back to Location
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" text="" />
            ) : (
              <>
                <Send size={16} />
                <span>Submit Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {renderStepIndicator()}
      
      <div className="card">
        <div className="card-content">
          {step === 1 && renderImageStep()}
          {step === 2 && renderLocationStep()}
          {step === 3 && renderDetailsStep()}
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleImageCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}

      {/* Camera Test Modal */}
      {showCameraTest && (
        <CameraTest
          onClose={() => setShowCameraTest(false)}
        />
      )}
    </div>
  );
};

export default SubmitComplaint;