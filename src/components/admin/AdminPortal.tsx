import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Clock, Trash2, RefreshCw, ChefHat, Coffee, X, Search, 
  BarChart3, TrendingUp, AlertTriangle, Plus, Power, 
  User, Pencil, Check, Lock, ChevronRight, Settings,
  Printer, CreditCard, CheckCircle2, Key, Archive, ChevronDown, ChevronUp, Layers, Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase"; 

// --- SECURITY HELPER ---
async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// --- TYPES ---
export interface Order {
  id: string;
  customerName: string;
  items: { item_name?: string; quantity: number; price_at_time_of_order?: number }[];
  total: number;
  status: "pending" | "paid" | "preparing" | "completed" | "archived";
  timestamp: string;
  tokenNumber?: number;
  archived_at?: string; 
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  is_veg: boolean;
}

interface AdminPortalProps {
  onExit?: () => void;
}

const PASSCODE = import.meta.env.VITE_ADMIN_PIN || "cravin123"; 
const RECOVERY_KEY = import.meta.env.VITE_RECOVERY_KEY || "cravin-admin-reset";

const cx = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

// --- UI COMPONENTS ---
const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) => (
  <button 
    type="button"
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    className={cx("w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none", checked ? "bg-emerald-500" : "bg-slate-200")}
  >
    <div className={cx("w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200", checked ? "translate-x-4" : "translate-x-0")} />
  </button>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600 border-slate-200",
    paid: "bg-blue-100 text-blue-700 border-blue-200",
    preparing: "bg-amber-100 text-amber-700 border-amber-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return <span className={cx("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", styles[status] || styles.pending)}>{status}</span>;
};

