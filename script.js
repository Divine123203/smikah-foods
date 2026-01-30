// Initialize AOS
AOS.init({
    duration: 1000,
    once: true,
    offset: 100
});

// --- CONFIGURATION ---
let cart = JSON.parse(localStorage.getItem('smikah_cart')) || [];
let paymentMode = "cod"; 
let orderCheckInterval;

// --- MENU FILTERING ---
function filterMenu(category) {
    const items = document.querySelectorAll('.menu-item');
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active-btn', 'text-black', 'bg-orange-100');
        btn.classList.add('text-gray-500');
        if (category === 'all' && btn.innerText.toLowerCase().includes('all')) {
            btn.classList.add('active-btn', 'text-black');
        } else if (btn.innerText.toLowerCase().includes(category)) {
            btn.classList.add('active-btn', 'text-black');
        }
    });
    items.forEach(item => {
        item.style.display = (category === 'all' || item.classList.contains(category)) ? 'block' : 'none';
    });
}

// --- CART UI TOGGLES ---
function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    drawer.classList.toggle('hidden');
    backToCart();
}

function showDeliveryForm() {
    if (cart.length === 0) return alert("Your bag is empty!");
    document.getElementById('cart-list').classList.add('hidden');
    document.getElementById('cart-footer').classList.add('hidden');
    document.getElementById('delivery-form').classList.remove('hidden');
}

function backToCart() {
    document.getElementById('cart-list').classList.remove('hidden');
    document.getElementById('cart-footer').classList.remove('hidden');
    document.getElementById('delivery-form').classList.add('hidden');
}

// --- CORE LOGIC ---
function addToCart(name, price, prepTime) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ name, price, qty: 1, prepTime: prepTime });
    }
    saveAndRender();
    document.getElementById('cart-drawer').classList.remove('hidden');
}

function updateQty(index, change) {
    cart[index].qty += change;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    saveAndRender();
}

function setPaymentMode(mode) {
    paymentMode = mode;
    renderCart();
}

function calculateOrderTime() {
    let totalPrepTime = 0;
    cart.forEach(item => {
        // We multiply the prep time by the quantity
        // Example: 2 x 10 mins = 20 mins
        totalPrepTime += (item.prepTime * item.qty);
    });
    return totalPrepTime; 
}
function saveAndRender() {
    localStorage.setItem('smikah_cart', JSON.stringify(cart));
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cart-list');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');
    
    if (cart.length === 0) {
        list.innerHTML = `<div class="text-center py-20"><i class="fas fa-shopping-bag text-4xl text-gray-200 mb-4"></i><p class="text-gray-400">Your bag is empty.</p></div>`;
        totalEl.innerText = "₦0";
        if(countEl) countEl.innerText = "0";
        return;
    }

    let html = "";
    let total = 0;
    let totalQty = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        totalQty += item.qty;
        html += `
        <div class="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-3">
            <div>
                <h4 class="font-bold text-black text-sm">${item.name}</h4>
                <p class="text-orange-600 font-bold text-xs">₦${item.price.toLocaleString()}</p>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="updateQty(${index}, -1)" class="w-7 h-7 rounded-full bg-white border flex items-center justify-center">-</button>
                <span class="font-bold text-sm">${item.qty}</span>
                <button onclick="updateQty(${index}, 1)" class="w-7 h-7 rounded-full bg-white border flex items-center justify-center">+</button>
            </div>
        </div>`;
    });

    const estTime = calculateOrderTime();
    html += `
    <div class="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-200">
        <div class="flex items-center gap-2 text-orange-700">
            <i class="fas fa-clock"></i>
            <span class="font-bold text-sm">Base Prep: ~${estTime} mins</span>
        </div>
    </div>
    <div class="mt-6 space-y-2">
        <p class="font-bold text-[10px] text-gray-400 uppercase tracking-widest px-1">Payment Method</p>
        <button onclick="setPaymentMode('online')" class="w-full py-3 rounded-xl border-2 transition-all px-4 flex justify-between items-center ${paymentMode === 'online' ? 'border-orange-600 bg-orange-50' : 'border-gray-100 bg-white'}">
            <span class="text-sm font-bold">Pay Online</span>
            <i class="fas fa-credit-card ${paymentMode === 'online' ? 'text-orange-600' : 'text-gray-300'}"></i>
        </button>
        <button onclick="setPaymentMode('cod')" class="w-full py-3 rounded-xl border-2 transition-all px-4 flex justify-between items-center ${paymentMode === 'cod' ? 'border-orange-600 bg-orange-50' : 'border-gray-100 bg-white'}">
            <span class="text-sm font-bold">Pay on Delivery</span>
            <i class="fas fa-truck ${paymentMode === 'cod' ? 'text-orange-600' : 'text-gray-300'}"></i>
        </button>
    </div>`;

    list.innerHTML = html;
    totalEl.innerText = `₦${total.toLocaleString()}`;
    if(countEl) countEl.innerText = totalQty;
}

