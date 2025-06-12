import React, { useState, useEffect } from 'react';

const MedicationImage = ({ src, alt, className = "" }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleImageLoad = () => {
    setIsImageLoading(false);
    setHasError(false);
    console.log(`✅ Image loaded: ${src}`);
  };

  const handleImageError = (e) => {
    console.error(`❌ Error loading image: ${src}`, e);
    setHasError(true);
    setIsImageLoading(false);
  };

  useEffect(() => {
    console.log(`🖼️ MedicationImage: src="${src}", alt="${alt}"`);
    setImageSrc(src);
    setHasError(false);
    setIsImageLoading(!!src);
  }, [src]);

  // If no src or empty
  if (!src || src === 'null' || src === 'undefined' || src === '') {
    console.log(`❌ No valid image for: ${alt}`);
    return (
      <div className={`medication-image-placeholder d-flex align-items-center justify-content-center ${className}`} 
           style={{ backgroundColor: '#f8f9fa', border: '2px dashed #dee2e6', borderRadius: '8px' }}>
        <div className="text-center">
          <i className="bi bi-capsule fs-1 text-muted"></i>
          <div className="small text-muted mt-2">No image</div>
        </div>
      </div>
    );
  }

  // If error loading image
  if (hasError) {
    console.log(`❌ Image error for: ${alt}`);
    return (
      <div className={`medication-image-placeholder d-flex align-items-center justify-content-center ${className}`} 
           style={{ backgroundColor: '#fff3cd', border: '2px dashed #ffc107', borderRadius: '8px' }}>
        <div className="text-center">
          <i className="bi bi-exclamation-triangle fs-1 text-warning"></i>
          <div className="small text-muted mt-2">Error loading</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`position-relative ${className}`}>
      {isImageLoading && (
        <div className="position-absolute top-50 start-50 translate-middle">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      <img 
        src={imageSrc} 
        alt={alt} 
        className={`medication-image w-100 h-100 rounded ${isImageLoading ? 'opacity-25' : 'opacity-100'}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
        style={{ 
          objectFit: 'contain',
          transition: 'opacity 0.3s ease',
          border: '1px solid #dee2e6'
        }}
      />
    </div>
  );
};

export default MedicationImage;