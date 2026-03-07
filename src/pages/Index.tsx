import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Leaf, Plus, Minus, ShoppingBag, X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// --- Inline Utility ---
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

// --- Types ---
interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  available: boolean;
  is_veg: boolean; 
}
interface CartItem {
  uniqueKey: string;
  item: MenuItem;
  quantity: number;
  instructions?: string;
}

// ==========================================
// INLINE COMPONENT: Category Navigation
// ==========================================
const CategoryNav = ({ categories, activeCategory, onSelect }: any) => (
  <div className="flex gap-2 overflow-x-auto px-4 pb-4 scrollbar-hide">
    {categories.map((c: string) => (
      <button 
        key={c} 
        onClick={() => onSelect(c)} 
        className={cn(
          "px-5 py-2.5 rounded-2xl font-black whitespace-nowrap transition-all text-sm shadow-sm border active:scale-95", 
          activeCategory === c 
            ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20" 
            : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
        )}
      >
        {c}
      </button>
    ))}
  </div>
);

// ==========================================
// INLINE COMPONENT: Cart Drawer
// ==========================================
const CartDrawer = ({ open, onClose, cartItems, onAdd, onRemove, onPlaceOrder }: any) => {
  const [name, setName] = useState("");
  const [showConfirm, setShowConfirm] = useState(false); // NEW STATE FOR CONFIRMATION
  const [isProcessing, setIsProcessing] = useState(false); // To prevent double clicks while routing

  if (!open) return null;
  const total = cartItems.reduce((sum: number, i: any) => sum + (i.item.price * i.quantity), 0);

  const handleFinalConfirm = async () => {
    setIsProcessing(true);
    await onPlaceOrder(name);
    // Modal will close automatically via navigation in the parent, but we can reset state just in case
    setTimeout(() => {
      setIsProcessing(false);
      setShowConfirm(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      
      {/* 🚀 THE CONFIRMATION MODAL (Overlays the cart) */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="absolute inset-x-4 bottom-8 z-50 bg-white rounded-[2rem] p-8 shadow-2xl flex flex-col text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm -mt-12">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">Confirm Order?</h3>
            <p className="text-slate-500 font-bold text-sm mb-6 leading-relaxed">
              Hey <span className="text-slate-900">{name}</span>, your total is <span className="text-emerald-600">₹{total}</span>. Ready to send this to the kitchen?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowConfirm(false)} 
                disabled={isProcessing}
                className="py-4 rounded-2xl font-black bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                GO BACK
              </button>
              <button 
                onClick={handleFinalConfirm} 
                disabled={isProcessing}
                className="py-4 rounded-2xl font-black bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex justify-center items-center"
              >
                {isProcessing ? "SENDING..." : "YES, ORDER IT"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }} 
        transition={{ type: "spring", damping: 25, stiffness: 200 }} 
        className={cn("bg-white w-full rounded-t-[2.5rem] p-6 relative z-10 max-h-[85vh] flex flex-col shadow-2xl", showConfirm && "opacity-40 pointer-events-none grayscale-[50%] transition-all duration-300")}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Your Order</h2>
          <button onClick={onClose} className="p-3 bg-slate-100 text-slate-500 hover:text-slate-900 rounded-2xl transition-all active:scale-90"><X className="w-6 h-6"/></button>
        </div>
        
        {cartItems.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-50">
             <ShoppingBag className="w-16 h-16 mb-4 text-slate-300" />
             <p className="font-bold text-slate-500">Your cart is empty</p>
           </div>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-4 mb-6 pr-2">
            {cartItems.map((ci: any) => (
               <div key={ci.uniqueKey} className="flex justify-between items-center bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn("w-3 h-3 rounded-sm border flex items-center justify-center shrink-0", ci.item.is_veg ? "border-emerald-500" : "border-rose-600")}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", ci.item.is_veg ? "bg-emerald-500" : "bg-rose-600")} />
                      </div>
                      <p className="font-bold text-slate-800 leading-tight line-clamp-1">{ci.item.name}</p>
                    </div>
                    <p className="text-lg font-black text-slate-900 ml-5">₹{ci.item.price * ci.quantity}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1.5 shadow-inner">
                    <button onClick={() => onRemove(ci.item.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg font-black text-slate-600 shadow-sm active:scale-90 transition-all"><Minus className="w-4 h-4" /></button>
                    <span className="font-black text-sm w-4 text-center">{ci.quantity}</span>
                    <button onClick={() => onAdd(ci.item.id)} className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-lg font-black shadow-md active:scale-90 transition-all"><Plus className="w-4 h-4" /></button>
                  </div>
               </div>
            ))}
          </div>
        )}

        {cartItems.length > 0 && (
          <div className="pt-4 mt-auto">
            <input type="text" placeholder="Enter your name for the order" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold mb-4 outline-none focus:ring-2 ring-emerald-500 placeholder:text-slate-400 transition-all"/>
            
            {/* CHANGED: Opens confirmation popup instead of placing order instantly */}
            <button 
              onClick={() => setShowConfirm(true)} 
              disabled={!name} 
              className="w-full bg-emerald-500 text-white font-black text-lg py-5 rounded-2xl active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              PLACE ORDER • ₹{total}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: Menu Item Card
// ==========================================
const MenuItemCard = ({ item, quantity, onAdd, onRemove }: { item: MenuItem; quantity: number; onAdd: () => void; onRemove: () => void; }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={cn("bg-white p-4 rounded-[1.5rem] border shadow-sm flex justify-between items-start gap-4 transition-all", !item.available ? 'opacity-60 grayscale border-slate-100' : 'border-slate-100 active:scale-[0.98]')}>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("w-3 h-3 rounded-sm border flex items-center justify-center shrink-0", item.is_veg ? "border-emerald-500" : "border-rose-600")}>
          <div className={cn("w-1.5 h-1.5 rounded-full", item.is_veg ? "bg-emerald-500" : "bg-rose-600")} />
        </div>
        <h4 className="font-bold text-lg text-slate-900 leading-tight">{item.name}</h4>
      </div>
      <p className="text-sm font-bold text-slate-400 mt-1 line-clamp-2 leading-relaxed">
        {item.description || "Freshly prepared with premium ingredients."}
      </p>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-lg font-black text-slate-900">₹{item.price}</span>
      </div>
    </div>
    <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
      {item.available ? (
        quantity > 0 ? (
           <div className="flex flex-col items-center bg-slate-100 rounded-xl p-1 gap-2 shadow-inner">
             <button onClick={onAdd} className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition-all"><Plus className="w-4 h-4" /></button>
             <span className="font-black text-sm">{quantity}</span>
             <button onClick={onRemove} className="w-9 h-9 bg-white text-slate-900 border border-slate-200 rounded-lg flex items-center justify-center active:scale-90 transition-all"><Minus className="w-4 h-4" /></button>
           </div>
        ) : (
           <button onClick={onAdd} className="h-10 px-5 bg-white border-2 border-slate-100 text-emerald-600 font-black rounded-xl shadow-sm uppercase text-xs hover:bg-emerald-50 active:scale-95 transition-all">ADD</button>
        )
      ) : (
        <div className="h-10 px-2 bg-slate-100 text-slate-400 font-bold rounded-xl text-[10px] flex items-center justify-center uppercase border border-slate-200">Sold Out</div>
      )}
    </div>
  </motion.div>
);

const MenuSkeleton = () => (
  <div className="space-y-4 p-4">
    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[1.5rem] animate-pulse" />)}
  </div>
);

// ==========================================
// MAIN COMPONENT: Index
// ==========================================
export default function Index() {
  const { shopId } = useParams(); 
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showSplash, setShowSplash] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isVegOnlyMode, setIsVegOnlyMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("bhorium_splash_seen");
    
    if (hasSeenSplash) {
      setShowSplash(false);
    } else {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("bhorium_splash_seen", "true");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSecretTap = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    setTapCount(prev => prev + 1);
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => setTapCount(0), 1000); 
  };

  useEffect(() => {
    if (tapCount >= 3) {
      setTapCount(0);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      navigate('/admin'); 
    }
  }, [tapCount, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'a') navigate('/admin');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    fetchMenu();
    const channel = supabase.channel('menu-updates').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'menu_items' }, (payload) => {
        const updatedItem = payload.new as MenuItem;
        setMenuItems((prev) => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [shopId]);

  const fetchMenu = async () => {
    setLoading(true);
    let { data, error } = await supabase.from('menu_items').select('*').order('name');
    if (error) {
       console.error("Supabase fetch error:", error);
       toast({ title: "Error fetching menu", variant: "destructive" });
    }
    setMenuItems(data || []);
    setLoading(false);
  };

  const categories = useMemo(() => {
    if (menuItems.length === 0) return ["All"];
    const filtered = menuItems.filter(i => (i.name?.toLowerCase().includes(searchQuery.toLowerCase()) || i.description?.toLowerCase().includes(searchQuery.toLowerCase())));
    const uniqueCats = [...new Set(filtered.map(i => i.category))];
    const PRIORITY_CAT = "Daily Specials";
    const hasPriority = uniqueCats.includes(PRIORITY_CAT);
    const otherCats = uniqueCats.filter(c => c !== PRIORITY_CAT).sort(); 
    return hasPriority ? ["All", PRIORITY_CAT, ...otherCats] : ["All", ...otherCats];
  }, [menuItems, searchQuery]);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    if (category === "All") window.scrollTo({ top: 0, behavior: 'smooth' });
    else {
      const element = document.getElementById(category);
      if (element) window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 180, behavior: 'smooth' });
    }
  };

  const addToCart = (item: MenuItem) => {
    if (navigator.vibrate) navigator.vibrate(20);
    const uniqueKey = item.id; 
    setCartItems(prev => {
      const existing = prev.find(i => i.uniqueKey === uniqueKey);
      if (existing) return prev.map(i => i.uniqueKey === uniqueKey ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { uniqueKey, item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    if (navigator.vibrate) navigator.vibrate(20);
    setCartItems(prev => prev.map(i => i.uniqueKey === itemId ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
  };

  const handlePlaceOrder = async (customerName: string) => {
  if (cartItems.length === 0) return;

  const finalToken = Math.floor(Math.random() * 900) + 100;
  const totalAmount = cartItems.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);

  const { data, error } = await supabase.from('orders').insert([{
      customer_name: customerName,
      total_amount: totalAmount,
      status: 'pending', 
      token_number: finalToken,
      order_items: cartItems.map(i => ({ 
        item_id: i.item.id, 
        item_name: i.item.name, 
        quantity: i.quantity, 
        price_at_time_of_order: i.item.price, 
        is_veg: i.item.is_veg 
      }))
    }]).select().single();

  if (!error) {
    setCartItems([]);
    setIsCartOpen(false);
    navigate('/order-success', { 
      state: { 
        orderId: data.id, 
        customerName, 
        totalAmount, 
        tokenNumber: finalToken 
      } 
    });
  } else {
    toast({ title: "Order Failed", variant: "destructive" });
  }
};

  const getItemQuantity = (itemId: string) => cartItems.filter(i => i.item.id === itemId).reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans selection:bg-emerald-500/30">
      
      {/* SPLASH SCREEN */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="text-center"
            >
              <h1 className="text-5xl font-black tracking-tight mb-3">Bhorium</h1>
              <p className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase">
                Powered by Cravi'n
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900 text-white p-6 pb-8 rounded-b-[2.5rem] shadow-2xl relative z-10 mt-[-1px]">
        <div className="flex justify-between items-center mb-6">
          <h1 
            onClick={handleSecretTap} 
            className="text-3xl font-black tracking-tight pl-2 cursor-pointer select-none active:scale-95 transition-transform"
          >
            Bhorium
          </h1>

          <button 
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(20);
              setIsVegOnlyMode(!isVegOnlyMode);
            }}
            className={cn(
              "flex items-center gap-3 px-4 h-14 rounded-2xl transition-all border-2 active:scale-95", 
              isVegOnlyMode ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800 border-slate-700 text-slate-400'
            )}
          >
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-black uppercase tracking-wider leading-none mb-1">Veg Only</span>
              <span className={cn("text-[10px] font-bold leading-none", isVegOnlyMode ? 'text-emerald-100' : 'text-slate-500')}>
                {isVegOnlyMode ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className={cn("p-1.5 rounded-lg transition-colors", isVegOnlyMode ? "bg-white/20" : "bg-slate-700")}>
              <Leaf className={cn("w-4 h-4", isVegOnlyMode ? "fill-white" : "")} />
            </div>
          </button>
        </div>
        
        <div className="relative mt-2">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input type="text" placeholder="Search menu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
        </div>
      </div>

      {/* FIXED CATEGORY NAV */}
      <div className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-md pt-4 shadow-sm border-b border-slate-200/60 -mt-2 mb-2"> 
        <CategoryNav categories={categories} activeCategory={activeCategory} onSelect={handleCategoryClick} />
      </div>

      <div className="p-4 space-y-8 mt-2 min-h-[50vh]">
        {loading ? <MenuSkeleton /> : (
          <>
            {!loading && menuItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 opacity-50 text-slate-400">
                 <p className="font-bold">No menu items found in database.</p>
              </div>
            )}
            
            {categories.filter(c => c !== "All").map((cat) => {
              const categoryItems = menuItems.filter(item => item.category === cat && (item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.toLowerCase())) && (isVegOnlyMode ? item.is_veg === true : true));
              if (categoryItems.length === 0) return null;
              return (
                <div key={cat} id={cat} className="scroll-mt-40">
                  <div className="flex items-center gap-3 mb-4 pl-2">
                    <div className={cn("h-6 w-1 rounded-full", cat === "Daily Specials" ? "bg-amber-400" : "bg-emerald-500")} />
                    <h3 className={cn("text-xl font-black leading-none", cat === "Daily Specials" ? "text-amber-600" : "text-slate-900")}>{cat}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {categoryItems.map((item) => (
                      <MenuItemCard key={item.id} item={item} quantity={getItemQuantity(item.id)} onAdd={() => addToCart(item)} onRemove={() => removeFromCart(item.id)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <AnimatePresence>
        {isCartOpen && (
          <CartDrawer 
            open={isCartOpen} 
            onClose={() => setIsCartOpen(false)}
            cartItems={cartItems}
            onAdd={(id: string) => { const item = menuItems.find(i => i.id === id); if (item) addToCart(item); }}
            onRemove={removeFromCart}
            onPlaceOrder={handlePlaceOrder}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {!isCartOpen && cartItems.length > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 left-4 right-4 z-30">
            <button onClick={() => setIsCartOpen(true)} className="w-full bg-slate-900 text-white p-4 rounded-[1.5rem] shadow-2xl flex items-center justify-between border-t border-slate-800 active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <span className="bg-emerald-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border-2 border-slate-900">{cartItems.reduce((a, b) => a + b.quantity, 0)}</span>
                <div className="text-left"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p><p className="text-2xl font-black leading-none">₹{cartItems.reduce((s, i) => s + (i.item.price * i.quantity), 0)}</p></div>
              </div>
              <span className="font-bold text-sm flex items-center gap-2 bg-slate-800 px-5 py-3 rounded-xl border border-slate-700">View Bag <ShoppingBag className="w-4 h-4 text-emerald-400" /></span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}