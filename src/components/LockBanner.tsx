import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { LockState } from '../types';

interface LockBannerProps {
  lockState: LockState;
}

export const LockBanner: React.FC<LockBannerProps> = ({ lockState }) => {
  if (lockState.tamperDetected) {
    return (
      <div className="bg-red-950/70 border border-red-500/50 rounded-xl p-4 text-red-200 flex items-start space-x-3 shadow-lg shadow-red-950/50">
        <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-pulse" />
        <div>
          <h4 className="font-semibold text-red-100 flex items-center gap-2">
            Storage Tampering Detected — Failsafe Lockdown Active
          </h4>
          <p className="text-sm text-red-300/90 mt-1">
            The cryptographic HMAC verification failed on local storage. An unauthorized file modification on your PC was detected. All blocks remain strictly enforced to preserve focus integrity.
          </p>
        </div>
      </div>
    );
  }

  return null;
};
