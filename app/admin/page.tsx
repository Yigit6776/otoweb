"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase"; 
import { doc, setDoc, arrayUnion, updateDoc, getDoc, collection, getDocs } from "firebase/firestore";

export default function AdminDashboard() {
  // Atölye & Usta Ayarları
  const [shopAddress, setShopAddress] = useState("Yükleniyor...");
  const [shopPhone, setShopPhone] = useState("Yükleniyor...");
  const [masterName, setMasterName] = useState("YİĞİT AKDENİZ");
  const [masterTitle, setMasterTitle] = useState("BAŞ USTA");
  const [isEditingShop, setIsEditingShop] = useState(false);

  // Form State'leri
  const [plate, setPlate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [carModel, setCarModel] = useState("");
  const [km, setKm] = useState("");
  const [laborPrice, setLaborPrice] = useState("");
  const [partsPrice, setPartsPrice] = useState("");
  const [action, setAction] = useState("");
  const [type, setType] = useState("Bakım"); // Varsayılan Kategori
  const [nextServiceDate, setNextServiceDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [status, setStatus] = useState({ type: "", msg: "" });

  // Kategori Seçenekleri
  const categories = ["Bakım", "Genel Muayene", "Motor / Mekanik", "Elektrik", "Kaporta / Boya", "Şanzıman"];

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const shopRef = doc(db, "Ayarlar", "Atolye");
        const shopSnap = await getDoc(shopRef);
        if (shopSnap.exists()) {
          const data = shopSnap.data();
          setShopAddress(data.adres);
          setShopPhone(data.tel);
          setMasterName(data.ustaAd);
          setMasterTitle(data.ustaUnvan);
        }
        const querySnapshot = await getDocs(collection(db, "Plakalar"));
        setStats({ total: querySnapshot.size, today: querySnapshot.size > 0 ? 1 : 0 });
      } catch (e) { console.error("Veri çekilemedi", e); }
    };
    initDashboard();
  }, []);

  const saveShopSettings = async () => {
    try {
      const shopRef = doc(db, "Ayarlar", "Atolye");
      await setDoc(shopRef, {
        adres: shopAddress,
        tel: shopPhone,
        ustaAd: masterName,
        ustaUnvan: masterTitle
      });
      setIsEditingShop(false);
      setStatus({ type: "success", msg: "AYARLAR BULUTA KAYDEDİLDİ" });
    } catch (e) { setStatus({ type: "error", msg: "AYARLAR KAYDEDİLEMEDİ!" }); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });
    const cleanPlate = plate.toUpperCase().replace(/\s+/g, "");

    try {
      const docRef = doc(db, "Plakalar", cleanPlate);
      const docSnap = await getDoc(docRef);
      const totalPrice = Number(laborPrice) + Number(partsPrice);
      const currentUserEmail = auth.currentUser?.email || "Bilinmiyor";

      const entry = {
        islem: action,
        kategori: type, // Seçilen kategori burada mühürleniyor
        km: km,
        maliyet: { iscilik: laborPrice, parca: partsPrice, toplam: totalPrice },
        tarih: new Date().toLocaleString("tr-TR"),
        sonrakiServis: nextServiceDate,
        usta: currentUserEmail, 
        ustaIsim: masterName,
        atolyeKonum: shopAddress 
      };

      if (docSnap.exists()) {
        await updateDoc(docRef, { 
          islemler: arrayUnion(entry),
          musteri: { ad: customerName, tel: customerPhone },
          aracBilgi: carModel,
          sonGuncelleme: shopAddress
        });
      } else {
        await setDoc(docRef, { 
          plaka: cleanPlate, 
          musteri: { ad: customerName, tel: customerPhone },
          aracBilgi: carModel,
          islemler: [entry],
          kayitYeri: shopAddress
        });
      }

      setStatus({ type: "success", msg: "SERVİS FORMU BAŞARIYLA OLUŞTURULDU" });
      setPlate(""); setAction(""); setKm(""); setLaborPrice(""); setPartsPrice("");
    } catch (err) {
      setStatus({ type: "error", msg: "KAYIT HATASI!" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30 pb-20 italic">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-zinc-900/40 backdrop-blur-2xl sticky top-0 z-50 px-8 py-4 uppercase">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center font-black italic shadow-2xl">C</div>
            <div>
              <h2 className="text-lg font-black italic tracking-tighter uppercase leading-none">Chervantes</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Professional Workshop</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 font-black">
            <div className="flex flex-col items-end leading-none border-r border-white/10 pr-6 uppercase">
                {isEditingShop ? (
                    <input value={masterName} onChange={(e) => setMasterName(e.target.value.toUpperCase())} className="bg-black text-white text-[11px] font-black uppercase text-right outline-none border-b border-blue-500" />
                ) : (
                    <span className="text-white mb-1 font-black text-[11px] tracking-widest">{masterName}</span>
                )}
                {isEditingShop ? (
                    <input value={masterTitle} onChange={(e) => setMasterTitle(e.target.value.toUpperCase())} className="bg-black text-blue-500 text-[10px] font-black uppercase text-right outline-none mt-1" />
                ) : (
                    <span className="text-blue-500 font-black text-[10px] tracking-widest">{masterTitle}</span>
                )}
            </div>
            <button 
                onClick={isEditingShop ? saveShopSettings : () => setIsEditingShop(true)} 
                className={`p-2 rounded-xl transition-all border ${isEditingShop ? "bg-emerald-600 border-emerald-500" : "bg-white/5 border-white/5"}`}
            >
                {isEditingShop ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                ) : (
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                )}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 uppercase font-black">
        <div className="lg:col-span-4 space-y-8 uppercase">
          <div className="p-8 bg-zinc-900/30 border border-white/10 rounded-[2.5rem] relative overflow-hidden">
            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-6 italic">Atölye Kimliği</h3>
            <div className="space-y-6 text-zinc-300 uppercase">
              <div>
                <p className="text-[9px] font-bold text-zinc-600 uppercase mb-2 tracking-widest leading-none">Konum / Şehir</p>
                {isEditingShop ? (
                    <input value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs outline-none focus:border-blue-500" />
                ) : (
                    <p className="text-xs font-semibold leading-relaxed tracking-tight uppercase italic">{shopAddress}</p>
                )}
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-600 uppercase mb-2 tracking-widest leading-none">Resmi Telefon</p>
                {isEditingShop ? (
                    <input value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs outline-none focus:border-blue-500" />
                ) : (
                    <p className="text-xs font-semibold tracking-widest">{shopPhone}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-[2.5rem] text-center border-l-4 border-l-zinc-700">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Kayıtlı Araç</p>
                <p className="text-4xl font-black italic mt-3 leading-none">{stats.total}</p>
            </div>
            <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] text-center border-l-4 border-l-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.05)]">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Aktif İşlem</p>
                <p className="text-4xl font-black italic mt-3 text-blue-400 leading-none">{stats.today}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 uppercase font-black">
          <form onSubmit={handleSave} className="bg-zinc-900/20 backdrop-blur-3xl border border-white/10 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden uppercase">
            <div className="mb-12">
              <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Servis Girişi</h1>
              <p className="text-zinc-600 text-[10px] mt-4 font-black uppercase tracking-[0.5em] flex items-center gap-2 italic">Bulut Veritabanına Bağlı</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-1 space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-3 tracking-widest">Plaka</label>
                <input required value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="34 ABC 123" className="w-full h-16 bg-black/60 border border-white/5 rounded-[1.5rem] px-6 text-xl font-black tracking-[0.2em] outline-none focus:border-blue-500 transition-all uppercase" />
              </div>
              <div className="md:col-span-2 space-y-2 uppercase">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-3 tracking-widest">Araç Marka / Model</label>
                <input required value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="Örn: 2022 AUDI A6 40TDI" className="w-full h-16 bg-black/60 border border-white/5 rounded-[1.5rem] px-6 text-sm font-bold outline-none focus:border-blue-500 transition-all uppercase" />
              </div>
            </div>

            {/* Kategori Seçim Alanı */}
            <div className="mb-8 space-y-3">
              <label className="text-[9px] font-black text-zinc-500 uppercase ml-3 tracking-widest">İşlem Kategorisi</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setType(cat)}
                    className={`h-14 rounded-2xl text-[10px] font-black tracking-widest transition-all border uppercase italic ${
                      type === cat 
                      ? "bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20 scale-[1.02]" 
                      : "bg-black/40 border-white/5 text-zinc-600 hover:border-white/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 uppercase font-black">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-3 tracking-widest uppercase">Müşteri Ad Soyad</label>
                <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full h-16 bg-black/40 border border-white/5 rounded-[1.5rem] px-6 text-sm font-bold outline-none uppercase" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-3 tracking-widest uppercase">Telefon No</label>
                <input required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="05xx..." className="w-full h-16 bg-black/40 border border-white/5 rounded-[1.5rem] px-6 text-sm font-bold outline-none uppercase" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 uppercase font-black">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-3 tracking-widest leading-none">Kilometre</label>
                <input required value={km} onChange={(e) => setKm(e.target.value)} className="w-full h-16 bg-black/40 border border-white/5 rounded-[1.5rem] px-6 text-sm font-bold text-blue-400 outline-none uppercase" />
              </div>
              <div className="space-y-2 text-emerald-500">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-3 tracking-widest leading-none">İşçilik (TL)</label>
                <input value={laborPrice} onChange={(e) => setLaborPrice(e.target.value)} placeholder="0" className="w-full h-16 bg-black/40 border border-emerald-500/10 rounded-[1.5rem] px-6 text-sm font-bold outline-none uppercase" />
              </div>
              <div className="space-y-2 text-emerald-500 uppercase">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-3 tracking-widest leading-none uppercase">Parça (TL)</label>
                <input value={partsPrice} onChange={(e) => setPartsPrice(e.target.value)} placeholder="0" className="w-full h-16 bg-black/40 border border-emerald-500/10 rounded-[1.5rem] px-6 text-sm font-bold outline-none uppercase" />
              </div>
              <div className="space-y-2 uppercase font-black">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-3 tracking-widest leading-none uppercase">Sonraki Servis</label>
                <input type="date" value={nextServiceDate} onChange={(e) => setNextServiceDate(e.target.value)} className="w-full h-16 bg-black/40 border border-white/5 rounded-[1.5rem] px-6 text-xs font-bold outline-none invert opacity-80 uppercase" />
              </div>
            </div>

            <div className="space-y-2 mb-10 uppercase font-black">
              <label className="text-[9px] font-black text-zinc-500 uppercase ml-3 tracking-widest italic leading-none uppercase">Teknik Detaylar ve Uygulanan Bakımlar</label>
              <textarea required value={action} onChange={(e) => setAction(e.target.value)} placeholder="Yağ soğutucu değişti, sanzıman yağı yenilendi..." className="w-full h-44 bg-black/40 border border-white/5 rounded-[2rem] p-8 text-sm font-medium outline-none focus:border-blue-500 transition-all resize-none shadow-inner uppercase" />
            </div>

            <button disabled={loading} className="group relative w-full h-24 bg-white text-zinc-950 font-black uppercase tracking-[0.4em] text-[12px] rounded-[2.5rem] hover:bg-blue-600 hover:text-white transition-all overflow-hidden shadow-2xl active:scale-95 uppercase italic">
              <span className="relative z-10 flex items-center justify-center gap-4 uppercase tracking-tighter italic font-black">
                  {loading ? "SİSTEME İŞLENİYOR..." : "DİJİTAL SERVİS KAYDINI MÜHÜRLE"}
              </span>
              <div className="absolute inset-0 bg-blue-600 translate-y-24 group-hover:translate-y-0 transition-all duration-500 shadow-[0_-20px_50px_rgba(37,99,235,0.4)]" />
            </button>

            {status.msg && (
              <div className={`mt-8 p-5 rounded-2xl text-[10px] font-black uppercase text-center tracking-widest border ${status.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"}`}>
                {status.msg}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}