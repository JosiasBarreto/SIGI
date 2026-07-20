export const updateQty = (id: string | number, delta: number, cart, setCart) => {
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          
          return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
      })
    );
  };