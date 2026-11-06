import React, { useState, useEffect } from 'react';

interface SchoolLogoProps {
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({ logoUrl, size = 'md', className = '' }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  const dimensions = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-11 h-11 text-2xl',
    lg: 'w-16 h-16 text-4xl',
    xl: 'w-24 h-24 text-6xl',
  };

  if (logoUrl && (logoUrl || '').trim() !== '' && !hasError) {
    const isHttp = logoUrl.startsWith('http://') || logoUrl.startsWith('https://');
    return (
      <img
        src={logoUrl}
        alt="Logo Sekolah"
        {...(isHttp ? { crossOrigin: 'anonymous' as const } : {})}
        className={`object-contain rounded-lg ${dimensions[size]} ${className}`}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl font-serif font-bold shadow-md shrink-0 ${dimensions[size]} ${className}`}
      style={{
        backgroundColor: '#047857',
        backgroundImage: 'linear-gradient(135deg, #059669 0%, #047857 50%, #115e59 100%)',
        color: '#fcd34d',
        border: '1.5px solid #10b981',
      }}
      title="Administrasi Qur'an (AQU)"
    >
      <span className="leading-none select-none font-arabic font-extrabold transform -translate-y-0.5" style={{ color: '#fcd34d' }}>
        أ
      </span>
    </div>
  );
};
