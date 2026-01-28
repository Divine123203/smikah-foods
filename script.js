// Initialize AOS (Animate on Scroll)
AOS.init({
    duration: 1000,
    once: true,
    offset: 100
});

// Simple Log to confirm script is working
console.log("Smikah Foods script loaded successfully!");
function filterMenu(category) {
    const items = document.querySelectorAll('.menu-item');
    const buttons = document.querySelectorAll('.filter-btn');

    // Update button active state
    buttons.forEach(btn => {
        btn.classList.remove('active-btn');
        if (btn.innerText.toLowerCase() === category) {
            btn.classList.add('active-btn');
        } else if (category === 'all' && btn.innerText.toLowerCase() === 'all') {
            btn.classList.add('active-btn');
        }
    });

    // Filter items
    items.forEach(item => {
        item.style.display = 'none'; // Hide all initially
        if (category === 'all' || item.classList.contains(category)) {
            item.style.display = 'block'; // Show matched items
            // Trigger a small animation
            item.classList.add('animate-fade-in');
        }
    });
}

// Mobile Menu Toggle Logic
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    // Change icon from bars to 'X' when open
    const icon = menuBtn.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
});

// Close menu when a link is clicked
document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });
});
let cart = [];

// 1. Open/Close Cart
function toggleCart() {
    document.getElementById('cart-drawer').classList.toggle('hidden');
}

// 2. Add to Cart
function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ name, price, qty: 1 });
    }
    
    renderCart();
    // Open the cart automatically so user sees it worked
    document.getElementById('cart-drawer').classList.remove('hidden');
}

// 3. Change Quantity (Remove logic is built-in here)
function updateQty(index, change) {
    cart[index].qty += change;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1); // Remove item if qty hits 0
    }
    renderCart();
}

// 4. Draw the Cart Items
function renderCart() {
    const list = document.getElementById('cart-list');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count'); // The badge in nav
    
    if (cart.length === 0) {
        list.innerHTML = `<p class="text-center text-gray-400 mt-10">Your bag is empty.</p>`;
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
        <div class="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div>
                <h4 class="font-bold text-black">${item.name}</h4>
                <p class="text-orange-600 font-black text-sm">₦${item.price.toLocaleString()}</p>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="updateQty(${index}, -1)" class="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">-</button>
                <span class="font-bold text-lg">${item.qty}</span>
                <button onclick="updateQty(${index}, 1)" class="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-green-50 hover:text-green-500 transition-colors">+</button>
            </div>
        </div>`;
    });

    list.innerHTML = html;
    totalEl.innerText = `₦${total.toLocaleString()}`;
    if(countEl) countEl.innerText = totalQty;
}

// 5. Send itemized list to CEO
function sendOrderToWhatsApp() {
    if (cart.length === 0) return alert("Add some food first!");

    const ceoNumber = "2348000000000"; // CHANGE THIS TO REAL CEO NUMBER
    let message = "*SMIKAH FOODS ENUGU - NEW ORDER*%0A";
    message += "--------------------------------%0A";

    cart.forEach(item => {
        message += `✅ *${item.name}* (x${item.qty}) - ₦${(item.price * item.qty).toLocaleString()}%0A`;
    });

    const finalTotal = document.getElementById('cart-total').innerText;
    message += "--------------------------------%0A";
    message += `*TOTAL AMOUNT: ${finalTotal}*%0A%0A`;
    message += "Deliver to Enugu ASAP! 🍛🔥";

    window.open(`https://wa.me/${ceoNumber}?text=${message}`, '_blank');
}