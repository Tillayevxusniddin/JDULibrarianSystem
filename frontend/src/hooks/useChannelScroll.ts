// src/hooks/useChannelScroll.ts

import { useEffect } from 'react';
import { useScrollControl } from '../contexts/ScrollContext';

/**
 * Custom hook for channel pages that need to disable main layout scrolling
 * and manage their own internal scrolling behavior
 */
export const useChannelScroll = () => {
  const { setDisableMainScroll } = useScrollControl();

  useEffect(() => {
    // Disable main layout scrolling when component mounts
    setDisableMainScroll(true);

    // Re-enable main layout scrolling when component unmounts
    return () => {
      setDisableMainScroll(false);
    };
  }, [setDisableMainScroll]);
};
