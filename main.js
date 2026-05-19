/**
 * Initialize core application functionality on DOM load.
 */
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Bootstrap the application by fetching settings and updating UI state.
 */
async function initApp() {
  await fetchSettings();
  updateCartCounter();
}

/**
 * Fetch global theme settings and inject them as CSS variables.
 * Handles fallback gracefully if the backend is offline (e.g., in Live Server).
 */
async function fetchSettings() {
  try {
    const response = await fetch('/api/settings');
    if (!response.ok) throw new Error('Failed to fetch settings');
    const settings = await response.json();
    
    // Apply colors to root CSS variables
    const root = document.documentElement;
    if (settings.backgroundColor) root.style.setProperty('--bg-color', settings.backgroundColor);
    if (settings.textColor) root.style.setProperty('--text-color', settings.textColor);
    if (settings.buttonColor) root.style.setProperty('--button-color', settings.buttonColor);

    // Apply YouTube URL
    const iframe = document.getElementById('brand-video');
    if (iframe && settings.youtubeUrl) {
      iframe.src = settings.youtubeUrl;
    }

    // Apply Slider Banners
    const sliderContainer = document.getElementById('hero-slider');
    if (sliderContainer && settings.sliderBanners && settings.sliderBanners.length > 0) {
      sliderContainer.innerHTML = ''; // Clear fallback
      settings.sliderBanners.forEach(bannerPath => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide';
        slide.style.backgroundImage = `url('${bannerPath}')`;
        sliderContainer.appendChild(slide);
      });
      // Basic slider logic
      let currentSlide = 0;
      const totalSlides = settings.sliderBanners.length;
      if(totalSlides > 1) {
        setInterval(() => {
          currentSlide = (currentSlide + 1) % totalSlides;
          sliderContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
        }, 5000);
      }
    }
  } catch (error) {
    console.warn('Backend offline or settings unavailable. Using default theme. Please run Node server for full dynamic functionality.');
  }
}

/**
 * Update the shopping cart counter badge from local storage.
 */
function updateCartCounter() {
  const cartCounter = document.getElementById('cart-counter');
  if (cartCounter) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cartCounter.textContent = cart.length;
  }
}

/**
 * Global utility to add items to the cart.
 * Persists data to local storage and refreshes the counter.
 * @param {Object} product - Product details
 * @param {String} variant - Selected variant string
 */
window.addToCart = function(product, variant) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.push({ product, variant });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCounter();
};
