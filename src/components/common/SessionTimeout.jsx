import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

// Strict session timeout config: 5 minutes of inactivity
const TIMEOUT_MS = 5 * 60 * 1000;

export default function SessionTimeout() {
  const { logout, showToast, user } = useApp();
  
  const lastEventTimeRef = useRef(0);
  const checkIntervalRef = useRef(null);

  if (!user) return null;

  useEffect(() => {
    // 1. Initialize activity timestamp on mount
    localStorage.setItem('sirian_last_activity', Date.now().toString());

    // 2. Throttle event listener to update last activity
    const updateActivity = () => {
      const now = Date.now();
      // Throttle localStorage writes to once every 1 second
      if (now - lastEventTimeRef.current > 1000) {
        localStorage.setItem('sirian_last_activity', now.toString());
        lastEventTimeRef.current = now;
      }
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'click', 'touchstart'];
    events.forEach(event => window.addEventListener(event, updateActivity, { passive: true }));

    // 3. Periodic check loop (every 1s)
    checkIntervalRef.current = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('sirian_last_activity') || '0', 10);
      const now = Date.now();
      const elapsed = now - lastActivity;

      if (elapsed >= TIMEOUT_MS) {
        clearInterval(checkIntervalRef.current);
        logout();
        showToast('You have been logged out due to inactivity.', 'warning');
      }
    }, 1000);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [user, logout, showToast]);

  return null;
}
