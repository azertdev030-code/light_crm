
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, OrderStatus, OrderItem, Product, ProductVariant } from '../types';
import { 
  Search, MapPin, Phone, ArrowLeft, ChevronRight, ChevronLeft, 
  Plus, X, ShoppingBag, Truck, Filter, Trash2, Eye, 
  User, Home, Building2, Package, PlusCircle, MinusCircle, 
  MapPinned, ChevronDown, Check, ShoppingCart, Info, DollarSign, Tag
} from 'lucide-react';
import OrderDetailsView from './OrderDetailsView';

// قائمة مبسطة للولايات وبعض البلديات للنموذج
const algerianData: Record<string, string[]> = {
  "الجزائر العاصمة": ["باب الزوار", "حيدرة", "باش جراح", "الدوارة", "زرالدة"],
  "وهران": ["بئر الجير", "السانيا", "أرزيو", "عين الترك"],
  "قسنطينة": ["الخروب", "حامة بوزيان", "زيغود يوسف"],
  "سطيف": ["العلمة", "عين أرنات", "بوقاعة"],
  "عنابة": ["البوني", "سيدي عمار", "الحجار"],
  "البليدة": ["بوفاريك", "أولاد يعيش", "العفرون"],
  "تيزي وزو": ["عزازقة", "ذراع بن خدة", "واسيف"]
};

interface OrderConfirmationViewProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  inventory: Product[];
}

export const statusLabels: Record<OrderStatus, string> = {
  pending: 'معلقة',
  failed_01: 'فاشلة 01',
  failed_02: 'فاشلة 02',
  failed_03: 'فاشلة 03',
  confirmed: 'مؤكدة',
  cancelled: 'ملغاة',
  postponed: 'مؤجلة',
  duplicate: 'مكررة',
  failed_04: 'فاشلة 04',
  failed_05: 'فاشلة 05',
  wrong_number: 'رقم خاطئ',
  wrong_order: 'طلب خاطئ',
  message_sent: 'تم إرسال الرسالة',
  out_of_stock: 'غير متوفر في المخزون',
  processing: 'جاري التجهيز',
  en_preparation: 'قيد التجهيز',
  ramasse: 'تم الاستلام من المتجر',
  sorti_livraison: 'خرج للتوصيل',
  delivered: 'تم التوصيل',
  annule: 'ملغى',
  tentative_01: 'محاولة 01',
  tentative_02: 'محاولة 02',
  tentative_03: 'محاولة 03',
  reporte_01: 'مؤجل 01',
  client_absent: 'العميل غائب',
  wrong_address: 'عنوان خاطئ',
  retour_vendeur: 'في طريق العودة للبائع',
  retourne_vendeur: 'تم الإرجاع للبائع',
  paid: 'تم الدفع',
  shipped: 'تم الشحن'
};

export const statusColors: Record<string, { bg: string, text: string, border: string, hover: string, active: string }> = {
  pending: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', hover: 'hover:bg-blue-100', active: 'bg-blue-600' },
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', hover: 'hover:bg-emerald-100', active: 'bg-emerald-600' },
  default: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', hover: 'hover:bg-slate-200', active: 'bg-indigo-600' }
};

