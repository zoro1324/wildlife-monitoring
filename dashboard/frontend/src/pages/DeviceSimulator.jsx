import { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Send, CheckCircle, AlertCircle, Image, Trash2, RefreshCw } from 'lucide-react';
import { Card, Button, Select, Badge } from '../components/ui';
import { detectionsAPI } from '../services/api';
import { useApp } from '../context/AppContext';

function DeviceSimulator() {
  const { cameras, refreshData } = useApp();
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!selectedDevice && cameras.length === 1) {
      setSelectedDevice(cameras[0].id);
    }
  }, [cameras, selectedDevice]);

  const deviceOptions = [
    { value: '', label: 'Select a device...' },
    ...cameras.map((cam) => ({ 
      value: cam.id, 
      label: `${cam.id} ${cam.owner ? `(Owner: ${cam.owner})` : '(Unassigned)'}` 
    })),
  ];

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }

      setSelectedImage(file);
      setError(null);
      setResult(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setCountdown(0);
    setIsCapturing(false);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const waitForVideoReady = (video, timeoutMs = 2500) =>
    new Promise((resolve, reject) => {
      if (!video) {
        reject(new Error('Camera not ready'));
        return;
      }
      const start = Date.now();
      const checkReady = () => {
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          resolve();
          return;
        }
        if (Date.now() - start >= timeoutMs) {
          reject(new Error('Camera not ready'));
          return;
        }
        requestAnimationFrame(checkReady);
      };
      checkReady();
    });

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        await waitForVideoReady(videoRef.current);
      }
      setIsCameraActive(true);
    } catch (err) {
      if (err?.message === 'Camera not ready') {
        setError('Camera not ready. Please try again.');
      } else {
        setError('Unable to access camera. Please allow camera permission.');
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    try {
      await waitForVideoReady(video);
    } catch (err) {
      setError('Camera not ready. Please try again.');
      setIsCapturing(false);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Failed to capture image');
        setIsCapturing(false);
        return;
      }
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(blob));
      setResult(null);
      setError(null);
      setIsCapturing(false);
      setCountdown(0);
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleTakePicture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCountdown(3);
    await startCamera();
  };

  useEffect(() => {
    if (!isCapturing || !isCameraActive) return;
    if (countdown <= 0) {
      void captureFrame();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, isCapturing, isCameraActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);


  const handleUpload = async () => {
    if (!selectedDevice) {
      setError('Please select a device');
      return;
    }
    let imageFile = selectedImage;
    if (!imageFile && imagePreview) {
      try {
        const blob = await fetch(imagePreview).then((res) => res.blob());
        imageFile = new File([blob], `capture-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
        setSelectedImage(imageFile);
      } catch (err) {
        setError('Please select an image');
        return;
      }
    }
    if (!imageFile) {
      setError('Please select an image');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await detectionsAPI.uploadImage(selectedDevice, imageFile);
      setResult(response);
      
      // Refresh data to show new detection
      await refreshData();
      
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };


  const getRiskBadge = (animalType) => {
    const dangerAnimals = ['Tiger', 'Lion', 'Leopord', 'Human'];
    const warningAnimals = ['Elephant', 'Bear', 'Wild Boar'];
    
    if (dangerAnimals.includes(animalType)) {
      return <Badge variant="danger">High Risk</Badge>;
    }
    if (warningAnimals.includes(animalType)) {
      return <Badge variant="warning">Medium Risk</Badge>;
    }
    return <Badge variant="success">Low Risk</Badge>;
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
            Device Simulator
          </h1>
          <p className="text-gray-600 mt-1">
            Simulate ESP32 device image capture for testing
          </p>
        </div>
        <Button
          variant="ghost"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={refreshData}
        >
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-forest-100 rounded-lg">
                <Camera className="w-6 h-6 text-forest-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Capture Simulation</h2>
                <p className="text-sm text-gray-500">Upload an image as if from an ESP32 camera</p>
              </div>
            </div>

            {/* Device Selection */}
            <Select
              label="Select Device"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              options={deviceOptions}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capture or Upload Image
              </label>

              {!imagePreview ? (
                <div className="space-y-3">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-forest-500 hover:bg-forest-50 transition-colors"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Take a picture or upload an image</p>
                    <p className="text-gray-400 text-sm mt-1">PNG, JPG up to 10MB</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={handleTakePicture}
                      leftIcon={<Camera className="w-4 h-4" />}
                    >
                      Take Picture
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={<Upload className="w-4 h-4" />}
                    >
                      Upload Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <button
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
                    {selectedImage?.name}
                  </div>
                </div>
              )}

              {isCameraActive && !imagePreview && (
                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover rounded-xl bg-black"
                      muted
                      playsInline
                    />
                    {countdown > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/70 text-white text-4xl font-bold rounded-full w-20 h-20 flex items-center justify-center">
                          {countdown}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCapturing(false);
                        setCountdown(0);
                        stopCamera();
                      }}
                      disabled={countdown > 0}
                    >
                      Stop Camera
                    </Button>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Upload Button */}
            <Button
              className="w-full"
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={!selectedDevice || (!selectedImage && !imagePreview)}
              leftIcon={<Send className="w-4 h-4" />}
            >
              {isUploading ? 'Processing...' : 'Send to Server'}
            </Button>
          </div>
        </Card>

        {/* Result Section */}
        <Card>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Image className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Detection Result</h2>
                <p className="text-sm text-gray-500">YOLO classification output</p>
              </div>
            </div>

            {result ? (
              <div className="space-y-4">
                {result.status === 'success' ? (
                  <>
                    {/* Success Header */}
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Animal Detected!</span>
                    </div>

                    {/* Detection Image - Show annotated image with bounding boxes */}
                    {result.data?.annotated_image_url && (
                      <div className="rounded-xl overflow-hidden">
                        <img
                          src={result.data.annotated_image_url}
                          alt="Detection with Bounding Box"
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}

                    {/* Detection Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Animal Type</p>
                        <p className="text-xl font-bold text-gray-900">{result.data?.animal_type}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Confidence</p>
                        <p className="text-xl font-bold text-gray-900">{result.data?.confidence_percentage}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Device</p>
                        <p className="font-medium text-gray-900">{result.data?.device_id}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Risk Level</p>
                        {getRiskBadge(result.data?.animal_type)}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Detected At</p>
                      <p className="font-medium text-gray-900">
                        {new Date(result.data?.timestamp).toLocaleString()}
                      </p>
                    </div>

                    {/* Alert Info */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-amber-800">📢 Notifications Sent</p>
                      <p className="text-xs text-amber-700 mt-1">
                        WhatsApp alerts sent to nearby users. Device owner notified via phone call.
                      </p>
                    </div>
                  </>
                ) : result.status === 'no_detection' ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900">No Animal Detected</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      The YOLO model could not identify any animals in this image.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>{result.error || 'Unknown error occurred'}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Image className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="font-medium text-gray-600">No Results Yet</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Upload an image to see YOLO classification results
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-forest-700 font-bold text-sm">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Select Device</p>
              <p className="text-sm text-gray-500">Choose which ESP32 device to simulate</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-forest-700 font-bold text-sm">2</span>
            </div>
            <div>
                <p className="font-medium text-gray-900">Upload Image</p>
                <p className="text-sm text-gray-500">Select an image of wildlife</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-forest-700 font-bold text-sm">3</span>
            </div>
            <div>
                <p className="font-medium text-gray-900">Detection & Alerts</p>
                <p className="text-sm text-gray-500">Server runs AI detection and notifies users</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DeviceSimulator;
