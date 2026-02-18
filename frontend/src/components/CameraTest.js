import React, { useState, useRef } from 'react';
import { Camera, AlertCircle, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CameraTest = ({ onClose }) => {
  const [status, setStatus] = useState('idle'); // idle, testing, success, error
  const [errorDetails, setErrorDetails] = useState(null);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  const testCamera = async () => {
    setStatus('testing');
    setErrorDetails(null);

    try {
      console.log('=== CAMERA TEST START ===');
      
      // Check browser support
      console.log('1. Checking browser support...');
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices not supported');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }
      
      console.log('✓ Browser supports camera API');

      // Check secure context
      console.log('2. Checking secure context...');
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      
      console.log('✓ Secure context:', isSecure);
      if (!isSecure) {
        console.warn('⚠ Not in secure context - camera may not work');
      }

      // Test basic camera access
      console.log('3. Requesting camera access...');
      const testStream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      
      console.log('✓ Camera access granted');
      console.log('Stream details:', {
        id: testStream.id,
        active: testStream.active,
        tracks: testStream.getVideoTracks().length
      });

      // Test video element
      if (videoRef.current) {
        console.log('4. Testing video element...');
        videoRef.current.srcObject = testStream;
        
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = () => {
            console.log('✓ Video metadata loaded');
            videoRef.current.play()
              .then(() => {
                console.log('✓ Video playing');
                resolve();
              })
              .catch(reject);
          };
          
          videoRef.current.onerror = (error) => {
            console.error('✗ Video error:', error);
            reject(new Error('Video element error'));
          };
        });
      }

      setStream(testStream);
      setStatus('success');
      console.log('=== CAMERA TEST SUCCESS ===');
      
    } catch (error) {
      console.error('=== CAMERA TEST FAILED ===');
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      setErrorDetails({
        name: error.name,
        message: error.message,
        userAgent: navigator.userAgent,
        protocol: window.location.protocol,
        hostname: window.location.hostname
      });
      
      setStatus('error');
    }
  };

  const stopTest = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setStatus('idle');
  };

  const copyErrorDetails = () => {
    if (errorDetails) {
      const details = JSON.stringify(errorDetails, null, 2);
      navigator.clipboard.writeText(details).then(() => {
        toast.success('Error details copied to clipboard');
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Camera Test</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Status Display */}
          <div className="text-center">
            {status === 'idle' && (
              <div className="space-y-2">
                <Camera className="w-12 h-12 mx-auto text-gray-400" />
                <p className="text-gray-600">Ready to test camera access</p>
              </div>
            )}
            
            {status === 'testing' && (
              <div className="space-y-2">
                <div className="loading-spinner w-8 h-8 mx-auto"></div>
                <p className="text-blue-600">Testing camera access...</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="space-y-2">
                <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
                <p className="text-green-600">Camera test successful!</p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-2">
                <AlertCircle className="w-12 h-12 mx-auto text-red-600" />
                <p className="text-red-600">Camera test failed</p>
              </div>
            )}
          </div>

          {/* Video Preview */}
          {status === 'success' && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg"
                playsInline
                muted
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}

          {/* Error Details */}
          {status === 'error' && errorDetails && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
              <div className="text-sm text-red-700 space-y-1">
                <p><strong>Type:</strong> {errorDetails.name}</p>
                <p><strong>Message:</strong> {errorDetails.message}</p>
                <p><strong>Protocol:</strong> {errorDetails.protocol}</p>
                <p><strong>Host:</strong> {errorDetails.hostname}</p>
              </div>
              <button
                onClick={copyErrorDetails}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                Copy full details
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {status === 'idle' && (
              <button
                onClick={testCamera}
                className="flex-1 btn-primary"
              >
                Test Camera
              </button>
            )}
            
            {status === 'testing' && (
              <button
                onClick={stopTest}
                className="flex-1 btn-secondary"
              >
                Cancel Test
              </button>
            )}
            
            {status === 'success' && (
              <button
                onClick={stopTest}
                className="flex-1 btn-secondary"
              >
                Stop Test
              </button>
            )}
            
            {status === 'error' && (
              <button
                onClick={testCamera}
                className="flex-1 btn-primary"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraTest;