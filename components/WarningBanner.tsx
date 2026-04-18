'use client';

interface WarningBannerProps {
  message: string;
}

export function WarningBanner({ message }: WarningBannerProps) {
  return (
    <div className="transfer-warning">
      <i className="ri-alert-line" style={{ fontSize: 16 }} />
      <span>{message}</span>
    </div>
  );
}
