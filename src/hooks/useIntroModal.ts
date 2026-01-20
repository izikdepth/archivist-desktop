import { useState, useEffect } from 'react';

const INTRO_SHOWN_KEY = 'archivist_intro_shown';

export function useIntroModal() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const hasShown = localStorage.getItem(INTRO_SHOWN_KEY);
    if (!hasShown) {
      setShowIntro(true);
    }
  }, []);

  return {
    showIntro,
    hideIntro: () => setShowIntro(false),
  };
}
