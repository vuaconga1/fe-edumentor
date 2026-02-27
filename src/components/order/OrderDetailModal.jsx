import React from 'react';
import { X, Calendar, Clock, CheckCircle2, Receipt } from 'lucide-react';

const OrderDetailModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const formatDate = (dateStr) => dateStr ? new Date(dateStr.endsWith?.('Z') ? dateStr : dateStr + 'Z').toLocaleString('vi-VN') : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Gradient Blue */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-500 flex justify-between items-center">
          <div className="text-white">
             <h3 className="text-lg font-bold">Order Details</h3>
             <p className="text-xs text-blue-100 opacity-90 font-mono mt-0.5">#{order.id}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Person Card – show mentor (student view) or student (mentor view) */}
          {(order.mentor || order.student) && (
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
             <img src={(order.mentor ?? order.student)?.avatar} alt={(order.mentor ?? order.student)?.name} className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-600 shadow-sm" />
             <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{order.mentor ? 'Mentor' : 'Student'}</p>
                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{(order.mentor ?? order.student)?.name}</h4>
                {(order.mentor ?? order.student)?.specialty && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{(order.mentor ?? order.student).specialty}</p>
                )}
             </div>
          </div>
          )}

          {/* Service Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Service Information</h4>
            <div className="space-y-4">
               <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Service</p>
                    <p className="font-medium text-slate-900 dark:text-white">{order.service}</p>
                  </div>
               </div>
               <div className="flex items-start gap-3">
                           <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                              <Calendar size={18} />
                           </div>
                  <div>
                    <p className="text-xs text-slate-500">Time</p>
                    <p className="font-medium text-slate-900 dark:text-white">{formatDate(order.date)}</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Payment Block */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 border border-dashed border-slate-300 dark:border-slate-600">
             <div className="flex items-center gap-2 mb-4 text-slate-900 dark:text-white font-bold">
                <Receipt size={18} className="text-slate-400" />
                Payment Summary
             </div>
             <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white">Total</span>
                <span className="font-bold text-xl text-blue-600">{formatCurrency(order.total)}</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailModal;