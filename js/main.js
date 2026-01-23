/**
 * Jazzy's Burger - Main JavaScript
 * Handles scroll animations, mobile menu, and interactions
 */

// ========================================
// SCROLL ANIMATIONS (Intersection Observer)
// ========================================

const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const fadeInObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeInObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all fade-in elements
document.addEventListener('DOMContentLoaded', () => {
  const fadeElements = document.querySelectorAll('.fade-in-up');
  fadeElements.forEach(el => fadeInObserver.observe(el));
});

// ========================================
// HEADER SCROLL EFFECT
// ========================================

const header = document.getElementById('header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  // Add shadow on scroll
  if (currentScroll > 50) {
    header.classList.add('header--scrolled');
  } else {
    header.classList.remove('header--scrolled');
  }

  lastScroll = currentScroll;
});

// ========================================
// MOBILE MENU TOGGLE
// ========================================

const menuToggle = document.getElementById('menuToggle');
const mobileNav = document.getElementById('mobileNav');

if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => {
    mobileNav.classList.toggle('is-open');
    menuToggle.classList.toggle('is-active');

    // Toggle body scroll
    document.body.style.overflow = mobileNav.classList.contains('is-open') ? 'hidden' : '';
  });

  // Close menu when clicking a link
  const mobileLinks = mobileNav.querySelectorAll('.mobile-nav__link');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('is-open');
      menuToggle.classList.remove('is-active');
      document.body.style.overflow = '';
    });
  });
}

// ========================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');

    if (href === '#') return;

    e.preventDefault();

    const target = document.querySelector(href);
    if (target) {
      const headerHeight = header.offsetHeight;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ========================================
// CUSTOMIZER LOGIC (M.R. Flow)
// ========================================

const customizerData = {
  'burgers': {
    ingredients: ['Beef Patty', 'Cheese', 'Tomato', 'Cucumber', 'Lettuce', 'Onions', 'Spicy Mayo']
  },
  'sides': {
    ingredients: [] // No customization for sides generally
  },
  'combos': {
    ingredients: ['Beef Patty', 'Cheese', 'Tomato', 'Cucumber', 'Lettuce', 'Onions', 'Spicy Mayo', 'Fries', 'Classic Drink']
  },
  'drinks': {
    ingredients: []
  }
};

const customizerDrawer = document.getElementById('customizerDrawer');
const customizerOverlay = document.getElementById('customizerOverlay');
const closeDrawerBtn = document.getElementById('closeDrawer');
const drawerContent = document.getElementById('drawerContent');
const addToOrderBtn = document.getElementById('addToOrderBtn');
const drawerPrice = document.getElementById('drawerPrice');
const cartBadge = document.querySelector('.header__cart-badge');

function openCustomizer(productName, price, category, imageUrl) {
  if (category === 'drinks' || (category === 'sides' && !productName.toLowerCase().includes('nuggets'))) {
    // Direct add to cart for simple items - passing imageUrl to fix placeholder issue
    addToCart(productName, price, [], imageUrl);
    return;
  }

  // Populate Drawer
  const ingredients = customizerData[category]?.ingredients || [];

  drawerContent.innerHTML = `
    <div class="customizer__image-container">
      <img src="${imageUrl}" alt="${productName}" class="customizer__image">
    </div>
    <h3 class="product-card__name" style="text-align: center; margin-bottom: 24px;">${productName}</h3>
    
    ${ingredients.length > 0 ? `
      <h4 class="customizer__section-title" style="margin-bottom: 8px;">SKIP THE...</h4>
      <p style="font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 16px; font-weight: var(--font-weight-medium);">Tap ingredients to remove them.</p>
      <div class="ingredient-grid">
        ${ingredients.map(ing => `
          <div class="ingredient-pill" data-ingredient="${ing}">${ing}</div>
        `).join('')}
      </div>
    ` : '<p style="text-align: center; color: var(--color-text-secondary);">No customization available for this item.</p>'}
  `;

  drawerPrice.textContent = price;

  // Toggle ingredients
  const pills = drawerContent.querySelectorAll('.ingredient-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('removed');
    });
  });

  // Open Drawer
  customizerDrawer.classList.add('active');
  customizerOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCustomizer() {
  if (customizerDrawer) customizerDrawer.classList.remove('active');
  if (customizerOverlay) customizerOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeCustomizer);
if (customizerOverlay) customizerOverlay.addEventListener('click', closeCustomizer);

