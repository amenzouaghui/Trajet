import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from './Button';

export const CameraCapture = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [photo, setPhoto] = useState(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 400, height: 400 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Erreur accès caméra:", err);
      alert("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 400;
      context.drawImage(video, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhoto(dataUrl);
      onCapture(dataUrl);
      
      // Stop stream
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setIsStreaming(false);
    }
  };

  const reset = () => {
    setPhoto(null);
    startCamera();
  };

  return (
    <div className="camera-capture flex flex-col items-center gap-4 p-4 glass mb-4">
      {!photo && !isStreaming && (
        <Button type="button" onClick={startCamera} variant="outline" fullWidth>
          <Camera size={18} className="mr-2" /> Ouvrir la caméra pour votre photo
        </Button>
      )}

      <div className="video-container relative overflow-hidden rounded-full border-4 border-primary" style={{ width: 200, height: 200 }}>
        {!photo ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
        ) : (
          <img 
            src={photo} 
            alt="Profil" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {isStreaming && (
        <Button type="button" onClick={takePhoto} fullWidth>
          <Camera size={18} className="mr-2" /> Prendre la photo
        </Button>
      )}

      {photo && (
        <div className="flex gap-2 w-full">
          <Button type="button" onClick={reset} variant="outline" className="flex-1">
            <RefreshCw size={18} className="mr-2" /> Refaire
          </Button>
          <div className="flex items-center text-success font-semibold px-4">
            <CheckCircle size={24} className="text-green-500" />
          </div>
        </div>
      )}
    </div>
  );
};
