// Application state for the current product view
let currentProduct = null;
let selectedSize = null;
let selectedColor = null;

/**
 * Initialize Product Detail Page.
 * Parses the product ID from the URL and fetches data.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        await fetchAndRenderProduct(productId);
    } else {
        document.getElementById('product-container').innerHTML = '<h2>Product not found</h2>';
    }

    setupModalLogic();
});

/**
 * Fetch product details from the backend and trigger rendering.
 * @param {String} id - Product ID
 */
async function fetchAndRenderProduct(id) {
    try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found or backend offline.');
        currentProduct = await res.json();
        
        renderProductUI(currentProduct);
    } catch (error) {
        document.getElementById('product-container').innerHTML = '<h2>Error loading product</h2>';
        console.error('Error fetching product:', error);
    }
}

/**
 * Render the product UI, including media gallery and dynamic variant swatches.
 * @param {Object} product - The fetched product object
 */
function renderProductUI(product) {
    const container = document.getElementById('product-container');
    
    // Extract unique sizes and colors available across all variants
    const sizes = [...new Set(product.variants.map(v => v.size))];
    const colors = [...new Set(product.variants.map(v => v.color))];

    // Default selections
    if (sizes.length > 0) selectedSize = sizes[0];
    if (colors.length > 0) selectedColor = colors[0];

    const imgUrl = product.images && product.images.length > 0 ? product.images[0] : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="%23eee"/></svg>';

    container.innerHTML = `
        <div class="product-gallery">
            <img src="${imgUrl}" alt="${product.title}" id="main-product-image">
        </div>
        <div class="product-info">
            <h1>${product.title}</h1>
            <!-- Vanilla JS Reactive Pricing -->
            <div class="price-display" id="product-price">Rs. ${product.price.toLocaleString()}</div>
            <p>${product.description}</p>
            
            <div class="variant-selector">
                <label>Size</label>
                <div class="swatch-container" id="size-swatches">
                    ${sizes.map(size => `<div class="swatch ${size === selectedSize ? 'selected' : ''}" data-size="${size}">${size}</div>`).join('')}
                </div>
            </div>

            <div class="variant-selector">
                <label>Color</label>
                <div class="swatch-container" id="color-swatches">
                    ${colors.map(color => `<div class="swatch ${color === selectedColor ? 'selected' : ''}" data-color="${color}">${color}</div>`).join('')}
                </div>
            </div>

            <button class="btn" id="order-now-btn" style="margin-top: 1rem;">Order Now</button>
        </div>
    `;

    attachVariantListeners();
    document.getElementById('order-now-btn').addEventListener('click', openOrderModal);
}

/**
 * Bind event listeners to size and color swatches for reactive updates.
 */
function attachVariantListeners() {
    const sizeSwatches = document.querySelectorAll('#size-swatches .swatch');
    sizeSwatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
            sizeSwatches.forEach(s => s.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedSize = e.target.dataset.size;
            updateReactivity();
        });
    });

    const colorSwatches = document.querySelectorAll('#color-swatches .swatch');
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
            colorSwatches.forEach(s => s.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedColor = e.target.dataset.color;
            updateReactivity();
        });
    });
}

/**
 * Update pricing and button state dynamically based on selected variant.
 * Enforces the reactive pricing rule without page reload.
 */
function updateReactivity() {
    const priceEl = document.getElementById('product-price');
    
    // Validate if the currently selected variant combination exists in inventory
    const variantExists = currentProduct.variants.find(v => v.size === selectedSize && v.color === selectedColor);
    
    if (variantExists) {
        priceEl.textContent = `Rs. ${currentProduct.price.toLocaleString()}`;
        document.getElementById('order-now-btn').disabled = false;
        document.getElementById('order-now-btn').textContent = 'Order Now';
    } else {
        priceEl.textContent = 'Out of Stock';
        document.getElementById('order-now-btn').disabled = true;
        document.getElementById('order-now-btn').textContent = 'Unavailable Combination';
    }
}

/**
 * Initialize event listeners for the Direct Order Pop-Up Modal.
 */
function setupModalLogic() {
    const modal = document.getElementById('order-modal');
    const closeBtn = document.getElementById('close-modal');
    const form = document.getElementById('checkout-form');

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Close when clicking outside content
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    form.addEventListener('submit', handleCheckoutSubmit);
}

/**
 * Open the order modal and populate the invoice summary.
 */
function openOrderModal() {
    if (!currentProduct) return;
    
    const subtotal = currentProduct.price;
    document.getElementById('invoice-subtotal').textContent = `Rs. ${subtotal.toLocaleString()}`;
    document.getElementById('invoice-total').textContent = `Rs. ${subtotal.toLocaleString()}`;
    
    document.getElementById('order-modal').classList.add('active');
}

/**
 * Handle checkout form submission to the backend API.
 */
async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    const payload = {
        customerName: document.getElementById('fullname').value,
        phoneNumber: document.getElementById('phone').value,
        shippingAddress: document.getElementById('address').value,
        city: document.getElementById('city').value,
        orderedProductName: currentProduct.title,
        chosenVariant: `Size: ${selectedSize}, Color: ${selectedColor}`,
        totalPrice: currentProduct.price
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Order placed successfully! We will process it shortly.');
            document.getElementById('order-modal').classList.remove('active');
            document.getElementById('checkout-form').reset();
        } else {
            alert('Failed to place order. Please try again.');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('An error occurred during checkout.');
    }
}
