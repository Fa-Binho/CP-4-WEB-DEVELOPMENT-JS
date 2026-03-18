class ShoppingCart {
    constructor() {
        this.items = this.loadFromStorage();
        this.updateUI();
    }

    loadFromStorage() {
        const stored = localStorage.getItem('ecotrend-cart');
        return stored ? JSON.parse(stored) : [];
    }

    saveToStorage() {
        localStorage.setItem('ecotrend-cart', JSON.stringify(this.items));
    }

    addProduct(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                ...product,
                quantity: 1
            });
        }
        
        this.saveToStorage();
        this.updateUI();
        this.showNotification('Produto adicionado ao carrinho!');
    }

    removeProduct(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToStorage();
        this.updateUI();
    }

    updateQuantity(productId, newQuantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, newQuantity);
            this.saveToStorage();
            this.updateUI();
        }
    }

    clearCart(showNotification = true) {
        this.items = [];
        this.saveToStorage();
        this.updateUI();
        if (showNotification) {
            this.showNotification('Carrinho limpo!');
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    updateUI() {
        const cartCount = document.getElementById('cartCount');
        cartCount.textContent = this.getItemCount();

        const cartTotal = document.getElementById('cartTotal');
        cartTotal.textContent = this.getTotal().toFixed(2);

        this.renderCartItems();
    }

    renderCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        
        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <p>Seu carrinho está vazio</p>
                </div>
            `;
            return;
        }

        cartItemsContainer.innerHTML = this.items.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image"
                     onerror="this.src='https://via.placeholder.com/60x60/f5f5f5/999?text=Produto'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="remove-item" onclick="cart.removeProduct(${item.id})">
                            Remover
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showNotification(message) {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

class ProductManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.loadProducts();
    }

    async loadProducts() {
        try {
            const response = await fetch('products.json');
            const data = await response.json();
            this.products = data.products;
            this.filteredProducts = [...this.products];
            this.renderProducts();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            this.showErrorMessage();
        }
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        
        if (this.filteredProducts.length === 0) {
            productsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <p>Nenhum produto encontrado com os filtros selecionados.</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = this.filteredProducts.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.src='https://via.placeholder.com/300x200/f5f5f5/999?text=Produto'">
                <div class="product-info">
                    <div class="product-category">${this.getCategoryName(product.category)}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                    <button class="add-to-cart" onclick="cart.addProduct(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                        <i class="fas fa-shopping-cart"></i> Adicionar ao Carrinho
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterProducts(category, priceRange) {
        this.filteredProducts = this.products.filter(product => {
            const categoryMatch = category === 'all' || product.category === category;
            const priceMatch = this.checkPriceRange(product.price, priceRange);
            return categoryMatch && priceMatch;
        });
        this.renderProducts();
    }

    checkPriceRange(price, range) {
        if (range === 'all') return true;
        
        switch (range) {
            case '0-50':
                return price <= 50;
            case '50-100':
                return price > 50 && price <= 100;
            case '100-200':
                return price > 100 && price <= 200;
            case '200+':
                return price > 200;
            default:
                return true;
        }
    }

    getCategoryName(category) {
        const categories = {
            'clothing': 'Roupas Sustentáveis',
            'beauty': 'Beleza Natural',
            'home': 'Casa Sustentável',
            'tech': 'Tecnologia Verde'
        };
        return categories[category] || category;
    }

    showErrorMessage() {
        const productsGrid = document.getElementById('productsGrid');
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 1rem;"></i>
                <p>Erro ao carregar produtos. Por favor, tente novamente mais tarde.</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.cart = new ShoppingCart();
    window.productManager = new ProductManager();

    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');

    categoryFilter.addEventListener('change', function() {
        productManager.filterProducts(this.value, priceFilter.value);
    });

    priceFilter.addEventListener('change', function() {
        productManager.filterProducts(categoryFilter.value, this.value);
    });

    const cartToggle = document.getElementById('cartToggle');
    const closeCart = document.getElementById('closeCart');
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    const clearCartBtn = document.getElementById('clearCart');

    cartToggle.addEventListener('click', function() {
        cartSidebar.classList.add('active');
        overlay.classList.add('active');
    });

    closeCart.addEventListener('click', function() {
        cartSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', function() {
        cartSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    clearCartBtn.addEventListener('click', function() {
        if (cart.getItemCount() > 0) {
            if (confirm('Tem certeza que deseja limpar o carrinho?')) {
                cart.clearCart();
            }
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    document.querySelector('.checkout-btn').addEventListener('click', function() {
        if (cart.getItemCount() === 0) {
            cart.showNotification('Seu carrinho está vazio!');
            return;
        }

        const purchasePromise = new Promise((resolve, reject) => {
            setTimeout(() => {
                const total = cart.getTotal();
                if (total > 0) {
                    resolve({
                        success: true,
                        total: total,
                        items: cart.getItemCount()
                    });
                } else {
                    reject(new Error('Erro no processamento'));
                }
            }, 2000);
        });

        this.disabled = true;
        this.textContent = 'Processando...';
        this.style.background = '#ffc107';

        purchasePromise
            .then(result => {
                cart.showNotification(`Compra realizada com sucesso! Total: R$ ${result.total.toFixed(2)}`);
                cart.clearCart(false);
                cartSidebar.classList.remove('active');
                overlay.classList.remove('active');
            })
            .catch(error => {
                cart.showNotification('Erro ao processar compra. Tente novamente.');
            })
            .finally(() => {
                this.disabled = false;
                this.textContent = 'Finalizar Compra';
                this.style.background = '#8bc34a';
            });
    });
});