const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({ orders, setOrders, inventory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const itemsPerPage = 8;

  // Manual Order State
  const [newOrder, setNewOrder] = useState({
    customer: '', phone: '', state: '', municipality: '', address: '',
    deliveryType: 'home' as 'home' | 'office', shippingCost: 0, notes: ''
  });
  const [cart, setCart] = useState<OrderItem[]>([]);
  
  // Product Select States
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsProductPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAndGroupedProducts = useMemo(() => {
    const filtered = inventory.filter(p => 
      p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(productSearchQuery.toLowerCase())
    );
    const grouped: Record<string, Product[]> = {};
    filtered.forEach(p => {
      const cat = p.category || 'عام';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });
    return grouped;
  }, [inventory, productSearchQuery]);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + Number(newOrder.shippingCost || 0);

  const handleAddItemToCart = (p: Product, v?: ProductVariant) => {
    const name = p.name;
    const variant = v ? v.name : (p.variants?.length ? p.variants[0].name : 'أساسي');
    const price = v?.price || p.price;
    const exists = cart.findIndex(i => i.name === name && i.variant === variant);
    if (exists > -1) {
      const updated = [...cart];
      updated[exists].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { name, variant, quantity: 1, price }]);
    }
    setIsProductPickerOpen(false);
    setProductSearchQuery('');
  };

  const handleConfirmOrder = () => {
    if (!newOrder.customer || !newOrder.phone || !newOrder.state || cart.length === 0) {
      alert('يرجى ملء كافة البيانات الأساسية واختيار منتج واحد على الأقل');
      return;
    }
    const orderObj: Order = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      customer: newOrder.customer,
      phone: newOrder.phone,
      state: newOrder.state,
      municipality: newOrder.municipality,
      address: newOrder.address,
      deliveryType: newOrder.deliveryType,
      items: cart,
      shippingCost: newOrder.shippingCost,
      amount: total,
      status: 'pending',
      notes: newOrder.notes,
      storeName: 'إضافة يدوية',
      createdAt: new Date().toLocaleString('ar-SA'),
      updatedAt: new Date().toLocaleString('ar-SA'),
      lastStatusDate: new Date().toLocaleString('ar-SA'),
      history: [{ status: 'pending', date: new Date().toLocaleString('ar-SA'), note: 'تم إنشاء الطلب يدوياً', user: 'أحمد محمد' }]
    };
    setOrders([orderObj, ...orders]);
    setIsAddModalOpen(false);
    setCart([]);
    setNewOrder({ customer: '', phone: '', state: '', municipality: '', address: '', deliveryType: 'home', shippingCost: 0, notes: '' });
  };

  const paginatedOrders = orders.filter(o => o.customer.toLowerCase().includes(searchTerm.toLowerCase())).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (selectedOrderId) {
    const order = orders.find(o => o.id === selectedOrderId);
    if (order) return <OrderDetailsView order={order} onBack={() => setSelectedOrderId(null)} onUpdate={(u) => setOrders(prev => prev.map(o => o.id === u.id ? u : o))} />;
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
           <h2 className="text-xl font-black text-slate-800 tracking-tight">تأكيد الطلبيات</h2>
           <p className="text-slate-400 text-[11px] font-bold uppercase mt-1 tracking-widest">إدارة الطلبات اليدوية</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
          <Plus className="w-4 h-4" /> إضافة طلب
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
           <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="بحث بالاسم..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:bg-white transition-all focus:border-indigo-400" />
           </div>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">المعرف</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">العميل</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.map(o => (
                <tr key={o.id} onClick={() => setSelectedOrderId(o.id)} className="group hover:bg-slate-50 transition-all cursor-pointer">
                  <td className="px-6 py-4 font-bold text-indigo-600 text-xs">#{o.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-800 leading-none mb-1">{o.customer}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{o.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all mx-auto">
                      <Eye className="w-4 h-4" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: ADD ORDER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh] border border-slate-200">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">إنشاء طلبية</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">أدخل البيانات اللوجستية بدقة</p>
                  </div>
               </div>
               <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-all p-2 rounded-lg hover:bg-rose-50">
                  <X className="w-6 h-6" />
               </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              
              {/* 1. Customer Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                   <User className="w-4 h-4 text-indigo-500" />
                   <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">بيانات العميل</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الاسم الكامل</label>
                      <input 
                        placeholder="أحمد الجزائري..." 
                        value={newOrder.customer}
                        onChange={e => setNewOrder({...newOrder, customer: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رقم الهاتف</label>
                      <input 
                        placeholder="05 / 06 / 07..." 
                        value={newOrder.phone}
                        onChange={e => setNewOrder({...newOrder, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      />
                   </div>
                </div>
              </div>

              {/* 2. Location Info (NOW WITH SELECTS) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                   <MapPinned className="w-4 h-4 text-indigo-500" />
                   <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">العنوان والشحن</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الولاية</label>
                      <select 
                        value={newOrder.state} 
                        onChange={e => setNewOrder({...newOrder, state: e.target.value, municipality: ''})} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none transition-all"
                      >
                        <option value="">اختر الولاية...</option>
                        {Object.keys(algerianData).map(state => <option key={state} value={state}>{state}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البلدية</label>
                      <select 
                        disabled={!newOrder.state}
                        value={newOrder.municipality} 
                        onChange={e => setNewOrder({...newOrder, municipality: e.target.value})} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none transition-all disabled:opacity-50"
                      >
                        <option value="">اختر البلدية...</option>
                        {newOrder.state && algerianData[newOrder.state].map(mun => <option key={mun} value={mun}>{mun}</option>)}
                      </select>
                   </div>
                   <div className="col-span-full space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">العنوان التفصيلي</label>
                      <textarea placeholder="اسم الشارع، رقم البيت..." value={newOrder.address} onChange={e => setNewOrder({...newOrder, address: e.target.value})} className="w-full h-20 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none transition-all resize-none" />
                   </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setNewOrder({...newOrder, deliveryType: 'home'})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${newOrder.deliveryType === 'home' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-black' : 'border-slate-100 bg-slate-50 text-slate-400 font-bold hover:border-slate-200'}`}>
                      <Home className="w-4 h-4" /> <span className="text-[10px] uppercase">للمنزل</span>
                   </button>
                   <button onClick={() => setNewOrder({...newOrder, deliveryType: 'office'})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${newOrder.deliveryType === 'office' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-black' : 'border-slate-100 bg-slate-50 text-slate-400 font-bold hover:border-slate-200'}`}>
                      <Building2 className="w-4 h-4" /> <span className="text-[10px] uppercase">للمكتب</span>
                   </button>
                </div>
              </div>

              {/* 3. Product Picker */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                   <ShoppingBag className="w-4 h-4 text-indigo-500" />
                   <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">المنتجات</span>
                </div>
                
                <div className="relative" ref={pickerRef}>
                   <button 
                     onClick={() => setIsProductPickerOpen(!isProductPickerOpen)}
                     className="w-full px-5 py-4 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase flex items-center justify-between hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
                   >
                     <div className="flex items-center gap-3">
                        <PlusCircle className="w-4 h-4 text-indigo-400" />
                        <span>{cart.length > 0 ? `تم اختيار (${cart.length}) منتجات` : 'اختر المنتج من القائمة'}</span>
                     </div>
                     <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isProductPickerOpen ? 'rotate-180' : ''}`} />
                   </button>
                   
                   {isProductPickerOpen && (
                     <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 flex flex-col border-indigo-100">
                        <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                           <Search className="w-4 h-4 text-slate-400" />
                           <input 
                             autoFocus
                             placeholder="بحث سريع في المخزون..." 
                             value={productSearchQuery}
                             onChange={e => setProductSearchQuery(e.target.value)}
                             className="flex-1 bg-transparent text-[11px] font-bold outline-none"
                           />
                        </div>

                        <div className="max-h-60 overflow-y-auto no-scrollbar">
                           {Object.entries(filteredAndGroupedProducts).map(([cat, products]) => (
                             <div key={cat}>
                                <div className="px-4 py-2 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{cat}</div>
                                {products.map(p => (
                                  <div key={p.id} className="p-1">
                                     {p.variants?.length ? p.variants.map(v => (
                                       <button key={v.id} onClick={() => handleAddItemToCart(p, v)} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 transition-colors group">
                                          <div className="text-right">
                                             <p className="text-[11px] font-bold text-slate-700 leading-none">{p.name}</p>
                                             <p className="text-[9px] text-slate-400 mt-1 uppercase">{v.name}</p>
                                          </div>
                                          <span className="text-[10px] font-black text-indigo-600">+{v.price || p.price}دج</span>
                                       </button>
                                     )) : (
                                       <button onClick={() => handleAddItemToCart(p)} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 transition-colors group">
                                          <span className="text-[11px] font-bold text-slate-700">{p.name}</span>
                                          <span className="text-[10px] font-black text-indigo-600">+{p.price}دج</span>
                                       </button>
                                     )}
                                  </div>
                                ))}
                             </div>
                           ))}
                           {Object.keys(filteredAndGroupedProducts).length === 0 && (
                             <div className="p-8 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">لا توجد منتجات مطابقة</div>
                           )}
                        </div>
                     </div>
                   )}
                </div>

                {/* Cart Items */}
                <div className="space-y-2">
                   {cart.map((item, idx) => (
                     <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between group animate-in slide-in-from-left-2">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600"><Package className="w-4 h-4" /></div>
                           <div>
                              <p className="text-[11px] font-black text-slate-800 leading-none">{item.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">{item.variant}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
                              <button onClick={() => { const u=[...cart]; u[idx].quantity=Math.max(1, u[idx].quantity-1); setCart(u); }} className="p-1 text-slate-300 hover:text-rose-500"><MinusCircle className="w-4 h-4" /></button>
                              <span className="w-6 text-center text-[11px] font-black text-slate-800">{item.quantity}</span>
                              <button onClick={() => { const u=[...cart]; u[idx].quantity+=1; setCart(u); }} className="p-1 text-slate-300 hover:text-indigo-600"><PlusCircle className="w-4 h-4" /></button>
                           </div>
                           <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500 p-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* 4. Extra Info */}
              <div className="space-y-4 pb-4">
                 <div className="flex items-center gap-2 mb-1">
                    <Info className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">التكاليف والملاحظات</span>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">سعر التوصيل</label>
                       <div className="relative">
                          <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input type="number" value={newOrder.shippingCost} onChange={e => setNewOrder({...newOrder, shippingCost: Number(e.target.value)})} className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-600 focus:bg-white focus:border-indigo-400 outline-none transition-all" />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ملاحظات (اختياري)</label>
                       <input value={newOrder.notes} onChange={e => setNewOrder({...newOrder, notes: e.target.value})} placeholder="تعليمات التوصيل..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                    </div>
                 </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 bg-white shrink-0 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)]">
               <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">إجمالي المبلغ المطلوب</p>
                     <p className="text-2xl font-black text-slate-800 font-mono tracking-tighter">{total} <span className="text-[10px] opacity-40">دج</span></p>
                  </div>
                  <button onClick={handleConfirmOrder} className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                     تأكيد إنشاء الطلبية <ChevronLeft className="w-5 h-5" />
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderConfirmationView;
