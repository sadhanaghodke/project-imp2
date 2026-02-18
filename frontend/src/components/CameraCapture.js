import React, { useState, useRef, useCallback } from 'react';
import { Camera, RotateCcw, Check, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Test camera permissions
const testCameraPermissions = async () => {
  try {
    console.log('Testing camera permissions...');
    
    // Check if API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia API not supported');
    }
    
    // Test basic camera access
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log('Camera test successful:', stream);
    
    // Stop the test stream immediately
    stream.getTracks().forEach(track => track.stop());
    
    return { success: true, message: 'Camera access granted' };
  } catch (error) {
    console.error('Camera test failed:', error);
    return { success: false, error: error.name, message: error.message };
  }
};

const CameraCapture = ({ onCapture, onCancel }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front, 'environment' for back
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      console.log('Starting camera with facingMode:', facingMode);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Stop existing stream if any
      if (streamRef.current) {
        console.log('Stopping existing stream');
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      console.log('Requesting camera access with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted, stream:', stream);
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          videoRef.current.play().then(() => {
            console.log('Video playing successfully');
            setIsStreaming(true);
          }).catch(playError => {
            console.error('Error playing video:', playError);
            toast.error('Failed to start video playback');
          });
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Unable to access camera. ';
      
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage += 'Please allow camera permissions and try again.';
          break;
        case 'NotFoundError':
          errorMessage += 'No camera found on this device.';
          break;
        case 'NotReadableError':
          errorMessage += 'Camera is already in use by another application.';
          break;
        case 'OverconstrainedError':
          errorMessage += 'Camera does not support the requested settings.';
          break;
        case 'SecurityError':
          errorMessage += 'Camera access blocked due to security restrictions.';
          break;
        default:
          errorMessage += error.message || 'Unknown error occurred.';
      }
      
      toast.error(errorMessage);
      
      // Try fallback with basic constraints
      if (facingMode === 'environment') {
        console.log('Trying fallback with user camera');
        setFacingMode('user');
      } else {
        console.log('Trying fallback with basic constraints');
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = basicStream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            videoRef.current.play();
            setIsStreaming(true);
            toast.success('Camera started with basic settings');
          }
        } catch (fallbackError) {
          console.error('Fallback camera access failed:', fallbackError);
        }
      }
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage({ blob, url: imageUrl });
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
      setCapturedImage(null);
    }
    startCamera();
  }, [capturedImage, startCamera]);

  const confirmCapture = useCallback(() => {
    if (capturedImage && onCapture) {
      // Create File object from blob
      const file = new File([capturedImage.blob], 'camera-capture.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      onCapture(file);
      
      // Cleanup
      URL.revokeObjectURL(capturedImage.url);
      setCapturedImage(null);
    }
  }, [capturedImage, onCapture]);

  const handleCancel = useCallback(() => {
    stopCamera();
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
      setCapturedImage(null);
    }
    if (onCancel) {
      onCancel();
    }
  }, [stopCamera, capturedImage, onCancel]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Start camera when component mounts
  React.useEffect(() => {
    // Check if we're on HTTPS or localhost
    const isSecureContext = window.location.protocol === 'https:' || 
                           window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
    
    if (!isSecureContext) {
      toast.error('Camera requires HTTPS or localhost. Please use a secure connection.');
      return;
    }
    
    console.log('Component mounted, starting camera');
    startCamera();
    
    return () => {
      console.log('Component unmounting, stopping camera');
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage.url);
      }
    };
  }, [startCamera, stopCamera, capturedImage]);

  // Restart camera when facing mode changes
  React.useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
  }, [facingMode, isStreaming, startCamera]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-md mx-auto">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <h3 className="text-white text-lg font-semibold">
            {capturedImage ? 'Review Photo' : 'Take Photo'}
          </h3>
          <button
            onClick={handleCancel}
            className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative w-full h-full flex items-center justify-center">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Camera Controls */}
              {isStreaming && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-6">
                  {/* Switch Camera */}
                  <button
                    onClick={switchCamera}
                    className="p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                  >
                    <RotateCcw size={20} />
                  </button>
                  
                  {/* Capture Button */}
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    <Camera size={24} className="mx-auto text-gray-600" />
                  </button>
                  
                  {/* Placeholder for symmetry */}
                  <div className="w-12 h-12"></div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Captured Image Preview */}
              <img
                src={capturedImage.url}
                alt="Captured"
                className="w-full h-full object-cover"
              />
              
              {/* Review Controls */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-6">
                {/* Retake */}
                <button
                  onClick={retakePhoto}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                >
                  <RotateCcw size={16} />
                  <span>Retake</span>
                </button>
                
                {/* Confirm */}
                <button
                  onClick={confirmCapture}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full bg-primary-600 text-white hover:bg-primary-700"
                >
                  <Check size={16} />
                  <span>Use Photo</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Loading State */}
        {!isStreaming && !capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-sm mx-auto px-4">
              <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
              <p className="mb-4">Starting camera...</p>
              <div className="text-sm text-gray-300 space-y-2">
                <p>If the camera doesn't start:</p>
                <ul className="text-left space-y-1">
                  <li>• Check browser permissions</li>
                  <li>• Make sure no other app is using the camera</li>
                  <li>• Try refreshing the page</li>
                </ul>
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={async () => {
                    const result = await testCameraPermissions();
                    if (result.success) {
                      toast.success(result.message);
                      startCamera();
                    } else {
                      toast.error(`Camera test failed: ${result.message}`);
                    }
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Test Camera
                </button>
                <button
                  onClick={() => {
                    console.log('Manual camera start requested');
                    startCamera();
                  }}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;