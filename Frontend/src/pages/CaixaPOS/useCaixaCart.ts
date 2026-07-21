import { useMemo, useState } from "react";
import { TipoProduto } from "../../enums";

export function useCaixaCart(products: any[], descontoClientePercent: number) {
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const displayProducts = useMemo(() => {
    return products.filter((product: any) => {
      const name = product.name || product.nome || "";
      const category = product.category || product.categoria || "";
      const type = product.tipo || "";
      const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase());

      if (category === "Ingredientes") return false;
      if (
        type === TipoProduto.CONSUMIVEL ||
        type === "Consumível" ||
        type === "Consumivel" ||
        type === "ConsumÃ­vel"
      ) {
        return false;
      }

      return matchSearch;
    });
  }, [products, searchTerm]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + Number(item.salePrice || item.preco_venda || item.preco_iva || 0) * Number(item.qty),
        0
      ),
    [cart]
  );

  const totalComIva = useMemo(
    () =>
      cart.reduce((sum, item) => {
        if (Number(item.preco_iva) > 0 && Number(item.taxa_iva) > 0) {
          return sum + Number(item.preco_iva) * Number(item.qty);
        }
        return sum + Number(item.preco_venda || 0) * Number(item.qty);
      }, 0),
    [cart]
  );

  const iva = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const precoVenda = Number(item.preco_venda || 0);
        const precoIva = Number(item.preco_iva || precoVenda);
        return sum + (precoIva - precoVenda) * Number(item.qty);
      }, 0),
    [cart]
  );

  const descontoAutomatico = subtotal * (descontoClientePercent / 100);
  const total = Math.max(0, totalComIva - descontoAutomatico);

  const addToCart = (product: any) => {
    setCart((currentCart) => {
      const exists = currentCart.find((item) => item.id === product.id);
      if (exists) {
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...currentCart, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string | number, delta: number) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) return item;
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      })
    );
  };

  const removeItem = (id: string | number) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  return {
    cart,
    setCart,
    searchTerm,
    setSearchTerm,
    displayProducts,
    subtotal,
    totalComIva,
    Iva: iva,
    descontoAutomatico,
    total,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
  };
}
