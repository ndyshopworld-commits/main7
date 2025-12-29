/*
 * cart.js
 *
 * Simple client‑side shopping cart utilities for the AlbaSpace shop pages.  
 * This script stores cart data in `localStorage` so that the number of items in
 * the cart persists across page loads.  It exposes a global `cartManager`
 * object with methods to load and save the cart, add and remove items,
 * update quantities and update any cart count badges on the page.  The
 * functions are lightweight and do not depend on any external libraries.
 */

(function() {
  /**
   * Retrieve the cart array from localStorage.  If nothing is stored then
   * an empty array is returned.  Each cart entry is an object with the
   * following shape:
   *   { id: string, name: string, price: number, image: string, quantity: number }
   *
   * @returns {Array<Object>} The current cart contents.
   */
  function loadCart() {
    try {
      const raw = localStorage.getItem('albaspace_cart');
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error('Failed to parse cart from localStorage', err);
      return [];
    }
  }

  /**
   * Persist a cart array back to localStorage.
   *
   * @param {Array<Object>} cart The updated cart to store.
   */
  function saveCart(cart) {
    try {
      localStorage.setItem('albaspace_cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart to localStorage', err);
    }
  }

  /**
   * Compute the total number of items across all entries in the cart.
   *
   * @returns {number} The sum of quantities for each item in the cart.
   */
  function cartItemCount() {
    const cart = loadCart();
    return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  /**
   * Update all elements on the page that display the cart count.  Elements
   * should have the class `cart-count`.  The textContent of each will be
   * updated to match the current cart total.
   */
  function updateCartCount() {
    const count = cartItemCount();
    const countElements = document.querySelectorAll('.cart-count');
    countElements.forEach(el => {
      el.textContent = count;
    });
  }

  /**
   * Add an item to the cart.  If the item already exists (matched by id)
   * then its quantity will be incremented by the provided amount.
   *
   * @param {Object} item Item details: id, name, price, image and quantity.
   */
  function addToCart(item) {
    const cart = loadCart();
    const existing = cart.find(entry => entry.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push({ ...item });
    }
    saveCart(cart);
    updateCartCount();
  }

  /**
   * Remove an entry completely from the cart based on its id.
   *
   * @param {string} id Identifier of the item to remove.
   */
  function removeFromCart(id) {
    const cart = loadCart().filter(entry => entry.id !== id);
    saveCart(cart);
    updateCartCount();
  }

  /**
   * Update the quantity for an entry in the cart.  If the resulting
   * quantity is less than or equal to zero the item is removed entirely.
   *
   * @param {string} id Identifier of the item to update.
   * @param {number} quantity New quantity to set.
   */
  function updateQuantity(id, quantity) {
    const cart = loadCart();
    const idx = cart.findIndex(entry => entry.id === id);
    if (idx >= 0) {
      if (quantity <= 0) {
        cart.splice(idx, 1);
      } else {
        cart[idx].quantity = quantity;
      }
      saveCart(cart);
      updateCartCount();
    }
  }

  // Expose functions on a global object for use by the pages.
  window.cartManager = {
    loadCart,
    saveCart,
    updateCartCount,
    addToCart,
    removeFromCart,
    updateQuantity
  };

  // On page load update the cart count so that badges reflect the current state.
  document.addEventListener('DOMContentLoaded', updateCartCount);
})();