/* ─────────────────────────────────────────
   script.js — Peanut Roll Landing Page
   ───────────────────────────────────────── */

// ── API config ─────────────────────────────────────────────────
const API = 'https://unopprobrious-jason-demonstrational.ngrok-free.dev';
const HEADERS = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
};

// ── State ──────────────────────────────────────────────────────
let qty = 1;
let orderCount = 0;

// ── DOM refs ───────────────────────────────────────────────────
const sheet = document.getElementById('sheet');
const overlay = document.getElementById('overlay');
const orderList = document.getElementById('order-list');
const ordersSection = document.getElementById('orders-section');
const qtyDisplay = document.getElementById('qty-display');
const qtyInput = document.getElementById('order-quantity');
const nameInput = document.getElementById('order-name');
const submitBtn = document.getElementById('submit-btn');
const toast = document.getElementById('toast');
const toastDot = document.getElementById('toast-dot');
const toastTitle = document.getElementById('toast-title');
const toastMsg = document.getElementById('toast-msg');
const confirmDialog = document.getElementById('confirm-dialog');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');

// ── Toast ──────────────────────────────────────────────────────
let toastTimer;

function showToast(title, msg, isError = false) {
    toastDot.className = 'toast-dot' + (isError ? ' error' : '');
    toastTitle.textContent = title;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// ── Bottom sheet ───────────────────────────────────────────────
function openSheet() {
    sheet.classList.add('open');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    setTimeout(() => nameInput.focus(), 400);
}

function closeSheet() {
    sheet.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
}

// ── Quantity stepper ───────────────────────────────────────────
function changeQty(delta) {
    qty = Math.max(1, qty + delta);
    qtyDisplay.textContent = qty;
    qtyInput.value = qty;
}

// ── Cart badge ─────────────────────────────────────────────────
function updateBadge(count) {
    // Badge removed with cart icon - keeping function for compatibility
}

// ── HTML escape helper ─────────────────────────────────────────
function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Render one order card ──────────────────────────────────────
function renderOrderCard(order, prepend = false) {
    ordersSection.style.display = '';

    const id = order.id || order._id || ('ORD-' + (++orderCount).toString().padStart(3, '0'));
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
    <div>
      <div class="order-name">${escHtml(order.name)}</div>
      <div class="order-meta">Order #${id}</div>
    </div>
    <div class="order-qty">&#215;${order.quantity}</div>
  `;

    // Long press to show confirmation dialog
    let pressTimer;

    card.addEventListener('pointerdown', () => {
        pressTimer = setTimeout(() => {
            showCancelConfirmation(order.id || order._id, card);
        }, 1000);
    });

    card.addEventListener('pointerup', () => {
        clearTimeout(pressTimer);
    });

    card.addEventListener('pointercancel', () => {
        clearTimeout(pressTimer);
    });

    card.addEventListener('pointerleave', () => {
        clearTimeout(pressTimer);
    });

    if (prepend) {
        orderList.insertBefore(card, orderList.firstChild);
    } else {
        orderList.appendChild(card);
    }
}

// ── Show cancel confirmation dialog ────────────────────────────
function showCancelConfirmation(orderId, cardElement) {
    confirmDialog.style.display = 'flex';
    document.querySelector('.confirm-title').textContent = 'Cancel Order?';
    document.querySelector('.confirm-message').textContent = 'Are you sure you want to cancel this order?';

    const handleYes = async () => {
        confirmDialog.style.display = 'none';
        confirmYes.removeEventListener('click', handleYes);
        confirmNo.removeEventListener('click', handleNo);

        // Show second confirmation
        showSecondConfirmation(orderId, cardElement);
    };

    const handleNo = () => {
        confirmDialog.style.display = 'none';
        confirmYes.removeEventListener('click', handleYes);
        confirmNo.removeEventListener('click', handleNo);
    };

    confirmYes.addEventListener('click', handleYes);
    confirmNo.addEventListener('click', handleNo);
}

// ── Show second confirmation dialog ────────────────────────────
function showSecondConfirmation(orderId, cardElement) {
    confirmDialog.style.display = 'flex';
    document.querySelector('.confirm-title').textContent = 'sure na jud ka?';
    document.querySelector('.confirm-message').textContent = 'Mag mahay ka.';

    const handleYes = async () => {
        confirmDialog.style.display = 'none';
        confirmYes.removeEventListener('click', handleYes);
        confirmNo.removeEventListener('click', handleNo);

        // Actually cancel the order
        await cancelOrder(orderId, cardElement);
    };

    const handleNo = () => {
        confirmDialog.style.display = 'none';
        confirmYes.removeEventListener('click', handleYes);
        confirmNo.removeEventListener('click', handleNo);
    };

    confirmYes.addEventListener('click', handleYes);
    confirmNo.addEventListener('click', handleNo);
}

// ── Cancel order ───────────────────────────────────────────────
async function cancelOrder(orderId, cardElement) {
    try {
        const res = await fetch(`${API}/api/peanut-roll/${orderId}`, {
            method: 'DELETE',
            headers: HEADERS
        });

        if (!res.ok) {
            showToast('Error', 'Could not cancel order', true);
            return;
        }

        // Fade out and remove
        cardElement.style.transition = 'opacity 0.3s ease';
        cardElement.style.opacity = '0';
        setTimeout(() => {
            cardElement.remove();
            if (orderList.children.length === 0) {
                ordersSection.style.display = 'none';
            }
        }, 300);

        showToast('Order cancelled', 'Order has been removed', false);
    } catch (err) {
        console.error('Cancel order error:', err);
        showToast('Error', 'Could not cancel order', true);
    }
}

// ── Load orders from server ────────────────────────────────────
async function loadOrders() {
    try {
        const res = await fetch(`${API}/api/peanut-roll`, { headers: HEADERS });
        const data = await res.json();

        orderList.innerHTML = '';
        orderCount = 0;

        const orders = Array.isArray(data) ? data : (data.data || data.orders || []);
        if (orders.length === 0) return;

        ordersSection.style.display = '';
        orders.forEach(order => renderOrderCard(order, false));
        updateBadge(orders.length);
    } catch (err) {
        // Silent fail — don't block the UI if the server is unreachable on load
        console.error('loadOrders failed:', err.message);
    }
}

// ── Submit order ───────────────────────────────────────────────
async function submitOrder() {
    const name = nameInput.value.trim();
    const quantity = parseInt(qtyInput.value, 10) || qty;

    if (!name) {
        showToast('Missing info', 'Please enter your name.', true);
        nameInput.focus();
        return;
    }

    if (!quantity || quantity < 1) {
        showToast('Missing info', 'Please enter a valid quantity.', true);
        return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${API}/api/peanut-roll`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({ name, quantity })
        });

        if (!res.ok) {
            throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        if (data.success || res.ok) {
            showToast('Order placed! 🎉', `${name} — ×${quantity} pack${quantity > 1 ? 's' : ''}`, false);

            // Optimistically add the card immediately
            const newId = data.id || data._id || data.orderId || ('#' + Date.now());
            renderOrderCard({ name, quantity, id: newId }, true);
            updateBadge(document.querySelectorAll('.order-card').length);

            // Reset form
            nameInput.value = '';
            qty = 1;
            qtyDisplay.textContent = '1';
            qtyInput.value = '1';
            closeSheet();

            // Sync with server after a short delay
            setTimeout(loadOrders, 800);

        } else {
            showToast('Error', data.message || 'Could not process payment.', true);
        }

    } catch (err) {
        console.error('Order submission error:', err);
        showToast('Connection error', err.message || 'Could not reach the server.', true);
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// ── Event listeners ────────────────────────────────────────────
document.getElementById('order-now-btn').addEventListener('click', openSheet);
document.getElementById('close-btn').addEventListener('click', closeSheet);
document.getElementById('overlay').addEventListener('click', closeSheet);
document.getElementById('qty-minus').addEventListener('click', () => changeQty(-1));
document.getElementById('qty-plus').addEventListener('click', () => changeQty(1));
document.getElementById('submit-btn').addEventListener('click', submitOrder);

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSheet();
});

// ── Init ───────────────────────────────────────────────────────
console.log('API URL:', API);
console.log('Testing connection to:', `${API}/api/peanut-roll`);
loadOrders();