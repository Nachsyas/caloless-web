import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// TAMBAHAN: Kita definisikan struktur Product di sini agar Vercel tidak rewel
export interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
}

export interface CartItem extends Product {
  quantity: number
}

interface CartStore {
  items: CartItem[]
  isUinMalang: boolean
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setIsUinMalang: (value: boolean) => void

  // Computed values getters (for easy access in components)
  getTotalItems: () => number
  getSubtotal: () => number
  getDiscount: () => number
  getShippingFee: () => number
  getTotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isUinMalang: true, // Default to true as per promo "Free Ongkir UIN Malang"

      addItem: (product) => set((state) => {
        const existingItem = state.items.find(item => item.id === product.id);
        if (existingItem) {
          return {
            items: state.items.map(item =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            )
          };
        }
        return { items: [...state.items, { ...product, quantity: 1 }] };
      }),

      removeItem: (productId) => set((state) => ({
        items: state.items.filter(item => item.id !== productId)
      })),

      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(item =>
          item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
        ).filter(item => item.quantity > 0)
      })),

      clearCart: () => set({ items: [] }),

      setIsUinMalang: (value) => set({ isUinMalang: value }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getDiscount: () => {
        // Promo Beli 5 Gratis 1 (per product)
        // For every 6 items of the same product, 1 is free
        return get().items.reduce((totalDiscount, item) => {
          const freeItems = Math.floor(item.quantity / 6);
          return totalDiscount + (freeItems * item.price);
        }, 0);
      },

      getShippingFee: () => {
        const { items, isUinMalang } = get();
        if (items.length === 0) return 0;
        if (isUinMalang) return 0; // Free Ongkir UIN Malang
        return 10000; // Flat rate non-UIN
      },

      getTotal: () => {
        const state = get();
        return state.getSubtotal() - state.getDiscount() + state.getShippingFee();
      }
    }),
    {
      name: 'caloless-cart-storage', // name of the item in the storage (must be unique)
    }
  )
)