// --- MULTI-ORDER CORE SYSTEM ---
async function processOrder() {
    const nameInput = document.getElementById('cust-name').value;
    const phoneInput = document.getElementById('cust-phone').value;
    const addressInput = document.getElementById('cust-address').value;

    if (!nameInput || !phoneInput || !addressInput) return alert("Please fill all details!");

    const orderSecret = "SEC" + Math.floor(Math.random() * 100000);
    const estTime = calculateOrderTime();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const orderData = {
        id: "SMK-" + Math.floor(1000 + Math.random() * 9000),
        secret: orderSecret,
        prepTime: estTime,
        status: 'pending',
        customer: { name: nameInput, address: addressInput, phone: phoneInput },
        items: [...cart],
        total: document.getElementById('cart-total').innerText,
        time: timeStr,
        remainingSeconds: estTime * 60
    };

    let orders = JSON.parse(localStorage.getItem('smikah_orders_list')) || [];
    orders.push(orderData);
    localStorage.setItem('smikah_orders_list', JSON.stringify(orders));

    const botToken = "8309457191:AAFao8IWckxSxpD9Z0ZLt6XCpjKxAPcKb2E"; 
    const chatId = "1049274286"; 
    let message = `🔔 *NEW ORDER REQUEST [${orderData.id}]*%0A👤 *Customer:* ${nameInput}%0A━━━━━━━━━━━━━━━━━━━━━`;
    const keyboard = { inline_keyboard: [[{ text: "✅ ACCEPT", callback_data: `APPROVE_${orderSecret}` }, { text: "❌ DECLINE", callback_data: `DECLINE_${orderSecret}` }]] };
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${message}&parse_mode=Markdown&reply_markup=${JSON.stringify(keyboard)}`;
    
    try { await fetch(telegramUrl); } catch (err) { console.error("Telegram fail"); }

    document.getElementById('cart-drawer').classList.add('hidden');
    document.getElementById('nav-order-btn').classList.remove('hidden');
    document.getElementById('success-screen').classList.remove('hidden');
    document.getElementById('pending-ui').innerHTML = `
        <div class="flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                <i class="fas fa-paper-plane text-xl"></i>
            </div>
            <h2 class="text-2xl font-black mb-4 uppercase">Order Sent!</h2>
            <button onclick="openStatusPage()" class="bg-black text-white px-8 py-4 rounded-2xl font-bold mb-3 w-full uppercase text-xs">View Order Status</button>
            <button onclick="document.getElementById('success-screen').classList.add('hidden')" class="text-gray-400 text-[10px] font-bold uppercase">Back to Menu</button>
        </div>
    `;

    cart = [];
    localStorage.removeItem('smikah_cart');
    renderCart();
    waitForCEO(orderSecret, estTime);
}

function waitForCEO(secret, prepTime) {
    const botToken = "8309457191:AAFao8IWckxSxpD9Z0ZLt6XCpjKxAPcKb2E";
    const interval = setInterval(async () => {
        try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=-10`);
            const data = await response.json();
            
            const approval = data.result.find(u => u.callback_query && u.callback_query.data === `APPROVE_${secret}`);
            if (approval) {
                clearInterval(interval);
                updateOrderInList(secret, 'approved');
                sendFinalTicket(secret);
                return;
            }

            const decline = data.result.find(u => u.callback_query && u.callback_query.data === `DECLINE_${secret}`);
            if (decline) {
                clearInterval(interval);
                updateOrderInList(secret, 'declined');
            }
        } catch (e) { }
    }, 4000);
}

