'use client';

import { useEffect } from 'react';

/**
 * OAuth callback page — the new Enoki wallet uses popup-based auth,
 * so this page just closes the popup window when the provider redirects back.
 */
export default function AuthCallback() {
  useEffect(() => {
    // The popup opener polls this window's URL for the auth token.
    // Once the Enoki wallet reads it, the popup closes automatically.
    // If somehow the user lands here in the main window, redirect home.
    const isPopup = window.opener && window.opener !== window;
    if (!isPopup) {
      window.location.replace('/');
    }
  }, []);

  return (
    <div className="auth-callback">
      <p>Authenticating...</p>
    </div>
  );
}
