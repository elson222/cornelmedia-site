/**
 * Evanex Pharmacy Online Store - Application Logic
 * Persistent Cart, Local Orders, SVG Graphic Generator, and WhatsApp Order Packaging
 */

(function() {
  // --- 1. Global Application State ---
  let state = {
    cart: JSON.parse(localStorage.getItem('evx_cart')) || [],
    orders: JSON.parse(localStorage.getItem('evx_orders')) || [],
    currentTab: 'catalog',
    activeCategory: 'all',
    searchQuery: '',
    uploadedPrescription: null, // Holds base64 data url
    couponCode: '',
    couponDiscount: 0,
    checkoutData: {
      deliveryType: 'pickup', // 'pickup' or 'delivery'
      deliveryArea: 'agona-center',
      address: '',
      name: '',
      phone: '',
      email: '',
      payment: 'cod'
    }
  };

  // Local Delivery Fee mapping in GHS
  const DELIVERY_FEES = {
    'agona-center': 10.00,  // Agona Nkwanta Center
    'busua': 20.00,         // Busua Beach area
    'dixcove': 25.00,       // Dixcove
    'takoradi': 40.00,      // Takoradi
    'tarkwa': 50.00         // Tarkwa
  };

  // Coupon configuration
  const VALID_COUPONS = {
    'EVANEX10': 0.10, // 10% Off
    'HEALTH5': 5.00   // GHS 5 Off
  };

  // --- 2. Inline Vector SVG Graphic Generator ---
  // Returns highly detailed vector representations of product categories
  function getProductSVG(type, color = '#10b981') {
    const defaultStyles = `width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"`;
    switch(type) {
      case 'pill':
        return `
          <svg ${defaultStyles}>
            <circle cx="50" cy="50" r="40" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-width="2"/>
            <path d="M30 45 L70 45" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
            <rect x="25" y="32" width="50" height="24" rx="12" stroke="${color}" stroke-width="4" fill="none"/>
            <circle cx="38" cy="44" r="3" fill="${color}"/>
            <circle cx="62" cy="44" r="3" fill="${color}"/>
            <circle cx="50" cy="44" r="3" fill="${color}"/>
          </svg>
        `;
      case 'capsule':
        return `
          <svg ${defaultStyles}>
            <circle cx="50" cy="50" r="40" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-width="2"/>
            <g transform="rotate(-45 50 50)">
              <rect x="35" y="25" width="30" height="25" rx="15" fill="${color}"/>
              <rect x="35" y="50" width="30" height="25" rx="15" stroke="${color}" stroke-width="4" fill="none"/>
              <line x1="33" y1="50" x2="67" y2="50" stroke="${color}" stroke-width="4"/>
            </g>
          </svg>
        `;
      case 'syrup':
        return `
          <svg ${defaultStyles}>
            <circle cx="50" cy="50" r="40" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-width="2"/>
            <rect x="40" y="22" width="20" height="8" rx="2" fill="${color}"/>
            <rect x="45" y="16" width="10" height="6" fill="${color}"/>
            <rect x="32" y="30" width="36" height="50" rx="6" stroke="${color}" stroke-width="4" fill="none"/>
            <path d="M36 50 L64 50" stroke="${color}" stroke-width="3"/>
            <path d="M36 58 L64 58" stroke="${color}" stroke-width="3"/>
            <path d="M36 66 L64 66" stroke="${color}" stroke-width="3"/>
            <path d="M50 38 L50 46" stroke="${color}" stroke-width="3"/>
            <path d="M46 42 L54 42" stroke="${color}" stroke-width="3"/>
          </svg>
        `;
      case 'device':
        return `
          <svg ${defaultStyles}>
            <circle cx="50" cy="50" r="40" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-width="2"/>
            <rect x="25" y="25" width="50" height="50" rx="8" stroke="${color}" stroke-width="4" fill="none"/>
            <rect x="33" y="33" width="34" height="22" rx="3" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2"/>
            <circle cx="42" cy="64" r="5" fill="${color}"/>
            <circle cx="58" cy="64" r="4" stroke="${color}" stroke-width="2"/>
            <path d="M38 44 L62 44" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
            <path d="M38 40 L54 40" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;
      case 'baby':
        return `
          <svg ${defaultStyles}>
            <circle cx="50" cy="50" r="40" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-width="2"/>
            <path d="M42 30 L58 30 L55 20 L45 20 Z" fill="${color}"/>
            <circle cx="50" cy="16" r="4" fill="${color}"/>
            <rect x="36" y="30" width="28" height="50" rx="6" stroke="${color}" stroke-width="4" fill="none"/>
            <path d="M44 45 L56 45" stroke="${color}" stroke-width="2"/>
            <path d="M44 55 L56 55" stroke="${color}" stroke-width="2"/>
            <path d="M44 65 L56 65" stroke="${color}" stroke-width="2"/>
            <path d="M50 40 L50 70" stroke="${color}" stroke-width="2" stroke-dasharray="3,3"/>
          </svg>
        `;
      default: // wellness
        return `
          <svg ${defaultStyles}>
            <circle cx="50" cy="50" r="40" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-width="2"/>
            <path d="M50 22 L50 78 M22 50 L78 50" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
            <circle cx="50" cy="50" r="16" fill="white" stroke="${color}" stroke-width="4"/>
            <path d="M50 44 L50 56 M44 50 L56 50" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
          </svg>
        `;
    }
  }

  // --- 3. View Switcher & Tabs Router ---
  function initRouting() {
    const tabs = document.querySelectorAll('[data-tab-target]');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab-target');
        switchTab(target);
      });
    });

    // Handle desktop sidebar items as well
    const sidebarItems = document.querySelectorAll('[data-sidebar-target]');
    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        const target = item.getAttribute('data-sidebar-target');
        switchTab(target);
      });
    });
  }

  function switchTab(tabId) {
    state.currentTab = tabId;
    
    // Hide all tab screens
    document.querySelectorAll('.tab-screen').forEach(screen => {
      screen.style.display = 'none';
    });

    // Show selected screen
    const activeScreen = document.getElementById(`screen-${tabId}`);
    if (activeScreen) {
      activeScreen.style.display = 'block';
      activeScreen.classList.add('animate-fade');
    }

    // Update bottom nav active state
    document.querySelectorAll('[data-tab-target]').forEach(tab => {
      if (tab.getAttribute('data-tab-target') === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update desktop sidebar active state
    document.querySelectorAll('[data-sidebar-target]').forEach(item => {
      if (item.getAttribute('data-sidebar-target') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Close checkout modals/drawers when switching tabs
    closeDrawer('checkout');

    // Run tab-specific lifecycle callbacks
    if (tabId === 'catalog') {
      renderProducts();
    } else if (tabId === 'cart') {
      renderCart();
    } else if (tabId === 'orders') {
      renderOrders();
    }
  }

  // --- 4. Product Catalog Logic ---
  function renderProducts() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    let filtered = window.STORE_PRODUCTS.filter(p => {
      const matchesCategory = state.activeCategory === 'all' || p.category === state.activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                            p.description.toLowerCase().includes(state.searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 16px; color: var(--text-muted);">
          <div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
          <p style="font-weight: 700;">No items found matching your filter</p>
          <p style="font-size: 12px;">Try adjusting your keywords or category.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(product => {
      const isRx = product.rx ? `<span class="rx-badge">💊 Rx</span>` : '';
      const isLowStock = product.stock === 'low-stock' ? `<span class="stock-badge-low">Low Stock</span>` : '';
      
      return `
        <div class="product-card">
          <div class="card-image-wrap">
            ${isRx}
            ${isLowStock}
            <div class="product-vector-art">
              ${getProductSVG(product.imageType)}
            </div>
          </div>
          <div class="card-content">
            <span class="card-dosage">${product.dosage}</span>
            <h3 class="card-title">${product.name}</h3>
            <p class="card-desc">${product.description}</p>
            <div class="card-footer">
              <span class="card-price">GHS ${product.price.toFixed(2)}</span>
              <button class="add-btn" data-add-id="${product.id}">+</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind add button click events
    document.querySelectorAll('[data-add-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pId = btn.getAttribute('data-add-id');
        addToCart(pId);
      });
    });
  }

  // Bind filter controls
  function initCatalogFilters() {
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.activeCategory = chip.getAttribute('data-category');
        renderProducts();
      });
    });

    const searchInput = document.getElementById('store-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderProducts();
      });
    }
  }

  // --- 5. Cart Management Logic ---
  function addToCart(productId) {
    const item = window.STORE_PRODUCTS.find(p => p.id === productId);
    if (!item) return;

    const existing = state.cart.find(c => c.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        rx: item.rx,
        imageType: item.imageType,
        dosage: item.dosage
      });
    }

    saveCart();
    updateCartBadges();
    
    const floatCartBtn = document.getElementById('float-cart-trigger');
    if (floatCartBtn) {
      floatCartBtn.classList.remove('animate-pulse');
      void floatCartBtn.offsetWidth;
      floatCartBtn.classList.add('animate-pulse');
    }

    showToast(`Added to cart: ${item.name}`);
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadges();
    renderCart();
  }

  function adjustQuantity(productId, delta) {
    const item = state.cart.find(c => c.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(productId);
    } else {
      saveCart();
      updateCartBadges();
      renderCart();
    }
  }

  function saveCart() {
    localStorage.setItem('evx_cart', JSON.stringify(state.cart));
  }

  function updateCartBadges() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const tabBadge = document.getElementById('cart-tab-badge');
    if (tabBadge) {
      if (totalCount > 0) {
        tabBadge.textContent = totalCount;
        tabBadge.style.display = 'block';
      } else {
        tabBadge.style.display = 'none';
      }
    }

    const floatBadge = document.getElementById('float-badge-count');
    if (floatBadge) {
      if (totalCount > 0) {
        floatBadge.textContent = totalCount;
        floatBadge.style.display = 'flex';
      } else {
        floatBadge.style.display = 'none';
      }
    }
  }

  function getCartSubtotal() {
    return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function getDeliveryFee() {
    if (state.checkoutData.deliveryType === 'pickup') return 0;
    return DELIVERY_FEES[state.checkoutData.deliveryArea] || 0;
  }

  function getCartTotal() {
    const subtotal = getCartSubtotal();
    const discount = state.couponDiscount;
    const delivery = getDeliveryFee();
    return Math.max(0, subtotal - discount + delivery);
  }

  function renderCart() {
    const cartList = document.getElementById('cart-items-list');
    const subtotalLabel = document.getElementById('summary-subtotal');
    const discountLabel = document.getElementById('summary-discount');
    const deliveryLabel = document.getElementById('summary-delivery');
    const totalLabel = document.getElementById('summary-total');
    const emptyView = document.getElementById('cart-empty-view');
    const fullView = document.getElementById('cart-full-view');

    if (!cartList) return;

    if (state.cart.length === 0) {
      if (emptyView) emptyView.style.display = 'flex';
      if (fullView) fullView.style.display = 'none';
      return;
    }

    if (emptyView) emptyView.style.display = 'none';
    if (fullView) fullView.style.display = 'block';

    cartList.innerHTML = state.cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-image">
          ${getProductSVG(item.imageType)}
        </div>
        <div class="cart-item-details">
          <span class="cart-item-dosage">${item.dosage}</span>
          <h4 class="cart-item-title">${item.name}</h4>
          <span class="cart-item-price">GHS ${item.price.toFixed(2)}</span>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-controls">
            <button class="quantity-btn minus" data-qty-id="${item.id}" data-delta="-1">-</button>
            <span class="quantity-val">${item.quantity}</span>
            <button class="quantity-btn plus" data-qty-id="${item.id}" data-delta="1">+</button>
          </div>
          <button class="delete-item-btn" data-del-id="${item.id}">🗑️</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('[data-qty-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-qty-id');
        const delta = parseInt(btn.getAttribute('data-delta'));
        adjustQuantity(id, delta);
      });
    });

    document.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-id');
        removeFromCart(id);
      });
    });

    const subtotal = getCartSubtotal();
    subtotalLabel.textContent = `GHS ${subtotal.toFixed(2)}`;
    
    if (state.couponDiscount > 0) {
      discountLabel.parentNode.style.display = 'flex';
      discountLabel.textContent = `- GHS ${state.couponDiscount.toFixed(2)}`;
    } else {
      discountLabel.parentNode.style.display = 'none';
    }

    const delivery = getDeliveryFee();
    if (delivery > 0) {
      deliveryLabel.textContent = `GHS ${delivery.toFixed(2)}`;
    } else {
      deliveryLabel.textContent = 'FREE (Store Pickup)';
    }

    totalLabel.textContent = `GHS ${getCartTotal().toFixed(2)}`;
  }

  function initCoupon() {
    const couponInput = document.getElementById('coupon-input');
    const couponBtn = document.getElementById('coupon-btn');
    if (!couponBtn) return;

    couponBtn.addEventListener('click', () => {
      const code = couponInput.value.trim().toUpperCase();
      if (VALID_COUPONS[code] !== undefined) {
        state.couponCode = code;
        const discountVal = VALID_COUPONS[code];
        const subtotal = getCartSubtotal();

        if (discountVal < 1.0) {
          state.couponDiscount = subtotal * discountVal;
        } else {
          state.couponDiscount = discountVal;
        }

        showToast(`Coupon applied successfully!`);
        renderCart();
      } else {
        showToast('Invalid coupon code!');
        state.couponCode = '';
        state.couponDiscount = 0;
        renderCart();
      }
    });
  }

  // --- 6. Checkout Process & Drawers ---
  function initCheckoutForm() {
    const deliveryTypeSelect = document.getElementById('checkout-delivery-type');
    const deliveryFields = document.getElementById('checkout-delivery-fields');
    const pickupFields = document.getElementById('checkout-pickup-fields');
    const areaSelect = document.getElementById('checkout-area');
    const checkoutForm = document.getElementById('checkout-form');

    if (!deliveryTypeSelect) return;

    deliveryTypeSelect.addEventListener('change', (e) => {
      state.checkoutData.deliveryType = e.target.value;
      if (e.target.value === 'delivery') {
        deliveryFields.style.display = 'block';
        pickupFields.style.display = 'none';
      } else {
        deliveryFields.style.display = 'none';
        pickupFields.style.display = 'block';
      }
      renderCart();
      updateCheckoutTotals();
    });

    areaSelect.addEventListener('change', (e) => {
      state.checkoutData.deliveryArea = e.target.value;
      renderCart();
      updateCheckoutTotals();
    });

    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      processOrder();
    });
  }

  function openCheckout() {
    const hasRx = state.cart.some(item => item.rx);
    const rxAlert = document.getElementById('checkout-rx-alert');
    if (rxAlert) {
      rxAlert.style.display = hasRx ? 'block' : 'none';
    }

    updateCheckoutTotals();
    openDrawer('checkout');
  }

  function updateCheckoutTotals() {
    const sub = getCartSubtotal();
    const del = getDeliveryFee();
    const disc = state.couponDiscount;
    const tot = getCartTotal();

    const checkoutSummary = document.getElementById('checkout-summary-text');
    if (checkoutSummary) {
      checkoutSummary.innerHTML = `
        Subtotal: <strong>GHS ${sub.toFixed(2)}</strong><br>
        ${disc > 0 ? `Discount: <strong>- GHS ${disc.toFixed(2)}</strong><br>` : ''}
        Delivery Fee: <strong>${del > 0 ? `GHS ${del.toFixed(2)}` : 'FREE'}</strong><br>
        <span style="font-size: 14px; display: inline-block; margin-top: 6px;">Total Amount: <strong style="color: var(--primary)">GHS ${tot.toFixed(2)}</strong></span>
      `;
    }
  }

  function openDrawer(id) {
    const overlay = document.getElementById('modal-overlay');
    const drawer = document.getElementById(`drawer-${id}`);
    if (overlay && drawer) {
      overlay.style.display = 'block';
      drawer.style.display = 'flex';
      setTimeout(() => {
        drawer.classList.add('open');
      }, 10);
    }
  }

  function closeDrawer(id) {
    const overlay = document.getElementById('modal-overlay');
    const drawer = document.getElementById(`drawer-${id}`);
    if (drawer) {
      drawer.classList.remove('open');
      setTimeout(() => {
        drawer.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
      }, 300);
    }
  }

  // --- 7. Order Execution & Success Redirect ---
  function processOrder() {
    const name = document.getElementById('checkout-name').value;
    const phone = document.getElementById('checkout-phone').value;
    const email = document.getElementById('checkout-email').value;
    const payment = document.getElementById('checkout-payment').value;
    const address = document.getElementById('checkout-address').value;
    const pickupTime = document.getElementById('checkout-pickup-time').value;

    const orderId = 'EVX-' + Math.floor(100000 + Math.random() * 900000);
    const orderDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const hasRx = state.cart.some(item => item.rx);

    const newOrder = {
      id: orderId,
      date: orderDate,
      items: [...state.cart],
      subtotal: getCartSubtotal(),
      discount: state.couponDiscount,
      deliveryFee: getDeliveryFee(),
      total: getCartTotal(),
      deliveryType: state.checkoutData.deliveryType,
      deliveryArea: state.checkoutData.deliveryArea,
      address: address,
      pickupTime: pickupTime,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      paymentMethod: payment,
      hasPrescription: hasRx,
      prescriptionImage: state.uploadedPrescription,
      status: hasRx ? 'Awaiting Rx Verification' : 'Sent to Pharmacy'
    };

    state.orders.unshift(newOrder);
    localStorage.setItem('evx_orders', JSON.stringify(state.orders));

    const whatsAppLink = buildWhatsAppLink(newOrder);
    renderSuccessScreen(newOrder, whatsAppLink);

    state.cart = [];
    saveCart();
    updateCartBadges();

    closeDrawer('checkout');
    showSuccessScreen();
  }

  function buildWhatsAppLink(order) {
    const phoneNum = '233531423368';
    
    let text = `*EVANEX PHARMACY ONLINE ORDER*\n`;
    text += `----------------------------------------\n`;
    text += `*Order ID:* ${order.id}\n`;
    text += `*Date:* ${order.date}\n`;
    text += `*Customer:* ${order.customerName}\n`;
    text += `*Phone:* ${order.customerPhone}\n`;
    text += `----------------------------------------\n`;
    text += `*ITEMS ORDERED:*\n`;
    
    order.items.forEach(item => {
      text += `- ${item.name} (${item.dosage}) x${item.quantity} - GHS ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    text += `----------------------------------------\n`;
    text += `*Subtotal:* GHS ${order.subtotal.toFixed(2)}\n`;
    if (order.discount > 0) text += `*Discount:* - GHS ${order.discount.toFixed(2)}\n`;
    text += `*Delivery:* ${order.deliveryType === 'delivery' ? `GHS ${order.deliveryFee.toFixed(2)}` : 'Pharmacy Pickup'}\n`;
    text += `*TOTAL AMOUNT:* GHS ${order.total.toFixed(2)}\n`;
    text += `----------------------------------------\n`;
    text += `*Fulfilment:* ${order.deliveryType.toUpperCase()}\n`;
    if (order.deliveryType === 'delivery') {
      text += `*Delivery Area:* ${order.deliveryArea.replace('-', ' ').toUpperCase()}\n`;
      text += `*Address:* ${order.address}\n`;
    } else {
      text += `*Pickup Time:* ${order.pickupTime}\n`;
    }
    text += `*Payment:* ${order.paymentMethod.toUpperCase()}\n`;
    
    if (order.hasPrescription) {
      text += `\n⚠️ *PRESCRIPTION ATTACHED:* Please attach a photo of your prescription when sending this message.`;
    }

    return `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`;
  }

  function renderSuccessScreen(order, whatsAppLink) {
    const container = document.getElementById('success-receipt-wrapper');
    if (!container) return;

    let itemsLines = order.items.map(item => {
      const leftPart = `${item.name.substring(0, 18)} x${item.quantity}`;
      const rightPart = `GHS ${(item.price * item.quantity).toFixed(2)}`;
      const dotsCount = Math.max(2, 38 - leftPart.length - rightPart.length);
      return `${leftPart}${'.'.repeat(dotsCount)}${rightPart}`;
    }).join('\n');

    container.innerHTML = `
      <div class="receipt-container">
        <div class="receipt-header">
          <h3 style="font-size: 14px; font-weight: 800; margin-bottom: 4px;">EVANEX PHARMACY</h3>
          <p style="font-size: 10px; color: var(--text-muted);"><span class="store-address">Agona Nkwanta, Western Region</span></p>
          <p style="font-size: 10px; color: var(--text-muted);">Opp. Ahantaman Rural Bank</p>
          <p style="font-size: 10px; color: var(--text-muted);">Tel: <span class="store-phone">053 142 3368</span></p>
        </div>
        
        <p><strong>ORDER ID:</strong> ${order.id}</p>
        <p><strong>DATE:</strong> ${order.date}</p>
        <p><strong>CLIENT:</strong> ${order.customerName}</p>
        <p><strong>PHONE:</strong> ${order.customerPhone}</p>
        <p><strong>TYPE:</strong> ${order.deliveryType.toUpperCase()}</p>
        ${order.deliveryType === 'delivery' ? `<p><strong>ADDR:</strong> ${order.address}</p>` : `<p><strong>TIME:</strong> ${order.pickupTime}</p>`}
        <p><strong>PAY:</strong> ${order.paymentMethod.toUpperCase()}</p>
        
        <div class="receipt-divider"></div>
        <p style="font-weight: bold; text-align: center; margin-bottom: 6px;">ITEMS SUMMARY</p>
        <pre style="font-family: monospace; font-size: 10px; white-space: pre-wrap; line-height: 1.4;">${itemsLines}</pre>
        
        <div class="receipt-divider"></div>
        <div style="display: flex; justify-content: space-between;"><span>SUBTOTAL:</span><span>GHS ${order.subtotal.toFixed(2)}</span></div>
        ${order.discount > 0 ? `<div style="display: flex; justify-content: space-between;"><span>DISCOUNT:</span><span>- GHS ${order.discount.toFixed(2)}</span></div>` : ''}
        <div style="display: flex; justify-content: space-between;"><span>DELIVERY:</span><span>${order.deliveryFee > 0 ? `GHS ${order.deliveryFee.toFixed(2)}` : 'FREE'}</span></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 4px;"><span>TOTAL:</span><span>GHS ${order.total.toFixed(2)}</span></div>
        
        <div class="receipt-divider"></div>
        <p style="text-align: center; font-size: 9px; color: var(--text-muted); margin-top: 6px;">Thank you for shopping at Evanex!<br>Health, Precision and Care.</p>
      </div>
    `;

    const waBtn = document.getElementById('success-whatsapp-btn');
    if (waBtn) {
      waBtn.onclick = () => {
        window.open(whatsAppLink, '_blank');
      };
    }

    const printBtn = document.getElementById('success-print-btn');
    if (printBtn) {
      printBtn.onclick = () => {
        window.print();
      };
    }
  }

  function showSuccessScreen() {
    document.getElementById('store-content-shell').style.display = 'none';
    document.getElementById('store-search-container').style.display = 'none';
    document.getElementById('store-category-scroller').style.display = 'none';
    
    const successScreen = document.getElementById('success-screen');
    successScreen.style.display = 'block';
    successScreen.classList.add('animate-fade');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeSuccessScreen() {
    document.getElementById('success-screen').style.display = 'none';

    document.getElementById('store-content-shell').style.display = 'flex';
    document.getElementById('store-search-container').style.display = 'block';
    document.getElementById('store-category-scroller').style.display = 'flex';

    switchTab('catalog');
  }

  // --- 8. Standalone Prescription Upload Handling ---
  function initPrescriptionUpload() {
    const dropzone = document.getElementById('rx-dropzone');
    const fileInput = document.getElementById('rx-file-input');
    const previewContainer = document.getElementById('rx-preview-container');
    const previewImage = document.getElementById('rx-preview-img');
    const removeBtn = document.getElementById('rx-remove-preview');
    const rxForm = document.getElementById('rx-upload-form');

    if (!dropzone) return;

    dropzone.addEventListener('click', () => {
      fileInput.click();
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary)';
        dropzone.style.backgroundColor = 'var(--primary-light)';
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border-color)';
        dropzone.style.backgroundColor = 'var(--bg-app)';
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        handleRxFile(files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleRxFile(e.target.files[0]);
      }
    });

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.uploadedPrescription = null;
      previewContainer.style.display = 'none';
      dropzone.style.display = 'flex';
      fileInput.value = '';
    });

    rxForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('rx-name').value;
      const phone = document.getElementById('rx-phone').value;
      const notes = document.getElementById('rx-notes').value;

      if (!state.uploadedPrescription) {
        showToast('Please upload a photo of your prescription first.');
        return;
      }

      const orderId = 'EVX-RX-' + Math.floor(1000 + Math.random() * 9000);
      const orderDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const newRxOrder = {
        id: orderId,
        date: orderDate,
        items: [{
          id: 'rx-uploaded',
          name: 'Direct Prescription Submission',
          price: 0,
          quantity: 1,
          rx: true,
          imageType: 'wellness',
          dosage: 'Awaiting Pharmacist Prep'
        }],
        subtotal: 0,
        discount: 0,
        deliveryFee: 0,
        total: 0,
        deliveryType: 'pickup',
        address: '',
        customerName: name,
        customerPhone: phone,
        customerEmail: '',
        paymentMethod: 'Pay at Store',
        hasPrescription: true,
        notes: notes,
        status: 'Prescription Submitted'
      };

      state.orders.unshift(newRxOrder);
      localStorage.setItem('evx_orders', JSON.stringify(state.orders));

      const waLink = buildWhatsAppRxDirectLink(newRxOrder);
      renderSuccessScreen(newRxOrder, waLink);

      state.uploadedPrescription = null;
      previewContainer.style.display = 'none';
      dropzone.style.display = 'flex';
      fileInput.value = '';
      rxForm.reset();

      showSuccessScreen();
    });
  }

  function handleRxFile(file) {
    if (!file.type.match('image.*')) {
      showToast('Please upload an image file (PNG, JPG, JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      state.uploadedPrescription = e.target.result;
      const previewContainer = document.getElementById('rx-preview-container');
      const previewImage = document.getElementById('rx-preview-img');
      const dropzone = document.getElementById('rx-dropzone');

      previewImage.src = e.target.result;
      previewContainer.style.display = 'block';
      dropzone.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  function buildWhatsAppRxDirectLink(order) {
    const phoneNum = '233531423368';
    
    let text = `*EVANEX PHARMACY PRESCRIPTION SUBMISSION*\n`;
    text += `----------------------------------------\n`;
    text += `*Submission ID:* ${order.id}\n`;
    text += `*Date:* ${order.date}\n`;
    text += `*Patient:* ${order.customerName}\n`;
    text += `*Phone:* ${order.customerPhone}\n`;
    text += `----------------------------------------\n`;
    text += `*NOTES:* ${order.notes || 'None provided'}\n`;
    text += `----------------------------------------\n`;
    text += `⚠️ *PRESCRIPTION ATTACHMENT:* Please attach the photo of the prescription when sending this WhatsApp message. The pharmacist will check availability, compile pricing, and call you shortly.\n`;

    return `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`;
  }

  // --- 9. Order History (My Orders) View ---
  function renderOrders() {
    const list = document.getElementById('orders-list');
    const emptyView = document.getElementById('orders-empty-view');
    if (!list) return;

    if (state.orders.length === 0) {
      if (emptyView) emptyView.style.display = 'flex';
      list.style.display = 'none';
      return;
    }

    if (emptyView) emptyView.style.display = 'none';
    list.style.display = 'flex';

    list.innerHTML = state.orders.map(order => {
      let itemsListStr = order.items.map(item => `${item.name} x${item.quantity}`).join(', ');
      const hasRxBadge = order.hasPrescription ? `<span style="background-color: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold;">💊 Rx Needed</span>` : '';
      
      return `
        <div class="order-history-card">
          <div class="order-history-header">
            <span class="order-code">${order.id}</span>
            <span class="order-status sent">${order.status}</span>
          </div>
          <p style="font-size: 11px; color: var(--text-muted);">${order.date}</p>
          <div class="order-items-list">
            ${itemsListStr}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px; margin-top: 4px;">
            <span style="font-weight: 850; font-size: 13px;">GHS ${order.total.toFixed(2)}</span>
            <div style="display: flex; gap: 8px;">
              ${hasRxBadge}
              <button class="submit-btn" style="padding: 6px 12px; font-size: 10px; border-radius: 6px; background-color: var(--bg-app); border: 1px solid var(--border-color); color: var(--text-main);" data-order-re-id="${order.id}">Re-Order</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('[data-order-re-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order-re-id');
        reOrder(orderId);
      });
    });
  }

  function reOrder(orderId) {
    const historical = state.orders.find(o => o.id === orderId);
    if (!historical) return;

    historical.items.forEach(histItem => {
      const existing = state.cart.find(c => c.id === histItem.id);
      if (existing) {
        existing.quantity += histItem.quantity;
      } else {
        state.cart.push({ ...histItem });
      }
    });

    saveCart();
    updateCartBadges();
    showToast(`Items from order ${orderId} added to cart.`);
    switchTab('cart');
  }

  // --- 10. Helper Toast & Modals Setup ---
  function showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.style.cssText = `
      background-color: var(--bg-surface);
      color: var(--text-main);
      border-left: 4px solid var(--primary);
      border-radius: var(--border-radius-sm);
      padding: 12px 18px;
      margin-bottom: 8px;
      font-size: 12px;
      font-weight: 700;
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      border-color: var(--primary);
      border-style: solid;
      border-width: 0 0 0 4px;
    `;

    toast.innerHTML = `
      <span>${msg}</span>
      <button style="background:none; border:none; margin-left:12px; color:var(--text-muted); cursor:pointer;">✕</button>
    `;

    toast.querySelector('button').onclick = () => {
      toast.remove();
    };

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- 11. App Initialization ---
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('toast-container')) {
      const toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        width: 300px;
        max-width: calc(100vw - 32px);
      `;
      document.body.appendChild(toastContainer);
    }

    // Dynamic Address/Phone Loader from content.json (Static Hosting compliant)
    fetch('../data/content.json')
      .then(res => res.json())
      .then(data => {
        if (data.contact) {
          document.querySelectorAll('.store-address').forEach(el => {
            el.textContent = data.contact.address || 'Agona Nkwanta, opposite Ahantaman Rural Bank';
          });
          document.querySelectorAll('.store-phone').forEach(el => {
            el.textContent = data.contact.phones || '053 142 3368';
          });
        }
      })
      .catch(err => console.log('Defaults used for contact info.', err));

    initRouting();
    initCatalogFilters();
    initCoupon();
    initCheckoutForm();
    initPrescriptionUpload();
    updateCartBadges();

    const floatCartBtn = document.getElementById('float-cart-trigger');
    if (floatCartBtn) {
      floatCartBtn.onclick = () => {
        switchTab('cart');
      };
    }

    const checkCheckoutBtn = document.getElementById('cart-checkout-btn');
    if (checkCheckoutBtn) {
      checkCheckoutBtn.onclick = () => {
        openCheckout();
      };
    }

    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.onclick = () => {
        closeDrawer('checkout');
      };
    }

    const drawerCloseBtn = document.getElementById('drawer-checkout-close');
    if (drawerCloseBtn) {
      drawerCloseBtn.onclick = () => {
        closeDrawer('checkout');
      };
    }

    const closeSuccessBtn = document.getElementById('success-done-btn');
    if (closeSuccessBtn) {
      closeSuccessBtn.onclick = () => {
        closeSuccessScreen();
      };
    }

    renderProducts();

    const storeThemeBtns = document.querySelectorAll('.store-theme-btn');
    function applySavedTheme(theme) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
      storeThemeBtns.forEach(btn => {
        btn.textContent = theme === 'light' ? '🌙' : '☀️';
      });
    }

    storeThemeBtns.forEach(btn => {
      btn.onclick = () => {
        const isDark = document.documentElement.classList.contains('dark');
        applySavedTheme(isDark ? 'light' : 'dark');
      };
    });

    const currentTheme = localStorage.getItem('theme') || 
      (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    applySavedTheme(currentTheme);
  });
})();
