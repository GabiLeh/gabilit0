const DISCORD_WEBHOOK_URL = "https://discordapp.com/api/webhooks/1571679844792795136/3ogd0zsjhy_3Dh7OG4BJgpDXB5gw-9UBXfBY2PNwrl4FtGwknCfBfoIJzJComFEmJiXH";
const SUPABASE_URL = "https://dyuqpfsiximnessphbqz.supabase.co/";
const SUPABASE_KEY = "sb_publishable_TmMgGbPf1P8ME1YYLQdVfw_Xv7IQkEV";

let db = null;
if (SUPABASE_URL.startsWith("http")) {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

const productsData = [
    {
        id: 1,
        category: "micangas",
        badge: "", title: 'PHONE CHAIN "A THOUSAND SUNS"',
        desc: "A handmade beaded phone chain inspired by A Thousand Suns.",
        prices: { BRL: 22.00, USD: 5.50, EUR: 5.00 },
        stock: 1,
        img: "ATSphonechain.jpg" },
    {
        id: 2,
        category: "micangas",
        badge: "",
        title: 'PHONE CHAIN "FROM ZERO"',
        desc: "A handmade beaded phone chain inspired by From Zero.",
        prices: { BRL: 22.00, USD: 5.50, EUR: 5.00 },
        stock: 1,
        img: "FZphonechain.jpg"
    },
    {
        id: 3,
        category: "pulseiras",
        badge: "",
        title: 'BRACELET "XERO"',
        desc: "A handmade beaded bracelet inspired by the 1997 Xero demo.",
        prices: { BRL: 15.00, USD: 4.00, EUR: 3.50 },
        stock: 1,
        img: "Xpulseira.jpg" },
    {
        id: 4,
        category: "pulseiras",
        badge: "1 OF 1",
        title: 'BRACELET "ONE STEP CLOSER"',
        desc: "A handmade beaded bracelet inspired by One Step Closer.",
        prices: { BRL: 18.00, USD: 4.50, EUR: 4.00 },
        stock: 1,
        img: "OSCpulseira.jpg"
    },
    {
        id: 5,
        category: "chaveiros",
        badge: "CUSTOM",
        title: 'CUSTOM PHOTO / ALBUM KEYCHAIN',
        desc: "Made to order! Send me your favorite album cover or photo on Discord.",
        prices: { BRL: 25.00, USD: 6.50, EUR: 6.00 },
        stock: 5,
        img: "customkeychain.jpg"
    }
];

let cart = [];
let currentCurrency = 'USD';
let currentFilter = 'all';
let calculatedShippingCost = 0;
let shippingServiceLabel = "";

const currencySymbols = { 'USD': '$ ', 'EUR': '€ ', 'BRL': 'R$ ' };

function formatMoney(amount) {
    const symbol = currencySymbols[currentCurrency];
    return `${symbol}${amount.toFixed(2).replace('.', currentCurrency === 'BRL' ? ',' : '.')}`;
}

async function carregarEstoqueReal() {
    if (!db) return;
    const { data, error } = await db.from('estoque').select('*');
    if (data) {
        data.forEach(itemBanco => {
            const prod = productsData.find(p => p.id === itemBanco.id);
            if (prod) prod.stock = itemBanco.stock;
        });
        renderProducts();
    }
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    let visibleCount = 0;

    productsData.forEach(prod => {
        if (currentFilter !== 'all' && prod.category !== currentFilter) return;
        visibleCount++;

        const inCartItem = cart.find(c => c.id === prod.id);
        const qtyInCart = inCartItem ? inCartItem.qty : 0;
        const remainingStock = prod.stock - qtyInCart;
        const isOutOfStock = remainingStock <= 0;
        const priceFormatted = formatMoney(prod.prices[currentCurrency]);

        let stockText = `[Stock: ${remainingStock}]`;
        let stockColor = "#aaa";
        if (isOutOfStock) { stockText = "OUT OF STOCK"; stockColor = "#ff4d4d"; }
        else if (remainingStock === 1) { stockText = "[Last 1!]"; stockColor = "#ffae00"; }

        let badgeHtml = prod.stock === 0 ? `<span class="tag-badge" style="background:#333; color:#ff4d4d;">SOLD OUT</span>` : (prod.badge ? `<span class="tag-badge">${prod.badge}</span>` : '');

        const card = document.createElement('div');
        card.className = 'product-card';
        if (prod.stock === 0) card.style.opacity = '0.65';

        card.innerHTML = `
                <div>
                    <div class="product-img">
                        ${badgeHtml}
                        <img src="${prod.img}" alt="${prod.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <span style="display:none; font-size:10px;">[ IMG_${prod.id}.JPG ]</span>
                    </div>
                    <div class="product-title">${prod.title}</div>
                    <div class="product-desc">${prod.desc}</div>
                </div>
                <div class="product-footer">
                    <div class="price-row">
                        <span class="price">${priceFormatted}</span>
                        <span style="font-size:10px; font-weight:bold; color:${stockColor};">${stockText}</span>
                    </div>
                    <button class="add-btn" onclick="addToCart(${prod.id})" ${isOutOfStock ? 'disabled style="background:#222; color:#ff4d4d; border:1px solid #444; cursor:not-allowed;"' : ''}>
                        ${isOutOfStock ? '[ OUT OF STOCK ]' : '+ ADD TO CART'}
                    </button>
                </div>
            `;
        grid.appendChild(card);
    });
    document.getElementById('item-counter').textContent = `${visibleCount} items`;
}

function changeCurrency() {
    currentCurrency = document.getElementById('currency-selector').value;
    renderProducts();
    renderCart();
    calculatedShippingCost = 0;
    document.getElementById('shipping-result').textContent = "Enter postal code to calculate shipping.";
    updateModalTotals();
}

function filterProducts(category, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = category;
    renderProducts();
}

function addToCart(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    const existingItem = cart.find(c => c.id === productId);
    const currentQty = existingItem ? existingItem.qty : 0;

    if (currentQty >= product.stock) {
        alert(`Out of stock! Only ${product.stock} unit(s) available.`);
        return;
    }

    if (existingItem) existingItem.qty += 1;
    else cart.push({ id: productId, qty: 1 });

    renderProducts();
    renderCart();
}

function removeOneFromCart(productId) {
    const idx = cart.findIndex(c => c.id === productId);
    if (idx === -1) return;
    if (cart[idx].qty > 1) cart[idx].qty -= 1;
    else cart.splice(idx, 1);
    renderProducts();
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const headerCount = document.getElementById('header-count');
    const totalUnits = cart.reduce((sum, item) => sum + item.qty, 0);
    headerCount.textContent = totalUnits;

    if (cart.length === 0) {
        container.innerHTML = '<span style="color:#666;">[ Empty cart ]</span>';
        totalEl.textContent = formatMoney(0);
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach(item => {
        const product = productsData.find(p => p.id === item.id);
        const subtotalItem = product.prices[currentCurrency] * item.qty;
        total += subtotalItem;
        html += `
                <div class="cart-item-row">
                    <span><strong>${item.qty}x</strong> ${product.title}</span>
                    <span>${formatMoney(subtotalItem)} <span class="remove-item" onclick="removeOneFromCart(${item.id})">[-]</span></span>
                </div>
            `;
    });
    container.innerHTML = html;
    totalEl.textContent = formatMoney(total);
}

function calcularFretePorDistancia() {
    const inputVal = document.getElementById('user-cep').value.trim();
    const resEl = document.getElementById('shipping-result');
    if (!inputVal) { alert("Please enter a valid ZIP code or CEP."); return; }

    let costUSD = 12.00;
    let serviceName = "Intl Tracked Airmail";
    const cleanInput = inputVal.replace(/\D/g, '');

    if (cleanInput.length === 8 && (inputVal.includes('-') || !/[a-zA-Z]/.test(inputVal))) {
        const prefix = cleanInput.substring(0, 2);
        if (['01', '02', '03', '04', '05', '06', '07', '08', '09', '11', '12', '13', '14', '15', '16', '17', '18', '19'].includes(prefix)) {
            costUSD = 3.50; serviceName = "Correios SEDEX (SP State)";
        } else {
            costUSD = 6.00; serviceName = "Correios PAC (BR)";
        }
    } else {
        costUSD = 12.50; serviceName = "USPS / International Airmail";
    }

    let finalCost = costUSD;
    if (currentCurrency === 'EUR') finalCost = costUSD * 0.92;
    if (currentCurrency === 'BRL') finalCost = costUSD * 5.20;

    calculatedShippingCost = finalCost;
    shippingServiceLabel = serviceName;
    resEl.textContent = `✓ ${serviceName}: ${formatMoney(calculatedShippingCost)}`;
    updateModalTotals();
}

function updateModalTotals() {
    const summary = document.getElementById('modal-summary');
    let subtotal = 0;
    const lines = cart.map(item => {
        const product = productsData.find(p => p.id === item.id);
        const itemTotal = product.prices[currentCurrency] * item.qty;
        subtotal += itemTotal;
        return `• <strong>${item.qty}x</strong> ${product.title} - ${formatMoney(itemTotal)}`;
    });
    const total = subtotal + calculatedShippingCost;
    summary.innerHTML = lines.join('<br>') + `<br><br>Shipping: ${formatMoney(calculatedShippingCost)}` + `<br><strong style="color:#00ff41;">TOTAL: ${formatMoney(total)} (${currentCurrency})</strong>`;
}

function openCheckout() {
    if (cart.length === 0) { alert("Your cart is empty!"); return; }
    calculatedShippingCost = 0;
    document.getElementById('user-cep').value = '';
    document.getElementById('shipping-result').textContent = "Enter postal code to calculate shipping.";
    updateModalTotals();
    document.getElementById('checkout-modal').style.display = 'flex';
}

function closeCheckout() { document.getElementById('checkout-modal').style.display = 'none'; }

async function finishOrder(e) {
    e.preventDefault();
    const contactInfo = document.getElementById('cust-contact-info').value.trim();
    const postalVal = document.getElementById('user-cep').value.trim();
    const submitBtn = document.getElementById('submit-order-btn');

    if (calculatedShippingCost === 0) { alert("Please calculate your shipping first!"); return; }
    if (!DISCORD_WEBHOOK_URL.startsWith("http")) { alert("⚠️ Webhook URL not configured!"); return; }

    let subtotal = 0;
    let itemsListText = cart.map(item => {
        const product = productsData.find(p => p.id === item.id);
        const itemTotal = product.prices[currentCurrency] * item.qty;
        subtotal += itemTotal;
        return `• **${item.qty}x ${product.title}** (${formatMoney(itemTotal)})`;
    }).join('\n');

    const totalFormatted = formatMoney(subtotal + calculatedShippingCost);
    const shipFormatted = formatMoney(calculatedShippingCost);

    submitBtn.disabled = true;
    submitBtn.textContent = "[ SENDING... ]";

    const payload = {
        username: "gabilit0 Store BOT",
        embeds: [{
            title: "🛒 NEW ORDER RECEIVED!",
            color: 12069150,
            fields: [
                { name: "👤 Customer Discord", value: `\`${contactInfo}\``, inline: true },
                { name: "📍 ZIP / CEP", value: `\`${postalVal}\``, inline: true },
                { name: "💱 Currency", value: currentCurrency, inline: true },
                { name: "📦 Items", value: itemsListText, inline: false },
                { name: "🚚 Shipping", value: `${shippingServiceLabel} — **${shipFormatted}**`, inline: false },
                { name: "💰 TOTAL", value: `**${totalFormatted}**`, inline: false }
            ],
            timestamp: new Date().toISOString()
        }]
    };

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });

        if (response.ok) {
            if (db) {
                for (const item of cart) {
                    const product = productsData.find(p => p.id === item.id);
                    if (product) {
                        const novoEstoque = Math.max(0, product.stock - item.qty);
                        product.stock = novoEstoque;
                        await db.from('estoque').update({ stock: novoEstoque }).eq('id', product.id);
                    }
                }
            }
            alert(`✓ Order sent successfully! I will message you soon on Discord (${contactInfo}).`);
            cart = []; renderProducts(); renderCart(); closeCheckout();
        } else {
            alert("Error sending order to Discord.");
        }
    } catch (err) {
        alert("Connection error.");
    } finally {
        submitBtn.disabled.value = false;
        submitBtn.textContent = "[ SEND ORDER ]";
    }
}

renderProducts();
carregarEstoqueReal();