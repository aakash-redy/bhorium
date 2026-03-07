import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Search, ShoppingBag, X } from "lucide-react";
import { MENU_CATEGORIES, MENU_ITEMS, MenuItem } from "@/lib/menu-data";

interface MenuStepProps {
  onAddItem: (item: MenuItem) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  totalItems: number;
  totalPrice: number;
  onViewBag: () => void;
  cart: { id: string; quantity: number }[];
}

export default function MenuStep({
  onAddItem,
  onUpdateQuantity,
  totalItems,
  totalPrice,
  onViewBag,
  cart,
}: MenuStepProps) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    return MENU_ITEMS.filter((item) => {
      const matchesCategory =
        activeCategory.toUpperCase() === "ALL" ||
        item.category.toUpperCase() === activeCategory.toUpperCase();
      const matchesSearch = 
        item.name.toLowerCase().includes(cleanQuery) || 
        item.category.toLowerCase().includes(cleanQuery);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const groupedItems = useMemo(() => {
    if (activeCategory.toUpperCase() !== "ALL" || searchQuery) return null;
    const groups: Record<string, MenuItem[]> = {};
    MENU_ITEMS.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [activeCategory, searchQuery]);

  const getItemQty = useCallback((id: string): number => {
    const cartItem = cart.find((c) => c.id === id);
    return cartItem ? Number(cartItem.quantity) : 0;
  }, [cart]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] selection:bg-orange-100">
      {/* Header & Search */}
      <div className="bg-[#0F172A] p-6 pb-14">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ rotate: -10 }} 
              animate={{ rotate: 0 }}
              className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-orange-500 text-2xl shadow-xl shadow-black/40"
            >
              B
            </motion.div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight leading-none">Bismuth</h1>
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">Node A | Fuel Station</p>
            </div>
          </div>
        </div>

        {/* HIGH-VISIBILITY SEARCH BAR */}
        <div className="relative max-w-2xl mx-auto group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            placeholder="Search fuel, snacks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1E293B] border-2 border-slate-700/50 rounded-2xl py-4.5 pl-12 pr-12 text-white placeholder:text-slate-500 focus:border-orange-500 focus:bg-[#1e293b] focus:ring-4 focus:ring-orange-500/10 transition-all outline-none shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-slate-700 rounded-full text-slate-300 hover:text-white transition-all active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sticky Category Scroller */}
      <div className="px-4 -mt-6 sticky top-0 z-30 bg-[#F8FAFC]/80 backdrop-blur-xl border-b border-slate-100/50">
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-4 max-w-5xl mx-auto">
          {MENU_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                  setActiveCategory(cat);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`shrink-0 px-8 py-3 rounded-2xl text-[11px] font-black tracking-widest transition-all duration-300 ${
                activeCategory.toUpperCase() === cat.toUpperCase()
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105"
                  : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 shadow-sm"
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 mt-8 pb-48">
        <div className="max-w-5xl mx-auto space-y-12">
          {(activeCategory.toUpperCase() !== "ALL" || searchQuery) ? (
            <div className="grid gap-4">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  qty={getItemQty(item.id)}
                  onAddItem={onAddItem}
                  onUpdateQuantity={onUpdateQuantity}
                />
              ))}
            </div>
          ) : (
            groupedItems && Object.entries(groupedItems).map(([category, items]) => (
              <section key={category}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{category}</h2>
                </div>
                <div className="grid gap-4">
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      qty={getItemQty(item.id)}
                      onAddItem={onAddItem}
                      onUpdateQuantity={onUpdateQuantity}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      {/* Floating Checkout Bag */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100 p-5 px-8 flex items-center justify-between shadow-[0_-20px_50px_rgba(0,0,0,0.06)] z-50"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                Total Payload
              </span>
              <span className="text-3xl font-black text-slate-900 leading-none tabular-nums">
                ₹{totalPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onViewBag}
              className="group relative flex items-center bg-[#0F172A] hover:bg-black transition-all rounded-[22px] p-1.5 pl-8 pr-1.5 shadow-2xl shadow-slate-300"
            >
              <span className="text-white font-black text-sm tracking-widest mr-6">
                VIEW BAG
              </span>
              <div className="bg-orange-500 w-12 h-12 rounded-[18px] flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-4 h-4 text-white absolute -translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                <span className="text-white font-black text-lg tabular-nums group-hover:opacity-0 transition-opacity">
                  {totalItems}
                </span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItemCard({ item, qty, onAddItem, onUpdateQuantity }: {
  item: MenuItem; qty: number; onAddItem: (item: MenuItem) => void; onUpdateQuantity: (id: string, q: number) => void;
}) {
  const handleQtyChange = (e: React.MouseEvent, amount: number) => {
    e.stopPropagation(); 
    e.preventDefault(); 
    const currentQty = Number(qty) || 0;
    onUpdateQuantity(item.id, Math.max(0, currentQty + amount));
  };

  return (
    <motion.div 
        layout 
        className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-slate-200 group"
    >
      <div className="flex-1 pr-4">
        <p className="text-orange-500 text-[9px] font-black uppercase tracking-wider mb-1">{item.category}</p>
        <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-orange-600 transition-colors">{item.name}</h3>
        <p className="text-slate-900 font-black text-2xl mt-3 tracking-tighter">₹{item.price.toLocaleString('en-IN')}</p>
      </div>

      <div className="flex items-center min-w-[140px] justify-end">
        {qty === 0 ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onAddItem(item);
            }}
            className="h-12 px-8 rounded-2xl bg-orange-500 text-white font-black text-xs hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/25 uppercase flex items-center gap-2"
          >
            <Plus className="w-4 h-4" strokeWidth={4} /> Add
          </motion.button>
        ) : (
          <div className="flex items-center bg-[#F1F5F9] rounded-2xl p-1.5 border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={(e) => handleQtyChange(e, -1)}
              className="w-11 h-11 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-orange-500 transition-all active:scale-90"
            >
              <Minus className="w-4 h-4" strokeWidth={4} />
            </button>
            <span className="w-10 text-center text-slate-900 font-black text-lg tabular-nums">
                {Number(qty)}
            </span>
            <button
              type="button"
              onClick={(e) => handleQtyChange(e, 1)}
              className="w-11 h-11 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-orange-500 transition-all active:scale-90"
            >
              <Plus className="w-4 h-4" strokeWidth={4} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}