function updateOrderInList(secret, status) {
    let orders = JSON.parse(localStorage.getItem('smikah_orders_list')) || [];
    const index = orders.findIndex(o => o.secret === secret);
    if (index !== -1) {
        orders[index].status = status;
        localStorage.setItem('smikah_orders_list', JSON.stringify(orders));
        renderStatusItems(); 
    }
}

async function sendFinalTicket(secret) {
    const orders = JSON.parse(localStorage.getItem('smikah_orders_list')) || [];
    const order = orders.find(o => o.secret === secret);
    if (!order) return;
    const botToken = "8309457191:AAFao8IWckxSxpD9Z0ZLt6XCpjKxAPcKb2E"; 
    const chatId = "8443357273"; 
    let ticket = `👨‍🍳 *KITCHEN TICKET [${order.id}]*%0A👤 *Client:* ${order.customer.name}%0A📍 *Loc:* ${order.customer.address}%0A━━━━━━━━━━━━━━━━━━━━━%0A`;
    order.items.forEach(item => { ticket += `• ${item.name} (x${item.qty})%0A`; });
    ticket += `━━━━━━━━━━━━━━━━━━━━━%0A💰 *TOTAL:* ${order.total}`;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${ticket}&parse_mode=Markdown`);
}

// --- UI AND NAVIGATION ---
function openStatusPage() {
    document.getElementById('success-screen').classList.add('hidden');
    document.getElementById('order-status-page').classList.remove('hidden');
    renderStatusItems();
}

function closeStatusPage() {
    document.getElementById('order-status-page').classList.add('hidden');
}

function renderStatusItems() {
    const orders = JSON.parse(localStorage.getItem('smikah_orders_list')) || [];
    const container = document.getElementById('order-summary-display');
    const mainSpinner = document.getElementById('status-spinner');
    const statusText = document.getElementById('status-text');
    const statusDesc = document.getElementById('status-desc');

    if (orders.length === 0) {
        container.innerHTML = `<div class="text-center py-10 text-gray-400">No active orders.</div>`;
        if (mainSpinner) mainSpinner.classList.add('hidden');
        return;
    }

    const hasPending = orders.some(o => o.status === 'pending');

    if (hasPending) {
        if (mainSpinner) mainSpinner.classList.remove('hidden');
        if (statusText) statusText.innerText = "Pending...";
        if (statusDesc) statusDesc.innerText = "We are waiting for Smikah Foods to confirm.";
    } else {
        if (mainSpinner) mainSpinner.classList.add('hidden');
        if (statusText) statusText.innerText = "Confirmed!";
        if (statusDesc) statusDesc.innerText = "Your order has been processed. Check details below.";
    }

    let html = "";
    [...orders].reverse().forEach(order => {
        const isApproved = order.status === 'approved';
        html += `
        <div class="bg-gray-50 rounded-[30px] p-6 mb-4 border border-gray-100 shadow-sm">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h4 class="font-black text-[10px] uppercase text-gray-400">Order ${order.id}</h4>
                    <p class="text-[10px] font-bold text-gray-500">${order.time}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-[8px] font-black uppercase ${isApproved ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}">
                    ${order.status}
                </span>
            </div>
            ${isApproved ? `
                <div class="bg-black text-white p-4 rounded-2xl text-center mb-4">
                    <p class="text-[8px] uppercase opacity-50 mb-1">Time Remaining</p>
                    <div class="text-3xl font-black tabular-nums" id="timer-${order.secret}">${formatTime(order.remainingSeconds)}</div>
                </div>
            ` : ''}
            <div class="space-y-1 mb-4">
                ${order.items.map(item => `<div class="flex justify-between text-xs"><span>${item.qty}x ${item.name}</span><b>₦${(item.price * item.qty).toLocaleString()}</b></div>`).join('')}
                <div class="flex justify-between border-t mt-2 pt-2 font-bold text-orange-600"><span>Total</span><span>${order.total}</span></div>
            </div>
            ${isApproved ? `
                <button onclick="viewReceipt('${order.secret}')" class="w-full py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    <i class="fas fa-file-invoice mr-2"></i> View Receipt
                </button>
            ` : ''}
        </div>`;
    });
    container.innerHTML = html;
}

function viewReceipt(secret) {
    console.log("Forcing receipt open for:", secret);
    
    const orders = JSON.parse(localStorage.getItem('smikah_orders_list')) || [];
    const order = orders.find(o => o.secret === secret);

    if (!order) return alert("Order not found.");

   let receiptHTML = `
        <div style="text-align: center; border-bottom: 2px dashed #eee; padding-bottom: 15px; margin-bottom: 15px;">
            <div style="margin-bottom: 10px;">
                <span style="font-size: 24px; font-weight: 900; color: #ea580c; letter-spacing: -1px; text-transform: uppercase;">
                    SMIKAH<span style="color: #000;">FOODS</span>
                </span>
            </div>
            
            <p style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin: 0;">Enugu, Nigeria</p>
            <div style="background: #000; color: #fff; display: inline-block; padding: 2px 10px; border-radius: 5px; font-size: 10px; margin-top: 10px; font-weight: bold;">
                ORDER ID: ${order.id}
            </div>
            <p style="font-size: 11px; color: #888; margin-top: 5px;">${order.time}</p>
        </div>
        
        <div style="margin-bottom: 15px; font-size: 13px; color: #000;">
            <p style="margin: 0; opacity: 0.6; font-size: 10px; text-transform: uppercase; font-weight: bold;">Deliver To:</p>
            <p style="margin: 0; font-weight: 800;">${order.customer.name}</p>
            <p style="margin: 0; font-size: 12px;">${order.customer.address}</p>
        </div>

        <div style="margin-bottom: 15px; color: #000;">
            <p style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px; font-size: 10px; font-weight: bold; color: #ea580c;">ORDER ITEMS</p>
            ${order.items.map(item => `
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
                    <span>${item.qty}x ${item.name}</span>
                    <span style="font-weight: bold;">₦${(item.price * item.qty).toLocaleString()}</span>
                </div>
            `).join('')}
        </div>

        <div style="border-top: 2px solid #000; padding-top: 10px; display: flex; justify-content: space-between; font-weight: 900; font-size: 18px; color: #000;">
            <span>TOTAL</span>
            <span>${order.total}</span>
        </div>
        
        <div style="text-align: center; margin-top: 20px; border-top: 1px dashed #eee; pt-10">
            <p style="font-size: 10px; color: #aaa; font-style: italic; margin-top: 10px;">
                Smikah Foods: Taste the Difference!
            </p>
        </div>
    `;
    const modal = document.getElementById('order-receipt');
    const content = document.getElementById('receipt-content');

    if (modal && content) {
        content.innerHTML = receiptHTML;
        
        // --- THE EMERGENCY FORCE ---
        modal.style.display = "flex"; 
        modal.style.setProperty("display", "flex", "important");
        modal.style.opacity = "1";
        modal.style.visibility = "visible";
        modal.style.zIndex = "100000"; // Higher than anything else
        modal.classList.remove('hidden'); 
    } else {
        alert("CRITICAL ERROR: The HTML IDs 'order-receipt' or 'receipt-content' are missing from your menu.html!");
    }
}

function formatTime(sec) {
    if (sec <= 0) return "READY!";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Global Timer Interval
setInterval(() => {
    let orders = JSON.parse(localStorage.getItem('smikah_orders_list')) || [];
    let needsUpdate = false;
    orders.forEach(order => {
        if (order.status === 'approved' && order.remainingSeconds > 0) {
            order.remainingSeconds--;
            needsUpdate = true;
            const timerEl = document.getElementById(`timer-${order.secret}`);
            if (timerEl) timerEl.innerText = formatTime(order.remainingSeconds);
        }
    });
    if (needsUpdate) localStorage.setItem('smikah_orders_list', JSON.stringify(orders));
}, 1000);


// --- PERSISTENCE ---
window.addEventListener('load', () => {
    const orders = JSON.parse(localStorage.getItem('smikah_orders_list')) || [];
    if (orders.length > 0) {
        document.getElementById('nav-order-btn').classList.remove('hidden');
        orders.forEach(o => {
            if (o.status === 'pending') waitForCEO(o.secret, o.prepTime);
        });
    }
});

renderCart();
