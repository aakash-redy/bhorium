import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Hash, ShoppingBag } from "lucide-react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// IMPORT YOUR ADMIN PORTAL HERE
// This must match the folder path in your screenshot
import AdminPortal from "./components/admin/AdminPortal";
const queryClient = new QueryClient();

// ==========================================
// INTEGRATED COMPONENT: OrderSuccess
// ==========================================
const OrderSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <button onClick={() => navigate('/')} className="text-slate-400 font-bold underline">
          No order found. Return to Menu.
        </button>
      </div>
    );
  }

  const { customerName, tokenNumber, totalAmount } = state;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6">
        <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={3} />
      </motion.div>

      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Received!</h1>
      <p className="text-slate-500 font-medium mt-1">Please show this token at the counter.</p>

      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ delay: 0.2 }}
        className="mt-10 w-full max-w-sm"
      >
        <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2.5rem] p-1.5 shadow-2xl shadow-orange-500/30">
          <div className="bg-white rounded-[2.2rem] py-12 flex flex-col items-center relative overflow-hidden text-center">
            <div className="absolute -right-8 -bottom-8 opacity-5 text-9xl font-black pointer-events-none text-orange-950">B</div>
            
            <span className="text-[10px] text-slate-400 font-black tracking-[0.3em] uppercase mb-4">Token Number</span>
            
            <div className="flex items-center gap-3 text-slate-900">
              <Hash className="w-8 h-8 text-orange-500 opacity-40" strokeWidth={4} />
              <span className="text-8xl font-black tracking-tighter leading-none">{tokenNumber}</span>
            </div>
            
            <div className="mt-8 px-6 py-2 bg-slate-50 rounded-full border border-slate-100 font-bold text-slate-600 text-sm">
              Total Order: <span className="text-orange-500 font-black">₹{totalAmount}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-12 w-full max-w-sm">
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
        >
          Order More <ShoppingBag size={18} />
        </button>
      </motion.div>
    </div>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          
          {/* UPDATED: Route now points to the actual AdminPortal component */}
          <Route path="/admin" element={<AdminPortal />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;