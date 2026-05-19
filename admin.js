/**
 * Initialize Admin Dashboard on DOM load.
 */
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadAdminData();
    setupForms();
});

/**
 * Handle tab navigation between admin panels.
 */
function setupNavigation() {
    const navButtons = document.querySelectorAll('.admin-nav button');
    const panels = document.querySelectorAll('.admin-panel');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });
}

/**
 * Load all necessary data for the admin dashboard.
 */
async function loadAdminData() {
    await fetchSettings();
    await fetchInventory();
    await fetchOrders();
}

/**
 * Fetch and populate global settings (Theme, YouTube, Banners).
 */
async function fetchSettings() {
    try {
        const res = await fetch('/api/settings');
        const settings = await res.json();
        
        // Populate Theme Pickers
        if(settings.backgroundColor) document.getElementById('bg-color-picker').value = settings.backgroundColor;
        if(settings.textColor) document.getElementById('text-color-picker').value = settings.textColor;
        if(settings.buttonColor) document.getElementById('btn-color-picker').value = settings.buttonColor;

        // Populate YouTube
        if(settings.youtubeUrl) document.getElementById('youtube-url-input').value = settings.youtubeUrl;

        // Populate Banners
        const bannerList = document.getElementById('banner-list');
        bannerList.innerHTML = '';
        if (settings.sliderBanners) {
            settings.sliderBanners.forEach(banner => {
                const div = document.createElement('div');
                div.style = 'border: 1px solid #ddd; padding: 0.5rem; text-align: center;';
                div.innerHTML = `
                    <img src="${banner}" style="width: 150px; height: auto; display: block; margin-bottom: 0.5rem;">
                    <button class="delete-banner" data-path="${banner}" style="background: red; color: white; border: none; padding: 0.2rem 0.5rem; cursor: pointer;">Delete</button>
                `;
                bannerList.appendChild(div);
            });

            document.querySelectorAll('.delete-banner').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const path = e.target.dataset.path;
                    await fetch('/admin-api/settings/banners', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bannerPath: path })
                    });
                    fetchSettings();
                });
            });
        }
    } catch (error) {
        console.error('Error fetching settings:', error);
    }
}

/**
 * Fetch and populate the inventory matrix.
 */
async function fetchInventory() {
    try {
        const res = await fetch('/api/products');
        const products = await res.json();
        const tbody = document.querySelector('#inventory-table tbody');
        tbody.innerHTML = '';

        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.title}</td>
                <td>${p.category}</td>
                <td>Rs. ${p.price}</td>
                <td>${p.variants.length}</td>
                <td>
                    <button class="delete-product" data-id="${p._id}" style="background: red; color: white; border: none; padding: 0.3rem 0.8rem; cursor: pointer;">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if(confirm('Are you sure you want to delete this product?')) {
                    await fetch(`/admin-api/products/${id}`, { method: 'DELETE' });
                    fetchInventory();
                }
            });
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
    }
}

/**
 * Fetch and populate the chronological order ledger.
 */
async function fetchOrders() {
    try {
        const res = await fetch('/admin-api/orders');
        const orders = await res.json();
        const tbody = document.querySelector('#ledger-table tbody');
        tbody.innerHTML = '';

        orders.forEach(o => {
            const date = new Date(o.timestamp).toLocaleString();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date}</td>
                <td>${o.customerName}</td>
                <td>${o.phoneNumber}</td>
                <td>${o.shippingAddress}</td>
                <td>${o.city}</td>
                <td>${o.orderedProductName}</td>
                <td>${o.chosenVariant}</td>
                <td>Rs. ${o.totalPrice}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

/**
 * Initialize event listeners for all admin forms (CRUD operations).
 */
function setupForms() {
    // 1. Global Theme Form
    document.getElementById('theme-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            backgroundColor: document.getElementById('bg-color-picker').value,
            textColor: document.getElementById('text-color-picker').value,
            buttonColor: document.getElementById('btn-color-picker').value,
        };
        await fetch('/admin-api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        alert('Theme updated successfully.');
    });

    // YouTube Form
    document.getElementById('youtube-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            youtubeUrl: document.getElementById('youtube-url-input').value
        };
        await fetch('/admin-api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        alert('YouTube video updated.');
    });

    // Banner Upload Form
    document.getElementById('banner-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('banner-upload');
        if (fileInput.files.length === 0) return;

        const formData = new FormData();
        formData.append('banner', fileInput.files[0]);

        await fetch('/admin-api/settings/banners', {
            method: 'POST',
            body: formData
        });
        alert('Banner uploaded.');
        fileInput.value = '';
        fetchSettings();
    });

    // Add Product Form
    document.getElementById('add-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', document.getElementById('prod-title').value);
        formData.append('description', document.getElementById('prod-desc').value);
        formData.append('price', document.getElementById('prod-price').value);
        formData.append('category', document.getElementById('prod-category').value);
        
        const variants = document.getElementById('prod-variants').value;
        if(variants) {
            formData.append('variants', variants);
        }

        const files = document.getElementById('prod-images').files;
        for(let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }

        try {
            const res = await fetch('/admin-api/products', {
                method: 'POST',
                body: formData
            });
            if(res.ok) {
                alert('Product created successfully.');
                document.getElementById('add-product-form').reset();
                fetchInventory();
            } else {
                alert('Failed to create product.');
            }
        } catch (error) {
            console.error(error);
        }
    });
}
