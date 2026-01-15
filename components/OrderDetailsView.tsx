
import React, { useState, useEffect } from 'react';
import { Order, OrderLog, OrderItem, OrderStatus } from '../types';
import { 
  ArrowRight, Save, X, History, 
  User, Phone, MapPin, ShoppingBag, PlusCircle, Trash2, Plus, Clock, Truck, Home, Building2, Store, Check,
  CheckCircle2, RefreshCcw, Map
} from 'lucide-react';
import { statusLabels, statusColors } from './OrderConfirmationView';

interface OrderDetailsViewProps {
  order: Order;
  onBack: () => void;
  onUpdate: (updatedOrder: Order) => void;
  readOnly?: boolean;
  trackingMode?: boolean;
}

const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({ 
  order, onBack, onUpdate, readOnly = false, trackingMode = false 
}) => {
  const [editedOrder, setEditedOrder] = useState<Order>({ ...order });
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [newLog, setNewLog] = useState<{ status: OrderStatus; note: string }>({ status: order.status, note: '' });

  const confirmationStatuses: OrderStatus[] = [
    'confirmed', 'message_sent', 'postponed', 'failed_01', 'failed_02', 
    'failed_03', 'failed_04', 'failed_05', 'duplicate', 'wrong_number', 
    'wrong_order', 'out_of_stock', 'cancelled'
  ];

  const trackingStatuses: OrderStatus[] = [
    'en_preparation', 'ramasse', 'sorti_livraison', 'delivered', 'annule', 
    'tentative_01', 'tentative_02', 'tentative_03', 'reporte_01', 
    'wrong_number', 'client_absent', 'wrong_address', 'retour_vendeur', 
    'retourne_vendeur', 'paid'
  ];

  const statusesToDisplay = trackingMode ? trackingStatuses : confirmationStatuses;

  useEffect(() => {
    const totalItemsPrice = editedOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setEditedOrder(prev => ({
      ...prev,
      amount: totalItemsPrice + (Number(prev.shippingCost) || 0)
    }));
  }, [editedOrder.items, editedOrder.shippingCost]);

  const handleSave = () => {
    if (readOnly) return;
    onUpdate({ ...editedOrder, updatedAt: new Date().toLocaleString('ar-SA') });
    alert('تم حفظ البيانات');
  };

  const addStatusUpdate = () => {
    const now = new Date().toLocaleString('ar-SA');
    const log: OrderLog = { status: newLog.status, date: now, note: newLog.note || `تغيير الحالة`, user: 'أحمد محمد' };
    const updated = { ...editedOrder, status: newLog.status, lastStatusDate: now, history: [...(editedOrder.history || []), log], updatedAt: now };
    setEditedOrder(updated);
    onUpdate(updated);
    setIsAddLogOpen(false);
  };

  const currentColors = statusColors[editedOrder.status] || statusColors.default;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 border border-slate-200"><ArrowRight className="w-5 h-5" /></button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-800">الطلب <span className="text-indigo-600">#{order.id}</span></h2>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase ${currentColors.bg} ${currentColors.text} ${currentColors.border}`}>{statusLabels[editedOrder.status]}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {!readOnly && (
            <button onClick={handleSave} className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[11px] hover:bg-slate-50 transition-all uppercase flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> حفظ
            </button>
          )}
          <button onClick={() => setIsAddLogOpen(true)} className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-[11px] shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all uppercase flex items-center justify-center gap-2">
            <RefreshCcw className="w-4 h-4" /> تحديث الحالة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <User className="w-5 h-5 text-indigo-500" />
              <h3 className="text-xs font-black text-slate-800 uppercase">بيانات الشحن</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase px-1">العميل</label>
                <input disabled={readOnly} value={editedOrder.customer} onChange={e => setEditedOrder({...editedOrder, customer: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase px-1">الهاتف</label>
                <input disabled={readOnly} value={editedOrder.phone} onChange={e => setEditedOrder({...editedOrder, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase px-1">الولاية</label>
                <input disabled={readOnly} value={editedOrder.state} onChange={e => setEditedOrder({...editedOrder, state: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase px-1">البلدية</label>
                <input disabled={readOnly} value={editedOrder.municipality} onChange={e => setEditedOrder({...editedOrder, municipality: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
              </div>
              <div className="col-span-full space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase px-1">العنوان</label>
                <textarea disabled={readOnly} value={editedOrder.address} onChange={e => setEditedOrder({...editedOrder, address: e.target.value})} className="w-full h-20 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none resize-none" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-indigo-500" />
                <h3 className="text-xs font-black text-slate-800 uppercase">المنتجات</h3>
              </div>
            </div>
            <div className="space-y-3">
              {editedOrder.items.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{item.variant} x {item.quantity}</p>
                  </div>
                  <p className="text-xs font-black text-indigo-600">{item.price * item.quantity} دج</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full max-h-[600px] flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <History className="w-4 h-4 text-indigo-500" />
              <h3 className="text-[11px] font-black text-slate-800 uppercase">التاريخ</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
              {editedOrder.history?.map((log, idx) => {
                const colors = statusColors[log.status] || statusColors.default;
                return (
                  <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${colors.bg} ${colors.text} ${colors.border}`}>{statusLabels[log.status]}</span>
                      <span className="text-[8px] font-bold text-slate-400">{log.date}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-600">{log.note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isAddLogOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-800 uppercase">تحديث الحالة</h4>
              <button onClick={() => setIsAddLogOpen(false)} className="text-slate-400 hover:text-rose-500"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-2">
                {statusesToDisplay.map(s => (
                  <button key={s} onClick={() => setNewLog({...newLog, status: s})} className={`p-3 rounded-xl border text-[10px] font-bold transition-all ${newLog.status === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{statusLabels[s]}</button>
                ))}
              </div>
              <textarea placeholder="ملاحظة..." value={newLog.note} onChange={e => setNewLog({...newLog, note: e.target.value})} className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
              <button onClick={addStatusUpdate} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-indigo-600/20 transition-all">حفظ الحالة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsView;