// Delegate "Add to Cart" triggers
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.product-card__add-btn');
  if (!btn) return;

  const card = btn.closest('.product-card');
  const name = card.querySelector('.product-card__name').textContent;
  const price = card.querySelector('.product-card__price-value').textContent;
  const img = card.querySelector('.product-card__image').src;

  // Determine category from parent slide/container
  const categoryContainer = card.closest('[data-category]');
  const category = categoryContainer ? categoryContainer.getAttribute('data-category') : 'burgers';

  openCustomizer(name, price, category, img);
});

// ========================================
// CART LOGIC (The Box)
// ========================================

// Persist cart using localStorage
let cart = JSON.parse(localStorage.getItem('jazzy_cart') || '[]');
let appliedDiscount = JSON.parse(localStorage.getItem('jazzy_discount') || 'null');

const discountCodes = {
  'JAZZY20': { type: 'percent', value: 20, message: '20% OFF Applied!' },
  'DONJAZZY': { type: 'percent', value: 50, message: '50% VIP Discount Applied!' },
  'FIRSTORDER': { type: 'fixed', value: 2000, message: '₦2,000 OFF Applied!' },
  'LOVN100': { type: 'fixed', value: 1000, message: '₦1,000 Love Discount Applied!' },
  'CUPIDSZN': { type: 'percent', value: 14, message: '14% Cupid Season Applied!' }
};

const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const closeCartBtn = document.getElementById('closeCart');
const cartContent = document.getElementById('cartContent');
const cartFooter = document.getElementById('cartFooter');
const cartIconBtn = document.querySelector('.header__icon-btn[aria-label="View cart"]');

// Load cart on init
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderCart();
});

function saveCart() {
  localStorage.setItem('jazzy_cart', JSON.stringify(cart));
  localStorage.setItem('jazzy_discount', JSON.stringify(appliedDiscount));
}

// Recommended items for empty state
const recommendedItems = [
  { name: 'Single Beef Burger', price: '₦17,050', img: 'assets/burger-classic.png' },
  { name: 'French Fries', price: '₦3,999', img: 'assets/pill-sides.png' },
  { name: 'Pepsi (50cl)', price: '₦2,200', img: 'assets/drink-pepsi.png' }
];