// --- MAIN COMPONENT ---
export default function AdminPortal({ onExit = () => window.history.back() }: AdminPortalProps) {

  // Auth & Recovery State
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("cravin_admin_session") === "active");
  const [inputPasscode, setInputPasscode] = useState("");
  const [authError, setAuthError] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [newForgotPasscode, setNewForgotPasscode] = useState("");

  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [localMenuItems, setLocalMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("bismuth_categories");
    return saved ? JSON.parse(saved) : ["Daily Specials", "Noodles", "Manchurian", "Fried Rice", "Starters", "Biryani", "Coolers", "Snacks"];
  });

  // UI State
  const [activeTab, setActiveTab] = useState<'orders' | 'records' | 'menu' | 'settings'>('orders');
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false); // 🚀 NEW: Hamburger menu state
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>('all');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  // Modals & Popups
  const [showEndDayReport, setShowEndDayReport] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [showPrintConfirm, setShowPrintConfirm] = useState<Order | null>(null);
  const [muteUntil, setMuteUntil] = useState<string | null>(null);

  // Menu Manager State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "Noodles", is_veg: true });
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  // Bluetooth Printer
  const [isPrinterReady, setIsPrinterReady] = useState(false);
  const printerCharacteristic = useRef<any>(null);

  // Persistence for Categories
  useEffect(() => {
    localStorage.setItem("bismuth_categories", JSON.stringify(categories));
  }, [categories]);

  // --- DATA FETCHING ---
  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').neq('status', 'archived').order('created_at', { ascending: false });
    if (data) {
      const transformed: Order[] = data.map(o => ({
        id: o.id,
        customerName: o.customer_name,
        total: o.total_amount,
        status: o.status,
        timestamp: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tokenNumber: o.token_number, 
        items: o.order_items
      }));
      setOrders(transformed);
    }
  };

  const fetchArchivedOrders = async () => {
    const { data } = await supabase.from('orders').select('*').eq('status', 'archived').order('archived_at', { ascending: false });
    if (data) {
      const transformed: Order[] = data.map(o => ({
        id: o.id,
        customerName: o.customer_name,
        total: o.total_amount,
        status: o.status,
        timestamp: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tokenNumber: o.token_number, 
        items: o.order_items,
        archived_at: o.archived_at
      }));
      setArchivedOrders(transformed);
    }
  };

  const fetchMenu = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('name');
    if (data) setLocalMenuItems(data as MenuItem[]);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('restaurants').select('mute_until').eq('id', 1).single();
    if (data) setMuteUntil(data.mute_until);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders();
    fetchMenu();
    fetchSettings();

    const orderChannel = supabase.channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders).subscribe();

    const menuChannel = supabase.channel('admin-menu')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, fetchMenu).subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(menuChannel);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'records' && isAuthenticated) fetchArchivedOrders();
  }, [activeTab, isAuthenticated]);

  const isMuted = useMemo(() => {
    if (!muteUntil) return false;
    return new Date(muteUntil) > new Date();
  }, [muteUntil]);

  const handleMutePopups = async () => {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    const { error } = await supabase.from('restaurants').update({ mute_until: tomorrow.toISOString() }).eq('id', 1);
    if (!error) {
      setMuteUntil(tomorrow.toISOString());
      if (showPrintConfirm) {
        handleConfirmAndPrint(showPrintConfirm);
        setShowPrintConfirm(null);
      }
    } else {
      alert("Failed to save preference: " + error.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Order['status']) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error updating order: " + error.message); 
    else fetchOrders();
  };

  const handleDeleteOrder = async (id: string) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) alert("Error deleting order: " + error.message);
    else fetchOrders();
  };

  const handlePrintAction = (order: Order) => {
    if (isMuted) handleConfirmAndPrint(order); 
    else setShowPrintConfirm(order);   
  };

  // --- AUTH ---
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputPasscode === PASSCODE) {
      localStorage.setItem("cravin_admin_session", "active");
      setIsAuthenticated(true);
      return;
    }
    try {
      const hash = await hashPassword(inputPasscode);
      const { data } = await supabase.from('restaurants').select('admin_password').single();
      if (data && data.admin_password === hash) {
        localStorage.setItem("cravin_admin_session", "active");
        setIsAuthenticated(true);
      } else throw new Error("Invalid");
    } catch (err) {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 500);
      setInputPasscode("");
    }
  };

  const handleRecoveryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryInput !== RECOVERY_KEY) {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 500);
      setRecoveryInput("");
      return;
    }
    if (!newForgotPasscode) return alert("Please enter a new password");
    setPassLoading(true);
    try {
      const secureHash = await hashPassword(newForgotPasscode);
      await supabase.from('restaurants').update({ admin_password: secureHash }).eq('id', 1);
      alert("Password reset successfully! You can now log in.");
      setIsForgotMode(false);
      setRecoveryInput("");
      setNewForgotPasscode("");
      setInputPasscode("");
    } catch (err) {
      alert("Error resetting password.");
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cravin_admin_session");
    setIsAuthenticated(false);
    onExit();
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return alert("Please enter a password");
    setPassLoading(true);
    try {
      const secureHash = await hashPassword(newPassword);
      await supabase.from('restaurants').update({ admin_password: secureHash }).eq('id', 1);
      alert("Password updated securely! Please login again.");
      handleLogout();
    } catch (err) {
      alert("Error updating password.");
    } finally {
      setPassLoading(false);
    }
  };

  // --- BLUETOOTH PRINTER ---
  const initializePrinter = async () => {
    try {
      const nav = navigator as any;
      if (!nav.bluetooth) return alert("Web Bluetooth is not supported on this browser.");
      const device = await nav.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      printerCharacteristic.current = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      setIsPrinterReady(true);
    } catch (e) {
      console.error(e);
    }
  };

  const printOrder = async (order: Order) => {
    if (!printerCharacteristic.current) return;
    const token = order.tokenNumber || order.id.slice(-3);
    const encoder = new TextEncoder();
    let text = `\n    BHORIUM HUB\n--------------------------------\nTOKEN: #${token}\nNAME:  ${order.customerName}\n--------------------------------\n`;
    order.items.forEach((item: any) => { text += `${item.quantity}x ${item.item_name?.substring(0, 18).padEnd(19)}\n`; });
    text += `--------------------------------\n\n\n\n`; 
    try { await printerCharacteristic.current.writeValue(encoder.encode(text)); } 
    catch (e) { setIsPrinterReady(false); }
  };

  const handleConfirmAndPrint = async (order: Order) => {
    await printOrder(order);
    handleUpdateStatus(order.id, 'preparing');
  };

  // --- MENU MANAGEMENT ---
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) return alert("Enter Name & Price");
    const itemPayload = { name: newItem.name, price: parseInt(newItem.price), category: newItem.category, is_veg: newItem.is_veg, available: true };
    const { error } = await supabase.from('menu_items').insert([itemPayload]);
    if (error) alert("Error adding item: " + error.message);
    else {
      setIsAddingItem(false); 
      setNewItem({ name: "", price: "", category: categories[0] || "Noodles", is_veg: true }); 
      fetchMenu(); 
    }
  };

  const handleAddCategory = () => {
    if (!newCatInput) return;
    if (categories.includes(newCatInput)) return alert("Category already exists");
    setCategories([...categories, newCatInput]);
    setNewCatInput("");
  };

  const removeCategory = (cat: string) => {
    if (cat === "Daily Specials") return alert("Cannot delete essential category");
    setCategories(categories.filter(c => c !== cat));
  };

  const startEditingPrice = (item: MenuItem) => {
    setEditingPriceId(item.id);
    setEditPriceValue(item.price.toString());
  };

  const saveNewPrice = async (id: string) => {
    if (!editPriceValue) return;
    const newPrice = parseInt(editPriceValue);
    setLocalMenuItems(prev => prev.map(item => item.id === id ? { ...item, price: newPrice } : item));
    setEditingPriceId(null);
    const { error } = await supabase.from('menu_items').update({ price: newPrice }).eq('id', id);
    if (error) { alert("Error saving price: " + error.message); fetchMenu(); }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    setLocalMenuItems(prev => prev.map(item => item.id === id ? { ...item, available: !current } : item));
    const { error } = await supabase.from('menu_items').update({ available: !current }).eq('id', id);
    if (error) { alert("Error updating availability: " + error.message); fetchMenu(); }
  };

  const toggleVegStatus = async (id: string, current: boolean) => {
    setLocalMenuItems(prev => prev.map(item => item.id === id ? { ...item, is_veg: !current } : item));
    const { error } = await supabase.from('menu_items').update({ is_veg: !current }).eq('id', id);
    if (error) { alert("Error updating veg status: " + error.message); fetchMenu(); }
  };

  const deleteMenuItem = async (id: string) => {
    if (!window.confirm("Delete this item?")) return;
    setLocalMenuItems(prev => prev.filter(i => i.id !== id)); 
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) { alert("Error deleting item: " + error.message); fetchMenu(); }
  };

  // --- COMPUTED DATA ---
  const filteredOrders = useMemo(() => orders.filter(o => 
    (filter === 'all' || o.status === filter) && 
    (o.customerName?.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
     o.tokenNumber?.toString().includes(orderSearchQuery))
  ), [orders, filter, orderSearchQuery]);

  const processedMenuItems = useMemo(() => {
    let items = localMenuItems.filter((item) => item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) || item.category.toLowerCase().includes(menuSearchQuery.toLowerCase()));
    return items.sort((a, b) => {
      if (a.category === 'Daily Specials' && b.category !== 'Daily Specials') return -1;
      if (a.category !== 'Daily Specials' && b.category === 'Daily Specials') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [localMenuItems, menuSearchQuery]);

  const groupedArchives = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    archivedOrders.forEach(order => {
      const key = order.archived_at || 'Unknown Date';
      if (!groups[key]) groups[key] = [];
      groups[key].push(order);
    });
    return Object.entries(groups).map(([date, sessionOrders]) => ({
      date,
      orders: sessionOrders,
      totalRevenue: sessionOrders.reduce((sum, o) => sum + o.total, 0)
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [archivedOrders]);

  const totalRevenue = orders.reduce((sum, o) => o.status !== 'pending' ? sum + (o.total || 0) : sum, 0);

  const endDayStats = useMemo(() => {
    const itemCounts: Record<string, number> = {};
    orders.forEach(order => {
      if (order.status !== 'pending') {
        order.items?.forEach((item) => { 
          const name = item.item_name || "Unknown"; 
          itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1); 
        });
      }
    });
    const sortedItems = Object.entries(itemCounts).sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, count }));
    return { totalRevenue, totalOrders: orders.filter(o => o.status !== 'pending').length, topItem: sortedItems[0] || { name: "N/A", count: 0 }, itemBreakdown: sortedItems };
  }, [orders, totalRevenue]);

  const handleEndDay = async () => {
    const confirmRefresh = window.confirm("Do you want to end the day and reset all earnings to zero? This will clear today's orders from the screen, but keep them in the Records tab.");
    if (!confirmRefresh) return; 

    const orderIds = orders.map(o => o.id);
    const now = new Date().toISOString(); 

    if (orderIds.length > 0) {
      const { error } = await supabase.from('orders').update({ status: 'archived', archived_at: now }).in('id', orderIds);
      if (error) return alert("Failed to archive orders: " + error.message);
    }

    await supabase.from('restaurants').update({ mute_until: null }).eq('id', 1);
    setMuteUntil(null);

    fetchOrders(); 
    setShowEndDayReport(false);
    alert("Day Closed! Earnings have been reset to ₹0. Orders moved to Records.");
  };

  // --- SCREENS ---
  if (!isAuthenticated) {
    // ... Keeping exact same Auth screen code ...
    if (isForgotMode) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-slate-700">
                <Key className="w-8 h-8 text-amber-500" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Recovery Mode</h1>
              <p className="text-slate-400 text-sm font-medium mt-2 text-center">Enter the master recovery key to set a new password.</p>
            </div>
            <form onSubmit={handleRecoveryReset} className="space-y-4">
              <input type="text" value={recoveryInput} onChange={(e) => setRecoveryInput(e.target.value)} className={cx("w-full bg-slate-900 border-2 rounded-2xl py-4 px-6 text-center font-bold tracking-widest outline-none transition-all placeholder:text-slate-700", authError ? "border-red-500 animate-pulse text-red-500" : "border-slate-800 focus:border-amber-500 text-white")} placeholder="Enter Recovery Key" />
              <input type="password" value={newForgotPasscode} onChange={(e) => setNewForgotPasscode(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-800 focus:border-emerald-500 rounded-2xl py-4 px-6 text-center font-bold tracking-widest outline-none transition-all text-white placeholder:text-slate-700" placeholder="New Admin Password" />
              <button type="submit" disabled={passLoading} className="w-full bg-amber-500 text-amber-950 font-black py-4 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-amber-400">
                {passLoading ? "RESETTING..." : "RESET PASSWORD"}
              </button>
            </form>
            <button onClick={() => setIsForgotMode(false)} className="w-full mt-6 text-slate-500 text-xs font-bold hover:text-white transition-colors">Back to Login</button>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-slate-700"><Lock className="w-8 h-8 text-emerald-500" /></div>
            <h1 className="text-2xl font-black tracking-tight">Admin Access</h1>
            <p className="text-slate-400 text-sm font-medium mt-2">Enter your password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={inputPasscode} onChange={(e) => setInputPasscode(e.target.value)} className={cx("w-full bg-slate-900 border-2 rounded-2xl py-4 px-6 text-center text-xl font-bold tracking-widest outline-none transition-all placeholder:text-slate-800", authError ? "border-red-500 animate-pulse text-red-500" : "border-slate-800 focus:border-emerald-500 text-white")} placeholder="Enter Password" autoFocus />
            <button type="submit" className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-emerald-400">UNLOCK <ChevronRight className="w-5 h-5" /></button>
          </form>

          <div className="flex justify-between mt-6 px-2">
            <button onClick={() => setIsForgotMode(true)} className="text-slate-500 text-xs font-bold hover:text-amber-400 transition-colors">Forgot Passcode?</button>
            <button onClick={onExit} className="text-slate-500 text-xs font-bold hover:text-white transition-colors">Close Portal</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">

      {/* 🚀 REFACTORED HEADER (No longer sticky top-0) */}
      <div className="bg-slate-900 text-white p-6 rounded-b-[2rem] shadow-xl relative z-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsNavMenuOpen(!isNavMenuOpen)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                {isNavMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight">Admin Portal</h1>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isPrinterReady ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}/> 
                  {isPrinterReady ? "Printer Ready" : "Printer Offline"}
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Sales Today</p>
                <p className="text-xl font-black text-emerald-400">₹{totalRevenue}</p>
              </div>
              <button onClick={handleLogout} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors hidden sm:block">
                <Power className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>

          {/* 🚀 HAMBURGER DROPDOWN MENU */}
          <AnimatePresence>
            {isNavMenuOpen && (
              <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: 16 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} className="overflow-hidden">
                <div className="flex flex-col gap-2 bg-slate-800/50 p-2 rounded-2xl backdrop-blur-sm border border-slate-700">
                  {[
                    { id: 'orders', icon: ChefHat, label: 'Orders', count: orders.filter(o => o.status === 'pending').length },
                    { id: 'records', icon: Archive, label: 'Records', count: 0 },
                    { id: 'menu', icon: Coffee, label: 'Menu', count: 0 },
                    { id: 'settings', icon: Settings, label: 'Settings', count: 0 }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id as any); setIsNavMenuOpen(false); }} 
                      className={cx("flex items-center justify-between w-full p-4 rounded-xl font-bold text-sm transition-all", activeTab === tab.id ? "bg-white text-slate-900 shadow-lg" : "text-slate-300 hover:bg-slate-700")}
                    >
                      <div className="flex items-center gap-3"><tab.icon className="w-5 h-5" /> {tab.label}</div>
                      {tab.count > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{tab.count}</span>}
                    </button>
                  ))}
                  {/* Mobile logout inside menu */}
                  <button onClick={handleLogout} className="flex sm:hidden items-center gap-3 w-full p-4 rounded-xl font-bold text-sm text-red-400 hover:bg-red-500/10 transition-all">
                    <Power className="w-5 h-5" /> Logout Admin
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isPrinterReady && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex justify-between items-center">
              <span className="text-red-400 text-xs font-bold">Connect thermal printer for receipts</span>
              <button onClick={initializePrinter} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-black">LINK NOW</button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-6">

        {/* ================= 🚀 ORDERS TAB ================= */}
        {activeTab === 'orders' && (
          <>
            {/* 🚀 STICKY SEARCH & FILTERS (Restricted to Numbers) */}
            <div className="space-y-3 sticky top-2 z-30 bg-slate-50/95 backdrop-blur-md py-3 rounded-2xl shadow-sm border border-slate-200">
              <div className="relative px-4">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="Search token number..." 
                  value={orderSearchQuery} 
                  onChange={(e) => setOrderSearchQuery(e.target.value.replace(/\D/g, ''))} // Strictly numbers
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 bg-white shadow-sm font-bold outline-none focus:border-emerald-500 transition-colors" 
                />
              </div>
              <div className="flex gap-2 overflow-x-auto px-4 pb-1 hide-scrollbar">
                {['all', 'pending', 'paid', 'preparing', 'completed'].map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={cx("px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all whitespace-nowrap", filter === f ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-500 border-slate-200")}>{f}</button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pb-24">
              <AnimatePresence>
                {filteredOrders.length === 0 && <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs">No orders found</div>}
                {filteredOrders.map((order) => (
                  <motion.div layout key={order.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-200 relative overflow-hidden group">
                    {/* Status side border */}
                    <div className={cx("absolute left-0 top-0 bottom-0 w-1.5", order.status === 'completed' ? "bg-emerald-500" : order.status === 'preparing' ? "bg-amber-400" : order.status === 'paid' ? "bg-blue-400" : "bg-slate-200")} />
                    
                    {/* 🚀 COMPACT ORDER CARD CONTENT */}
                    <div className="pl-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                           <h2 className="text-3xl font-black text-slate-900">#{order.tokenNumber || "---"}</h2>
                           <StatusBadge status={order.status} />
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-black text-emerald-500">₹{order.total}</p>
                           <p className="text-[10px] font-bold text-slate-400 flex items-center justify-end gap-1 mt-1">
                              <Clock className="w-3 h-3" /> {order.timestamp}
                           </p>
                        </div>
                      </div>

                      <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                         <span className="font-bold text-slate-700">{order.customerName}</span>
                         <span className="text-xs font-black text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">{order.items?.length || 0} Items</span>
                      </div>

                      {/* Small inline items breakdown to save space */}
                      <div className="space-y-1 mb-4">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs px-1">
                            <div className="flex gap-2 items-center">
                              <span className="font-black text-slate-400">{item.quantity}x</span>
                              <span className="font-bold text-slate-600">{item.item_name}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 🚀 WORKFLOW BUTTONS (Massive Primary Action, Small side-by-side delete) */}
                      <div className="flex gap-2">
                        {order.status === 'pending' && <button onClick={() => handleUpdateStatus(order.id, 'paid')} className="flex-1 bg-emerald-500 text-white py-4 rounded-xl font-black active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-lg"><CreditCard className="w-5 h-5"/> VERIFY PAYMENT</button>}
                        
                        {order.status === 'paid' && (
                           <button onClick={() => handlePrintAction(order)} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black active:scale-95 flex items-center justify-center gap-2 shadow-lg text-lg"><Printer className="w-5 h-5"/> PRINT BILL</button>
                        )}

                        {order.status === 'preparing' && <button onClick={() => handleUpdateStatus(order.id, 'completed')} className="flex-1 bg-blue-500 text-white py-4 rounded-xl font-black active:scale-95 flex items-center justify-center gap-2 text-lg"><CheckCircle2 className="w-5 h-5"/> ORDER READY</button>}
                        
                        {order.status !== 'completed' && (
                          <button onClick={() => setOrderToCancel(order.id)} className="w-16 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center border border-red-100">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ... Rest of Tabs (Records, Menu, Settings, Modals) remain unchanged structurally ... */}
        {activeTab === 'records' && (
          <div className="space-y-4 pb-20">
            {groupedArchives.length === 0 ? (
              <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs">No records found</div>
            ) : (
              groupedArchives.map((group, idx) => {
                const isExpanded = expandedRecord === group.date;
                const displayDate = group.date !== 'Unknown Date' 
                  ? new Date(group.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) 
                  : group.date;

                return (
                  <motion.div layout key={idx} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <button onClick={() => setExpandedRecord(isExpanded ? null : group.date)} className="w-full p-6 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center"><Archive className="w-5 h-5" /></div>
                        <div className="text-left">
                          <h3 className="font-black text-slate-900 text-sm md:text-base">{displayDate}</h3>
                          <p className="text-xs font-bold text-slate-400">{group.orders.length} Orders • ₹{group.totalRevenue}</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="text-slate-400 w-5 h-5" /> : <ChevronDown className="text-slate-400 w-5 h-5" />}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="p-6 space-y-3 bg-white border-t border-slate-100">
                            {group.orders.map(order => (
                              <div key={order.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                  <p className="font-black text-slate-900">{order.customerName} <span className="text-orange-500 ml-1">#{order.tokenNumber}</span></p>
                                  <p className="text-[10px] font-bold text-slate-400">{order.timestamp}</p>
                                </div>
                                <p className="font-black text-slate-900">₹{order.total}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* ================= 🚀 MENU TAB ================= */}
        {activeTab === 'menu' && (
          <div className="space-y-6 pb-20">
            <div className="sticky top-[80px] z-30 bg-slate-50/95 backdrop-blur-sm py-2">
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder="Search menu..." value={menuSearchQuery} onChange={(e) => setMenuSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-white shadow-sm font-bold outline-none" /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setIsAddingItem(!isAddingItem)} className="py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95"><Plus className="w-5 h-5" /> {isAddingItem ? "Cancel Item" : "Add Item"}</button>
              <button onClick={() => setIsManagingCategories(!isManagingCategories)} className="py-4 bg-white border-2 border-slate-100 text-slate-900 font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-sm"><Layers className="w-5 h-5" /> Categories</button>
            </div>

            {/* CATEGORY MANAGER */}
            <AnimatePresence>
              {isManagingCategories && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="bg-slate-900 p-6 rounded-[2rem] text-white space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Add New Category</h3>
                    <div className="flex gap-2">
                      <input value={newCatInput} onChange={e => setNewCatInput(e.target.value)} placeholder="Category Name" className="flex-1 bg-slate-800 p-3 rounded-xl font-bold outline-none border border-slate-700 focus:border-emerald-500" />
                      <button onClick={handleAddCategory} className="bg-emerald-500 text-slate-950 p-3 rounded-xl font-black"><Plus className="w-6 h-6" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {categories.map(cat => (
                        <div key={cat} className="bg-slate-800 pl-3 pr-1 py-1 rounded-lg flex items-center gap-2 border border-slate-700">
                          <span className="text-xs font-bold">{cat}</span>
                          <button onClick={() => removeCategory(cat)} className="p-1 hover:bg-red-500 rounded transition-colors"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isAddingItem && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl space-y-4">
                    <input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Item Name" className="w-full bg-slate-50 p-3 rounded-xl font-bold outline-none" />
                    <div className="flex gap-4">
                      <input type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} placeholder="Price" className="w-full bg-slate-50 p-3 rounded-xl font-bold outline-none flex-1" />
                      <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="bg-slate-50 p-3 rounded-xl font-bold outline-none flex-1">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase">Item Type</p>
                        <p className="text-[10px] text-slate-400 font-bold">{newItem.is_veg ? "Vegetarian" : "Non-Vegetarian"}</p>
                      </div>
                      <ToggleSwitch checked={newItem.is_veg} onChange={(c) => setNewItem({...newItem, is_veg: c})} />
                    </div>

                    <button onClick={handleAddItem} className="w-full py-4 bg-emerald-500 text-white font-black rounded-xl active:scale-95">SAVE ITEM</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {processedMenuItems.map((item) => (
                <motion.div layout key={item.id} className={cx("bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center transition-colors relative overflow-hidden", item.available ? "border-slate-100" : "border-slate-100 bg-slate-50/50", item.category === 'Daily Specials' && "border-amber-200 bg-amber-50/30")}>
                  {item.category === 'Daily Specials' && <div className="absolute top-0 left-0 bg-amber-400 text-amber-900 text-[8px] font-black px-2 py-0.5">SPECIAL</div>}
                  <div className="flex items-center gap-4">

                    <div className={cx("w-4 h-4 border-2 flex items-center justify-center p-[2px]", item.is_veg ? "border-green-600" : "border-red-600")}>
                      <div className={cx("w-full h-full rounded-full", item.is_veg ? "bg-green-600" : "bg-red-600")} />
                    </div>

                    <div className="mt-1">
                      <h4 className={cx("font-bold text-lg leading-tight", !item.available && "text-slate-400 line-through")}>{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {editingPriceId === item.id ? (
                          <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-400">₹</span><input type="number" autoFocus value={editPriceValue} onChange={(e) => setEditPriceValue(e.target.value)} className="w-16 bg-slate-100 rounded px-1 py-0.5 text-sm font-bold outline-emerald-500" /><button onClick={() => saveNewPrice(item.id)} className="bg-emerald-500 text-white p-1 rounded-full hover:bg-emerald-600"><Check className="w-3 h-3" /></button></div>
                        ) : (
                          <><p className="text-xs font-bold text-slate-400 uppercase">₹{item.price} • {item.category}</p><button onClick={() => startEditingPrice(item)} className="text-slate-300 hover:text-indigo-500 transition-colors"><Pencil className="w-3 h-3" /></button></>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">

                    <div className="flex flex-col items-center gap-1">
                      <button 
                        onClick={() => toggleVegStatus(item.id, item.is_veg)} 
                        className={cx("w-8 h-8 rounded-lg flex items-center justify-center border font-black text-[10px]", item.is_veg ? "bg-green-50 border-green-200 text-green-600" : "bg-red-50 border-red-200 text-red-600")}
                      >
                        {item.is_veg ? "V" : "NV"}
                      </button>
                      <span className="text-[7px] font-black text-slate-300 uppercase">Type</span>
                    </div>

                    <div className="flex flex-col items-center gap-1"><ToggleSwitch checked={item.available} onChange={() => toggleAvailability(item.id, item.available)} /><span className="text-[7px] font-black text-slate-300 uppercase">{item.available ? "Stock" : "Out"}</span></div>
                    <button onClick={() => deleteMenuItem(item.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ================= 🚀 SETTINGS TAB ================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 pb-20">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center"><Lock className="w-6 h-6 text-slate-400" /></div>
                <div><h3 className="text-xl font-black text-slate-900">Security</h3><p className="text-xs font-bold text-slate-400">Manage your access</p></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">New Admin Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new secure password" className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold outline-emerald-500 text-slate-900 placeholder:text-slate-300" />
                </div>
                <button onClick={handleUpdatePassword} disabled={passLoading} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2">{passLoading ? "UPDATING..." : "UPDATE PASSWORD"}</button>
                <p className="text-[10px] font-bold text-slate-400 text-center leading-relaxed">Note: This will encrypt your password using SHA-256 (Bank-Level Security).<br/>Once changed, you must login with the new password.</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 🚀 FLOATING END DAY REPORT BUTTON */}
      <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-40 pointer-events-none">
        <button onClick={() => setShowEndDayReport(true)} className="pointer-events-auto bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl px-6 py-3 rounded-full flex items-center gap-3 font-bold active:scale-95 text-slate-900">
          <BarChart3 className="w-4 h-4" /> End Day Report
        </button>
      </div>

      {/* 🚀 PRINT CONFIRM MODAL */}
      <AnimatePresence>
        {showPrintConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPrintConfirm(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative z-10 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><Printer className="w-8 h-8 text-slate-900" /></div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Print Bill?</h3>
              <p className="text-sm font-medium text-slate-500 mb-8">Are you sure you want to print the bill for <span className="text-slate-900 font-bold">{showPrintConfirm.customerName}</span>?</p>
              <div className="space-y-3">
                <button onClick={() => { handleConfirmAndPrint(showPrintConfirm); setShowPrintConfirm(null); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black active:scale-95 transition-all">YES, PRINT</button>
                <button onClick={handleMutePopups} className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Don't ask again for 24h</button>
                <button onClick={() => setShowPrintConfirm(null)} className="w-full py-2 text-xs font-bold text-slate-300">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 END DAY REPORT MODAL */}
      <AnimatePresence>
        {showEndDayReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowEndDayReport(false)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10">
              <div className="bg-slate-900 p-8 text-white relative">
                <button onClick={() => setShowEndDayReport(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
                <h2 className="text-2xl font-black mb-1">Daily Summary</h2>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md"><p className="text-xs font-bold text-slate-400 uppercase">Sales</p><p className="text-2xl font-black text-emerald-400 mt-1">₹{totalRevenue}</p></div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md"><p className="text-xs font-bold text-slate-400 uppercase">Orders</p><p className="text-2xl font-black text-white mt-1">{endDayStats.totalOrders}</p></div>
                </div>
              </div>
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Top Seller</h3>
                  <div className="bg-amber-50 p-4 rounded-2xl flex justify-between border border-amber-100"><span className="font-bold">{endDayStats.topItem.name}</span><span className="font-black text-amber-600">{endDayStats.topItem.count} Sold</span></div>
                </div>
                <div className="max-h-[150px] overflow-y-auto space-y-2 mb-8">
                  {endDayStats.itemBreakdown.map((item, idx) => (<div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg"><span className="text-slate-600">{item.name}</span><span className="font-bold">{item.count}</span></div>))}
                </div>
                <button onClick={handleEndDay} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"><RefreshCw className="w-4 h-4" /> CLOSE DAY & RESET</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 CANCEL ORDER MODAL */}
      <AnimatePresence>
        {orderToCancel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOrderToCancel(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative z-10 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 shadow-inner"><AlertTriangle className="w-8 h-8" /></div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Delete Record?</h3>
              <p className="text-sm font-medium text-slate-500 mb-8">This action will permanently remove the order from the list.</p>
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button onClick={() => setOrderToCancel(null)} className="py-3 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors">Keep</button>
                <button onClick={() => { handleDeleteOrder(orderToCancel); setOrderToCancel(null); }} className="py-3 rounded-xl font-bold bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all">Yes, Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}