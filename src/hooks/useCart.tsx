import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    const cartProduct = cart.filter(product => product.id === productId);
    if (cartProduct.length) {
      updateProductAmount({
        productId: productId,
        amount: cartProduct[0].amount + 1
      });

      return;
    }

    try {
      const response = await api.get(`products/${productId}`);

      if (response.data) {
        const product = response.data;
        product.amount = 1;

        const updatedCart = [...cart, response.data];

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = cart.filter(product => product.id !== productId);

      if (updatedCart.length === cart.length) {
        throw new Error();
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount === 0) {
      return;
    }

    try {
      const response = await api.get(`stock/${productId}`);

      if (response.data?.amount >= amount) {
        const updatedCart = cart.map(product => {
          if (product.id === productId) {
            product.amount = amount;
          }

          return product;
        });

        setCart(updatedCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