function openCart() {
  renderCart();
  if (cartDrawer) cartDrawer.classList.add('active');
  if (cartOverlay) cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  if (cartDrawer) cartDrawer.classList.remove('active');
  if (cartOverlay) cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function renderCart() {
  if (!cartContent) return;

  if (cart.length === 0) {
    // Empty Box State
    cartContent.innerHTML = `
      <div class="cart-empty">
        <img src="assets/logo.png" alt="Empty Box" class="cart-empty__image">
        <p class="cart-empty__text">Your box is looking a bit light.</p>
        <div class="cart-recommended">
          <h4 class="cart-recommended__title">Start with a Classic</h4>
          ${recommendedItems.map(item => `
            <div class="recommend-card" onclick="addToCart('${item.name}', '${item.price}', [], '${item.img}')">
              <img src="${item.img}" alt="${item.name}" class="recommend-card__image">
              <div class="recommend-card__info">
                <h5 class="recommend-card__name">${item.name}</h5>
                <span class="recommend-card__price">${item.price}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    if (cartFooter) cartFooter.style.display = 'none';
  } else {
    if (cartFooter) cartFooter.style.display = 'block';
    // Active Box State
    cartContent.innerHTML = cart.map((item, index) => `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.name}" class="cart-item__image">
        <div class="cart-item__info">
          <h3 class="cart-item__name">${item.name}</h3>
          ${item.customizations && item.customizations.length > 0 ? `
            <div class="cart-item__customizations">
              ${item.customizations.map(c => `- No ${c}`).join('<br>')}
            </div>
          ` : ''}
          <div class="cart-item__pricing">
            <span class="cart-item__price">${item.price}</span>
            <div class="stepper">
              <button class="stepper__btn" onclick="updateQuantity(${index}, -1)">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <span class="stepper__count">${item.quantity}</span>
              <button class="stepper__btn" onclick="updateQuantity(${index}, 1)">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Cart Footer with Total
    const subtotal = cart.reduce((sum, item) => {
      const p = parseInt(item.price.replace(/[^\d]/g, ''));
      return sum + (p * item.quantity);
    }, 0);

    let discountAmount = 0;
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percent') {
        discountAmount = subtotal * (appliedDiscount.value / 100);
      } else if (appliedDiscount.type === 'fixed') {
        discountAmount = appliedDiscount.value;
      }
    }

    const total = subtotal - discountAmount;

    if (cartFooter) {
      cartFooter.innerHTML = `
        <div class="cart-footer__discount-section">
          ${appliedDiscount ? `
            <div class="discount-badge">
              <span>${appliedDiscount.message}</span>
              <button class="discount-badge__remove" onclick="removeDiscount()">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ` : `
            <button class="cart-footer__promo-toggle" onclick="togglePromoInput()">Have a discount code?</button>
            <div class="cart-footer__promo-input-wrapper" id="promoInputWrapper" style="display: none;">
              <input type="text" id="promoCodeInput" placeholder="Enter code" class="promo-input">
              <button class="btn btn--primary btn--sm" onclick="handleApplyPromo()">Apply</button>
            </div>
          `}
        </div>

        <div class="cart-footer__total-row">
          <span class="cart-footer__label">Subtotal</span>
          <span class="cart-footer__amount">₦${subtotal.toLocaleString()}</span>
        </div>
        ${appliedDiscount ? `
          <div class="cart-footer__total-row cart-footer__total-row--discount">
            <span class="cart-footer__label">Discount</span>
            <span class="cart-footer__amount">-₦${discountAmount.toLocaleString()}</span>
          </div>
        ` : ''}
        <div class="cart-footer__total-row cart-footer__total-row--final">
          <span class="cart-footer__label">Total</span>
          <span class="cart-footer__amount">₦${total.toLocaleString()}</span>
        </div>
        <button class="btn btn--primary btn--full">Proceed to Checkout</button>
      `;
    }
  }
}

// Discount Code Functions
window.togglePromoInput = function () {
  const wrapper = document.getElementById('promoInputWrapper');
  if (wrapper) {
    wrapper.style.display = wrapper.style.display === 'none' ? 'flex' : 'none';
    if (wrapper.style.display === 'flex') {
      const input = document.getElementById('promoCodeInput');
      if (input) input.focus();
    }
  }
};

window.handleApplyPromo = function () {
  const input = document.getElementById('promoCodeInput');
  if (!input) return;
  const code = input.value.trim().toUpperCase();

  if (discountCodes[code]) {
    appliedDiscount = discountCodes[code];
    saveCart();
    renderCart();
    showToast('Promo code applied!');
  } else {
    showToast('Invalid promo code');
  }
};

window.removeDiscount = function () {
  appliedDiscount = null;
  saveCart();
  renderCart();
  showToast('Promo code removed');
};


function addToCart(name, price, customizations = [], img = 'assets/burger-classic.png') {
  const existingItemIndex = cart.findIndex(item =>
    item.name === name && JSON.stringify(item.customizations) === JSON.stringify(customizations)
  );

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({ name, price, customizations, img, quantity: 1 });
  }

  saveCart();
  updateCartBadge();
  showToast(`${name} added to box!`);

  if (cartDrawer && cartDrawer.classList.contains('active')) {
    renderCart();
  }
}

function updateQuantity(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badges = document.querySelectorAll('.header__cart-badge');

  badges.forEach(badge => {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';

    // Trigger bounce
    badge.classList.remove('bounce');
    void badge.offsetWidth; // Force reflow
    badge.classList.add('bounce');
  });
}

// Event Listeners for Cart
if (cartIconBtn) cartIconBtn.addEventListener('click', openCart);
if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

// Update Customizer's Add to Cart to include actual logic
if (addToOrderBtn) {
  addToOrderBtn.addEventListener('click', () => {
    const name = drawerContent.querySelector('.product-card__name').textContent;
    const price = drawerPrice.textContent;
    const img = drawerContent.querySelector('.customizer__image').src;

    // Collect specific removals
    const removedIngredients = Array.from(drawerContent.querySelectorAll('.ingredient-pill.removed'))
      .map(p => p.getAttribute('data-ingredient'));

    addToCart(name, price, removedIngredients, img);
    closeCustomizer();
  });
}

// ========================================
// TOAST NOTIFICATION
// ========================================

function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  container.appendChild(toast);

  // Remove after animation completes
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ========================================
// MENU SWIPER - Moved to inline script in products.html
// ========================================

// Product slider logic removed - now handled by Swiper in index.html

// ========================================
// CONSOLE BRANDING
// ========================================

console.log(
  '%c Jazzy\'s Burger %c Built with 🍔 and ❤️ ',
  'background: #b51417; color: #FFFFFF; font-size: 16px; font-weight: bold; padding: 8px 12px; border-radius: 4px 0 0 4px;',
  'background: #1C1C1E; color: #FFFFFF; font-size: 16px; padding: 8px 12px; border-radius: 0 4px 4px 0;'
);
