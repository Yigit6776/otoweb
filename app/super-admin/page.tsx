"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface IslemDetay {
  plaka: string;
  arac: string;
  islem: string;
  tarih: string;
  km: string;
}

interface UserDetail {
  id: string;
  email: string;
  status: string;
  islemSayisi: number;
  yaptigiIslemler: IslemDetay[];
}

export default function SuperAdmin() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalVehicles: 0, totalActions: 0 });
  const [dayStats, setDayStats] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchSystemData = useCallback(async () => {
    setLoading(true);
    try {
      const plateSnap = await getDocs(collection(db, "Plakalar"));
      const userSnap = await getDocs(collection(db, "Kullanicilar"));
      
      const dayMap: Record<string, number> = { "Pzt": 0, "Sal": 0, "Çar": 0, "Per": 0, "Cum": 0, "Cmt": 0, "Paz": 0 };
      const categoryMap: Record<string, number> = {};
      const ustaIslemMap: Record<string, IslemDetay[]> = {};
      let actionCount = 0;

      plateSnap.docs.forEach(d => {
        const data = d.data();
        const islemler = data.islemler || [];
        actionCount += islemler.length;

        islemler.forEach((islem: any) => {
          // 1. HAFTALIK YOĞUNLUĞU HESAPLA
          const tarihParcalari = islem.tarih.split('.');
          if (tarihParcalari.length > 2) {
            const dateStr = `${tarihParcalari[2].split(' ')[0]}-${tarihParcalari[1]}-${tarihParcalari[0]}`;
            const dateObj = new Date(dateStr);
            const dayName = dateObj.toLocaleDateString('tr-TR', { weekday: 'short' });
            if (dayMap[dayName] !== undefined) dayMap[dayName]++;
          }

          // 2. KATEGORİ DAĞILIMINI HESAPLA
          const cat = islem.kategori || "Diğer";
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;

          // 3. USTA E-POSTA EŞLEŞTİRMESİ
          const ustaEmail = (islem.usta || "").trim().toLowerCase();
          if (ustaEmail) {
            if (!ustaIslemMap[ustaEmail]) ustaIslemMap[ustaEmail] = [];
            ustaIslemMap[ustaEmail].push({
              plaka: data.plaka || d.id,
              arac: data.aracBilgi || "Belirtilmemiş",
              islem: islem.islem,
              tarih: islem.tarih,
              km: islem.km
            });
          }
        });
      });

      // Grafik Verilerini Hazırla
      setDayStats(Object.entries(dayMap).map(([name, count]) => ({ name, count })));
      setCategoryStats(Object.entries(categoryMap).map(([name, value]) => ({ name, value })));

      // Usta Listesini Hazırla
      const userList = userSnap.docs.map(d => {
        const uData = d.data();
        const uMail = (uData.email || "").trim().toLowerCase();
        return {
          id: d.id,
          email: uData.email,
          status: uData.status,
          islemSayisi: ustaIslemMap[uMail]?.length || 0,
          yaptigiIslemler: ustaIslemMap[uMail] || []
        } as UserDetail;
      });

      setUsers(userList);
      setStats({ totalUsers: userSnap.size, totalVehicles: plateSnap.size, totalActions: actionCount });
      
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, []);

  const approveUser = async (uid: string) => {
    try {
      await updateDoc(doc(db, "Kullanicilar", uid), { status: "approved" });
      fetchSystemData();
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchSystemData(); }, [fetchSystemData]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-10 font-sans italic uppercase">
      <div className="max-w-7xl mx-auto">
        
        {/* ÖZET KARTLAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="p-10 bg-blue-600 rounded-[2.5rem] shadow-2xl transition-transform hover:scale-105 duration-500">
            <p className="text-[10px] font-black opacity-60 tracking-[0.4em] mb-2 uppercase">Kayıtlı Usta</p>
            <h3 className="text-6xl font-black italic leading-none">{stats.totalUsers}</h3>
          </div>
          <div className="p-10 bg-zinc-900 border border-white/5 rounded-[2.5rem] transition-transform hover:scale-105 duration-500">
            <p className="text-[10px] font-black text-zinc-500 tracking-[0.4em] mb-2 uppercase">Araç Havuzu</p>
            <h3 className="text-6xl font-black italic leading-none">{stats.totalVehicles}</h3>
          </div>
          <div className="p-10 bg-zinc-900 border border-white/5 rounded-[2.5rem] transition-transform hover:scale-105 duration-500">
            <p className="text-[10px] font-black text-emerald-500 tracking-[0.4em] mb-2 uppercase">Toplam İşlem</p>
            <h3 className="text-6xl font-black italic text-emerald-500 leading-none">{stats.totalActions}</h3>
          </div>
        </div>

        {/* 2 ADET ANLAMLI GRAFİK */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <div className="p-10 bg-zinc-900/40 border border-white/5 rounded-[3rem] backdrop-blur-xl">
              <h4 className="text-[11px] font-black mb-8 tracking-[0.3em] text-zinc-500 italic uppercase">Haftalık Dükkan Yoğunluğu</h4>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" stroke="#444" fontSize={12} fontWeight="bold" />
                    <YAxis stroke="#444" fontSize={12} fontWeight="bold" />
                    <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{backgroundColor: '#09090b', border: 'none', borderRadius: '15px'}} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-10 bg-zinc-900/40 border border-white/5 rounded-[3rem] backdrop-blur-xl">
              <h4 className="text-[11px] font-black mb-8 tracking-[0.3em] text-zinc-500 italic uppercase">Servis Kalemleri Dağılımı</h4>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryStats} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#09090b', border: 'none', borderRadius: '15px'}} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: 'bold'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* USTA LİSTESİ */}
        <div className="space-y-6">
          {loading ? (
            <div className="p-20 text-center animate-pulse text-zinc-800 font-black italic tracking-widest uppercase">Veri Odaları Hazırlanıyor...</div>
          ) : (
            users.map(user => (
              <div key={user.id} className="relative">
                <div className={`p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8 transition-all hover:bg-zinc-900/60 ${expandedUser === user.id ? 'ring-2 ring-blue-500 bg-zinc-900 shadow-2xl' : ''}`}>
                  <div className="flex-1 cursor-pointer w-full" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                    <div className="flex items-center gap-6 mb-2">
                      <p className="text-3xl font-black tracking-tighter leading-none">{user.email}</p>
                      <span className={`px-4 py-1 rounded-full text-[8px] font-black border ${user.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/20 text-amber-500 border-amber-500/30 animate-pulse'}`}>
                        {user.status === 'approved' ? 'AKTİF' : 'ONAY BEKLEYEN'}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-600 font-bold tracking-[0.3em] uppercase italic italic">DOĞRULANMIŞ HESAP KİMLİĞİ</p>
                  </div>

                  <div className="flex items-center gap-12">
                    <div className="text-right border-r border-white/10 pr-12">
                      <p className="text-[10px] font-black text-zinc-500 tracking-widest mb-1 uppercase">TOPLAM MÜHÜR</p>
                      <p className="text-5xl font-black italic text-blue-500 leading-none">{user.islemSayisi}</p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[120px]">
                        {user.status === 'pending' && (
                            <button onClick={() => approveUser(user.id)} className="bg-white text-black px-4 py-2 rounded-xl text-[9px] font-black hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-white/5">ONAYLA</button>
                        )}
                        <button onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)} className="text-[8px] font-black text-zinc-600 hover:text-white transition-colors">
                            {expandedUser === user.id ? 'KAPAT ▲' : 'DETAY ▼'}
                        </button>
                    </div>
                  </div>
                </div>

                {expandedUser === user.id && (
                  <div className="mt-4 mx-6 p-10 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500">
                    <div className="space-y-3">
                        <h5 className="text-[11px] font-black text-zinc-500 mb-6 tracking-[0.3em] uppercase italic">Bu Usta Tarafından Mühürlenen Son Kayıtlar</h5>
                        {user.yaptigiIslemler.length > 0 ? user.yaptigiIslemler.slice(-5).reverse().map((is, i) => (
                            <div key={i} className="flex justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-blue-500 font-black text-sm">{is.plaka}</span>
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase">{is.arac}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-zinc-200 italic mb-1">"{is.islem}"</p>
                                    <p className="text-[9px] text-zinc-700 font-black">{is.tarih}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-zinc-700 font-black italic text-sm text-center py-10 uppercase tracking-widest">EŞLEŞEN VERİ YOK</p>
                        )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <footer className="mt-32 pt-10 border-t border-white/5 opacity-20 text-center">
          <p className="text-[10px] font-black tracking-[0.5em] uppercase">Chervantes Enterprise Monitoring • Analytics v4.0</p>
        </footer>
      </div>
    </div>
  );
}