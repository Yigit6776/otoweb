'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { useParams } from "next/navigation";

interface ServisKaydi {
  islem: string;
  tarih: string;
  kategori: string;
  km: string;
  usta: string;
  atolyeKonum?: string;
  sonrakiServis?: string;
  maliyet?: {
    iscilik: string;
    parca: string;
    toplam: number;
  };
}

export default function VehicleHistoryPage() {
  const params = useParams();
  const plate = params?.plate as string;
  const [data, setData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  const getVehicleData = useCallback(async () => {
    try {
      if (!plate) return;
      const docRef = doc(db, "Plakalar", plate.toUpperCase());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
    } catch (error) {
      console.error("Firebase Veri Hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [plate]);

  useEffect(() => {
    getVehicleData();
  }, [getVehicleData]);

  // KM SAHTEKARLIĞI KONTROL ALGORİTMASI
  const isKmFraudulent = useMemo(() => {
    if (!data?.islemler || data.islemler.length < 2) return false;

    const sorted = [...data.islemler].sort((a, b) => {
      const dateA = a.tarih.split(' ')[0].split('.').reverse().join('-');
      const dateB = b.tarih.split(' ')[0].split('.').reverse().join('-');
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    for (let i = 1; i < sorted.length; i++) {
      const prevKm = parseInt(sorted[i - 1].km.replace(/\D/g, ""));
      const currentKm = parseInt(sorted[i].km.replace(/\D/g, ""));
      
      if (currentKm < prevKm) return true;
    }
    return false;
  }, [data]);

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white font-black italic animate-pulse tracking-widest uppercase text-xs">Veriler Mühürden Çözülüyor...</div>;
  if (!data) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-500 font-bold uppercase italic tracking-widest text-center px-4 text-xs">Bu Plakaya Ait Bir Servis Kaydı Bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30 pb-24">
      <div className="max-w-4xl mx-auto px-6 py-16">
        
        {/* KİLOMETRE TUTARSIZLIK ALARMI */}
        {isKmFraudulent && (
          <div className="mb-10 p-8 bg-red-600/10 border-2 border-red-500/50 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 animate-pulse shadow-[0_0_40px_rgba(239,68,68,0.1)]">
            <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-red-500/20">⚠️</div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-black italic uppercase text-red-500 tracking-tighter">Kilometre Verisinde Tutarsızlık!</h3>
              <p className="text-red-400/80 text-[10px] font-bold uppercase tracking-widest mt-1 italic">
                Aracın kilometre verileri geçmiş kayıtlarla uyuşmuyor. Lütfen dökümleri dikkatle inceleyiniz.
              </p>
            </div>
          </div>
        )}

        {/* ÜST ARAÇ KARTI */}
        <header className="mb-12 p-10 bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <span className="px-4 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Dijital Servis Kartı</span>
          </div>
          
          <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none tracking-[-0.05em]">{data.aracBilgi}</h1>
          <p className="text-zinc-500 text-lg mt-4 font-bold uppercase tracking-[0.4em] italic leading-none">{plate}</p>
          
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5 pt-8">
            <div>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Müşteri / Sahibi</p>
              <p className="text-sm font-bold uppercase">{data.musteri?.ad || "Belirtilmemiş"}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Sisteme Kayıt</p>
              <p className="text-sm font-bold uppercase">{new Date(data.kayitTarihi).toLocaleDateString('tr-TR')}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Toplam İşlem</p>
              <p className="text-sm font-black text-blue-500 italic uppercase">{data.islemler?.length || 0} Servis Girişi</p>
            </div>
          </div>
        </header>

        {/* SERVİS LİSTESİ */}
        <div className="space-y-8">
          <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.5em] ml-4 mb-6 italic">Servis Geçmişi</h3>

          {data.islemler?.slice().reverse().map((islem: ServisKaydi, index: number) => (
            <div key={index} className="group p-8 bg-zinc-900/30 border border-white/5 rounded-[2.5rem] backdrop-blur-xl hover:border-blue-500/20 transition-all duration-500">
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                
                <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-zinc-800 border border-white/10 rounded-lg text-[10px] font-black text-zinc-400 uppercase tracking-widest">{islem.tarih}</span>
                    <span className="text-blue-500 font-black text-[11px] uppercase italic tracking-[0.2em]">{islem.kategori}</span>
                  </div>
                  <h4 className="text-xl font-bold text-zinc-100 leading-snug italic uppercase tracking-tight leading-none">
                    {`"${islem.islem}"`}
                  </h4>
                  {islem.sonrakiServis && (
                    <p className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">
                      Önerilen Sonraki Kontrol: {islem.sonrakiServis}
                    </p>
                  )}
                </div>

                <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between gap-6">
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                    <div>
                      <p className="text-[8px] font-black text-zinc-600 uppercase mb-1 tracking-widest">Mevcut Kilometre</p>
                      <p className="text-2xl font-black italic leading-none">{islem.km} <span className="text-[10px] text-zinc-500">KM</span></p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-zinc-600 uppercase mb-1 tracking-widest font-sans">Toplam Maliyet</p>
                      <p className="text-2xl font-black italic leading-none text-emerald-500">
                        {islem.maliyet?.toplam?.toLocaleString('tr-TR') || "---"} <span className="text-[10px]">TL</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-2 tracking-widest text-right">Mühürleyen Usta</p>
                    <div className="text-right">
                      <p className="text-[11px] font-black text-blue-500 uppercase leading-none">{islem.usta}</p>
                      <p className="text-[9px] text-zinc-500 mt-1 uppercase italic font-bold tracking-tighter">{islem.atolyeKonum || "Chervantes Merkez"}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        <footer className="mt-20 pt-10 border-t border-white/5 text-center opacity-20">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em]">Chervantes Digital Ecosystem • Veriler Bulutta Mühürlüdür</p>
        </footer>
      </div>
    </div>
  );
}