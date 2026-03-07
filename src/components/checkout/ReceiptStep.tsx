import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Hash } from "lucide-react";

// --- Logic to handle status tracking ---
const STAGES = ["Pending", "Paid", "Completed"] as const;

function getStageIndex(status: string) {
  const s = status?.toLowerCase() || 'pending';
  if (s === 'completed' || s === 'ready') return 2;
  if (s === 'paid' || s === 'preparing') return 1;
  return 0; // pending
}

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Pulling the order data passed from navigate() in Index.tsx
  const order = location.state;

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <button onClick={() => navigate('/')} className="text-slate-500 font-bold underline">
          No order found. Go back to menu.
        </button>
      </div>
    );
  }

  const currentStage = getStageIndex(order.status);
  const progressWidth = currentStage === 0 ? 0 : currentStage === 1 ? 50 : 100;
  const displayToken = order.tokenNumber || order.orderId?.slice(-4).toUpperCase() || "???";

  return (
    <div className="flex flex-col items-center min-h-screen px-4 pt-12 pb-8 bg-[#F8FAFC] font-sans">
      
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
      >
        <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={3} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="text-3xl font-black text-slate-800 tracking-tight mt-6"
      >
        Order Placed!
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="text-slate-500 font-medium mt-2"
      >
        Waiting for kitchen verification...
      </motion.p>

      {/* Token Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
        className="mt-10 w-full max-w-sm"
      >
        <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2rem] p-1.5 shadow-2xl shadow-orange-500/20">
          <div className="bg-white rounded-[1.7rem] py-12 flex flex-col items-center relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 opacity-5 text-9xl font-black pointer-events-none text-orange-900">B</div>
            
            <span className="text-xs text-slate-400 font-black tracking-[0.3em] uppercase mb-4">
              Your Token Number
            </span>
            <div className="flex items-center gap-3 text-slate-900">
              <Hash className="w-8 h-8 text-orange-500 opacity-50" strokeWidth={4} />
              <span className="text-8xl font-black tracking-tighter leading-none">
                {displayToken}
              </span>
            </div>
            
            <div className="mt-8 px-6 py-2 bg-slate-50 rounded-full border border-slate-100 font-bold text-slate-600 text-sm">
              Amount to Pay: <span className="text-orange-500 font-black">₹{order.totalAmount || order.total}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3-Stage Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="w-full max-w-sm mt-16 px-4"
      >
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-8 right-8 h-1.5 bg-slate-200 rounded-full -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-8 h-1.5 bg-orange-500 rounded-full -translate-y-1/2 transition-all duration-700 ease-out z-0"
            style={{ width: `calc(${progressWidth}% * (calc(100% - 4rem) / 100))` }} 
          />

          {STAGES.map((stage, i) => {
            const isCompleted = i < currentStage;
            const isCurrent = i === currentStage;
            
            return (
              <div key={stage} className="flex flex-col items-center z-10 w-16 relative">
                {isCurrent && (
                  <div className="absolute top-0 w-10 h-10 bg-orange-500/30 rounded-full animate-ping" />
                )}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 relative z-10 ${
                    isCompleted || isCurrent
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40"
                      : "bg-white text-slate-300 border-2 border-slate-200"
                  } ${isCurrent ? 'scale-110 ring-4 ring-orange-500/20' : ''}`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-[10px] mt-4 font-black uppercase tracking-widest text-center transition-colors ${
                  isCompleted || isCurrent ? "text-slate-800" : "text-slate-400"
                }`}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Order More Button */}
      <div className="mt-auto pt-16 w-full max-w-sm">
        <button
          onClick={() => navigate('/')}
          className="w-full rounded-2xl py-5 bg-[#0F172A] text-white font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all shadow-xl"
        >
          Order Something Else
        </button>
      </div>
    </div>
  );
}