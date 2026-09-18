/**
 * Opening Screen Experience Coordinator
 */
export function initOpeningScreen(onComplete) {
  const openingScreen = document.getElementById('opening-screen');
  const btnOpen = document.getElementById('btn-come-inside');

  if (!openingScreen || !btnOpen) return;

  btnOpen.addEventListener('click', () => {
    openingScreen.classList.add('opened');
    
    // Unlock scrolling on document
    document.body.style.overflow = 'auto';
    
    if (typeof onComplete === 'function') {
      onComplete();
    }
  }, { once: true });
}
