"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [plate, setPlate] = useState("");

  // Plakayı boşluksuz ve büyük harf yaparak hazırla
  const cleanedPlate = useMemo(() => {
    return plate.toUpperCase().replace(/\s+/g, "");
  }, [plate]);

  function goSearch() {
    if (!cleanedPlate || cleanedPlate.length < 5) {
      alert("Lütfen geçerli bir plaka giriniz.");
      return;
    }
    // URL'e güvenli bir şekilde yönlendir
    router.push(`/p/${encodeURIComponent(cleanedPlate)}`);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Üst Menü */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10 font-black italic text-blue-500">CW</div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Chervantes</p>
              <p className="text-[10px] text-white/50 uppercase tracking-widest">Oto Servis</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login" className="text-xs font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest">Usta Giriş</Link>
          </nav>
        </div>
      </header>

      {/* Hero Bölümü */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div className="z-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Chervantes • Dijital Servis Kaydı
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl italic uppercase tracking-tighter">
              Plakayı gir.
              <br />
              <span className="text-white/40">Servis geçmişini gör.</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-white/50 leading-relaxed font-medium">
              Aracınızın tüm bakım geçmişi artık parmaklarınızın ucunda. Şeffaf, güvenli ve dijital araç takip sistemi.
            </p>
          </div>

          {/* Sorgulama Kartı */}
          <div id="sorgu" className="relative z-10">
            <div className="rounded-[2.5rem] border border-white/10 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
              <h2 className="text-xl font-bold uppercase tracking-tight">Araç Sorgula</h2>
              <p className="mt-1 text-xs text-white/40 font-medium">Kayıtları listelemek için plakayı yazın.</p>

              <form 
                className="mt-8 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  goSearch();
                }}
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">Araç Plakası</span>
                  <input
                    required
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="34ABC123"
                    className="w-full h-16 rounded-2xl border border-white/5 bg-black/50 px-6 text-2xl font-black text-white placeholder:text-white/10 outline-none focus:border-blue-500/50 transition-all uppercase tracking-[0.2em]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-16 rounded-2xl bg-white text-zinc-950 font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5"
                >
                  Sorgula
                </button>
              </form>
            </div>
            
            {/* Küçük Bilgi Kartları */}
            <div className="mt-4 grid grid-cols-2 gap-4">
               
               <div className="p-4 rounded-2xl border border-white/5 bg-white/5 opacity-50 select-none">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Destek</p>
                  <p className="text-[11px] text-white/20 mt-1 font-medium italic">Chervantes Bot</p>
               </div>
            </div>
          </div>
        </div>
        
        {/* Dekoratif Işıklar */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -mr-48 -mt-48" />
      </section>

      <footer className="mt-20 border-t border-white/5 py-10 opacity-40">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
          <p>© 2026 Chervantes Digital</p>
          <div className="flex gap-4 italic">
            <Link href="/auth/login" className="hover:text-blue-500">Panel</Link>
            <Link href="/auth/register" className="hover:text-blue-500">Kayıt</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}