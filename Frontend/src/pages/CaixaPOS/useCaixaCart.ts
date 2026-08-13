import { useMemo, useState } from "react";
import { TipoProduto } from "../../enums";
import { toast } from "react-toastify";

export interface CartItem {
  id: string | number;
  nome?: string;
  name?: string;
  categoria?: string;
  category?: string;
  tipo?: string;
  type?: string;
  is_revenda?: boolean;
  salePrice?: number;
  preco_venda?: number;
  preco_venda_com_iva?: number;
  taxa_iva?: number;
  stock_atual?: number;
  stock?: number;
  quantidade_atual?: number;
  qty: number;
  desconto_valor?: number;
  desconto_tipo?: "percentual" | "valor";
}

export function useCaixaCart(products: any[], descontoClientePercent: number) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServico, setSelectedServico] = useState<string>("all");
  const [descontoManual, setDescontoManual] = useState<number>(0);

  const displayProducts = useMemo(() => {
    return products.filter((product: any) => {
      const name = product.name || product.nome || "";
      const category = product.category || product.categoria || "";
      const type = product.tipo || "";
      const servico = product.servico || (type === "Revenda" ? "BAR" : type === "Acabado" ? "COZINHA" : type === "Consumivel" ? "ABASTECIMENTO" : "");

      const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesServico = selectedServico === "all" || servico === selectedServico;

      if (category === "Ingredientes") return false;
      if (
        type === TipoProduto.CONSUMIVEL ||
        type === "Consumível" ||
        type === "Consumivel" ||
        type === "ConsumÃ­vel"
      ) {
        return false;
      }

      return matchSearch && matchesServico;
    });
  }, [products, searchTerm, selectedServico]);

  const isRevendaItem = (item: any) => {
    const t = String(item?.tipo || item?.type || "").toUpperCase();
    return t === "REVENDA" || t === "PRODUTO_REVENDA" || item?.is_revenda === true;
  };

  const isOnlyRevendaCart = useMemo(() => {
    if (cart.length === 0) return false;
    return cart.every(isRevendaItem);
  }, [cart]);

  const hasZeroStockItem = useMemo(() => {
    return cart.some((item) => {
      const stock = Number(item.stock_atual ?? item.stock ?? item.quantidade_atual ?? 0);
      return stock <= 0 || Number(item.qty) > stock;
    });
  }, [cart]);

  const cartCalculations = useMemo(() => {
    const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
    const totalBrutoCarrinho = cart.reduce((sum, item) => sum + Number(item.preco_venda || item.salePrice || 0) * Number(item.qty || 1), 0);
    let grossSubtotal = 0;
    let baseTributavel = 0;
    let totalItemDiscounts = 0;
    let calculatedIva = 0;

    cart.forEach((item) => {
      const qty = Number(item.qty || 1);
      const precoVenda = Number(item.preco_venda || item.salePrice || 0);
      const taxaIva = Number(item.taxa_iva || 0);
      const itemGrossSemIva = roundMoney(precoVenda * qty);

      const descValor = Number(item.desconto_valor || 0);
      const descTipo = item.desconto_tipo || "percentual";
      let itemDescAmount = 0;

      if (descValor > 0) {
        if (descTipo === "percentual") {
          itemDescAmount = itemGrossSemIva * (Math.min(100, Math.max(0, descValor)) / 100);
        } else {
          itemDescAmount = Math.min(itemGrossSemIva, descValor);
        }
      }
      // Os descontos globais são rateados na base sem IVA, exatamente como o
      // payload enviado ao servidor para cada linha.
      itemDescAmount += (itemGrossSemIva - itemDescAmount) * (descontoClientePercent / 100);
      if (descontoManual > 0 && totalBrutoCarrinho > 0) {
        itemDescAmount += descontoManual * (itemGrossSemIva / totalBrutoCarrinho);
      }

      itemDescAmount = roundMoney(itemDescAmount);
      const itemBase = roundMoney(Math.max(0, itemGrossSemIva - itemDescAmount));
      const itemIva = roundMoney(itemBase * taxaIva / 100);

      grossSubtotal += itemGrossSemIva;
      baseTributavel += itemBase;
      totalItemDiscounts += itemDescAmount;

      calculatedIva += itemIva;
    });

    // O desconto de cliente/manual é enviado distribuído pelos itens no POS.
    // Esta prévia replica a ordem fiscal: desconto → base tributável → IVA.
    const descontoAutomatico = roundMoney(Math.max(0, grossSubtotal - totalItemDiscounts) * (descontoClientePercent / 100));
    const ivaFinal = roundMoney(calculatedIva);
    const finalTotal = roundMoney(baseTributavel + ivaFinal);

    return {
      subtotal: grossSubtotal,
      totalComIva: roundMoney(grossSubtotal + calculatedIva),
      totalItemDiscounts,
      descontoAutomatico,
      iva: ivaFinal,
      total: finalTotal,
    };
  }, [cart, descontoClientePercent, descontoManual]);

  const addToCart = (product: any) => {
    const isRevenda = isRevendaItem(product);
    const stock = Number(product.stock_atual ?? product.stock ?? product.quantidade_atual ?? 0);

    setCart((currentCart) => {
      const exists = currentCart.find((item) => item.id === product.id);
      const currentQty = exists ? exists.qty : 0;
      const newQty = currentQty + 1;

      const willBeOnlyRevenda = currentCart.length === 0 ? isRevenda : currentCart.every(isRevendaItem) && isRevenda;

      // Standalone Revenda cannot exceed stock
      if (willBeOnlyRevenda && newQty > stock) {
        toast.error(`Produto de revenda solteiro! Stock disponível: ${stock}. Não é permitido vender mais do que o stock.`);
        return currentCart;
      }

      if (exists) {
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, qty: newQty } : item
        );
      }
      return [...currentCart, { ...product, qty: 1, desconto_valor: 0, desconto_tipo: "percentual" }];
    });
  };

  const updateQty = (id: string | number, delta: number) => {
    setCart((currentCart) => {
      const itemToUpdate = currentCart.find((it) => it.id === id);
      if (!itemToUpdate) return currentCart;

      const newQty = itemToUpdate.qty + delta;
      if (newQty <= 0) {
        return currentCart.filter((it) => it.id !== id);
      }

      const isRevenda = isRevendaItem(itemToUpdate);
      const isOnlyRevenda = currentCart.every(isRevendaItem);
      const stock = Number(itemToUpdate.stock_atual ?? itemToUpdate.stock ?? itemToUpdate.quantidade_atual ?? 0);

      if (isOnlyRevenda && isRevenda && newQty > stock) {
        toast.error(`Não é possível vender mais do que o stock disponível (${stock}) para produto de revenda solteiro.`);
        return currentCart;
      }

      return currentCart.map((item) =>
        item.id === id ? { ...item, qty: newQty } : item
      );
    });
  };

  const updateItemDiscount = (id: string | number, desconto_valor: number, desconto_tipo: "percentual" | "valor") => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          desconto_valor: Math.max(0, desconto_valor),
          desconto_tipo,
        };
      })
    );
  };

  const removeItem = (id: string | number) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDescontoManual(0);
  };

  return {
    descontoManual,
    setDescontoManual,
    cart,
    setCart,
    searchTerm,
    setSearchTerm,
    selectedServico,
    setSelectedServico,
    displayProducts,
    subtotal: cartCalculations.subtotal,
    totalComIva: cartCalculations.totalComIva,
    Iva: cartCalculations.iva,
    totalItemDiscounts: cartCalculations.totalItemDiscounts,
    descontoAutomatico: cartCalculations.descontoAutomatico,
    total: cartCalculations.total,
    isOnlyRevendaCart,
    hasZeroStockItem,
    addToCart,
    updateQty,
    updateItemDiscount,
    removeItem,
    clearCart,
  };
}
