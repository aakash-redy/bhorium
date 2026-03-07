import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ArrowLeft, Trash2, Check, ShoppingBag, User, AlertCircle, X } from "lucide-react";
import { CartItem } from "@/lib/menu-data";

interface BagStepProps {
  cart: CartItem[];
  totalPrice: number;
  onUpdateQuantity: (id: string, newQty: number) => void;
  onPlaceOrder: (name: string) => void;
  onBack: () => void;
}

export default function BagStep({
  cart,
  totalPrice,
  onUpdateQuantity,
  onPlaceOrder,
  onBack,
}: BagStepProps) {
  const [userName, setUserName] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Math fix to prevent string concatenation
  const handleQtyChange = (id: string, currentQty: number, delta: number) => {
    const newQty = Number(currentQty) + delta;
    onUpdateQuantity(id, Math.max(0, newQty));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Dark Bismuth Header */}
      <div className="bg-[#0F172A] p-6 pb-12">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-orange-500 text-xl shadow-md">
            B
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">Bismuth Bag</h1>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">NODE A | CHECKOUT</p>
          </div>
        </div>
      </div>

      {/* Cart Content */}
      <main className="flex-1 px-6 -mt-6 pb-72">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="popLayout">
            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-xl leading-tight">{item.name}</h3>
                      <p className="text-orange-500 font-black text-2xl mt-2 tracking-tighter">
                        ₹{Number(item.price) * Number(item.quantity)}
                      </p>
                    </div>

                    <div className="flex flex-col items-center bg-orange-50 rounded-2xl p-1 border border-orange-100">
                      <button onClick={() => handleQtyChange(item.id, item.quantity, 1)} className="w-10 h-10 flex items-center justify-center text-orange-600">
                        <Plus className="w-5 h-5" strokeWidth={3} />
                      </button>
                      <span className="w-10 text-center font-black text-slate-900 text-lg py-1">{item.quantity}</span>
                      <button onClick={() => handleQtyChange(item.id, item.quantity, -1)} className="w-10 h-10 flex items-center justify-center text-orange-400">
                        {item.quantity <= 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-5 h-5" strokeWidth={3} />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* EMPTY STATE NAVIGATION */
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Your bag is empty</h2>
                <p className="text-slate-400 mb-8 max-w-xs mx-auto">Looks like you haven't added any fuel to your bag yet.</p>
                <button 
                  onClick={onBack}
                  className="bg-[#0F172A] text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 mx-auto hover:bg-slate-800 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" /> RETURN TO MENU
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Fixed Bottom Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-orange-100 p-6 px-10 z-40 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
              <div className="relative flex-1 w-full">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500">
                  <User className="w-5 h-5" strokeWidth={3} />
                </div>
                <input 
                  type="text" 
                  placeholder="YOUR NAME (REQUIRED)"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-white border-2 border-orange-200 focus:border-orange-500 rounded-2xl py-5 pl-14 pr-6 outline-none transition-all font-black text-slate-900 placeholder:text-slate-400 text-lg shadow-sm"
                />
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
                <div className="text-right">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total</p>
                  <p className="text-slate-900 text-3xl font-black leading-none">₹{totalPrice}</p>
                </div>
                <button
                  disabled={!userName.trim()}
                  onClick={() => setShowConfirm(true)}
                  className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white px-12 py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-orange-200 uppercase"
                >
                  PLACE ORDER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL (UX Friction) */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-orange-100 p-3 rounded-2xl">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
                <button onClick={() => setShowConfirm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-2">Confirm Order?</h2>
              <p className="text-slate-500 mb-6">
                Hi <span className="text-orange-600 font-bold">{userName}</span>, please check your items before finalizing.
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 mb-8 space-y-2 border border-slate-100 max-h-40 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm font-bold">
                    <span className="text-slate-600">{item.quantity}x {item.name}</span>
                    <span className="text-slate-900 font-black">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-lg font-black">
                  <span>Total</span>
                  <span className="text-orange-600">₹{totalPrice}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onPlaceOrder(userName);
                    setShowConfirm(false);
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-2xl font-black text-lg shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
                >
                  CONFIRM & PLACE <Check className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full bg-white border-2 border-slate-100 text-slate-400 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  GO BACK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}