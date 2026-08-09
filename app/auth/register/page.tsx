"use client";

import { useState } from "react";
import { auth, db } from "../../../lib/firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; 
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FirebaseError {
  code: string;
  message: string;
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPending, setIsPending] = useState(false); // Onay bekleme ekranı kontrolü
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;

      await setDoc(doc(db, "Kullanicilar", user.uid), {
        uid: user.uid,
        email: email,
        status: "pending", 
        kayitTarihi: new Date().toISOString(),
        rol: "usta"
      });

      // Kayıt başarılı, formu kapat ve onay mesajını göster
      setIsPending(true);
      
    } catch (err: unknown) {
      const firebaseErr = err as FirebaseError;
      switch (firebaseErr.code) {
        case "auth/email-already-in-use":
          setError("BU USTA HESABI ZATEN MEVCUT.");
          break;
        case "auth/weak-password":
          setError("ŞİFRE EN AZ 6 KARAKTER OLMALIDIR.");
          break;
        default:
          setError("BAĞLANTI HATASI! LÜTFEN TEKRAR DENEYİN.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 1. ONAY BEKLENİYOR EKRANI (BİLDİRİM)
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 font-sans italic uppercase">
        <div className="max-w-md w-full p-12 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="mb-10 flex justify-center">
            <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          <h2 className="text-4xl font-black text-white italic tracking-tighter mb-6 leading-none">
            KAYIT <span className="text-blue-500">MÜHÜRLENDİ</span>
          </h2>
          
          <p className="text-[11px] font-black text-zinc-400 mb-10 leading-relaxed tracking-[0.2em]">
            HESABINIZ <span className="text-white">15 DAKİKA</span> İÇİNDE ONAYLANACAKTIR. <br />
            ANLAYIŞINIZ İÇİN TEŞEKKÜR EDERİZ.
          </p>

          <div className="py-4 px-6 bg-blue-600/10 rounded-2xl border border-blue-500/20 inline-block">
            <p className="text-[9px] font-black text-blue-500 tracking-[0.3em]">
              SİSTEM: CHERVANTES WORKSHOP ECOSYSTEM
            </p>
          </div>
          
          <button 
            onClick={() => router.push("/auth/login")} 
            className="mt-12 block w-full text-[10px] font-black text-zinc-500 hover:text-white transition-colors tracking-[0.4em]"
          >
            GİRİŞ SAYFASINA DÖN
          </button>
        </div>
      </div>
    );
  }

  // 2. NORMAL KAYIT FORMU
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden font-sans italic">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full -mr-32 -mt-32" />

      <div className="max-w-md w-full relative">
        <div className="p-12 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-2xl ring-1 ring-white/10">
          
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Usta Kaydı</h2>
            <p className="text-zinc-500 text-[10px] mt-4 font-black tracking-[0.3em] uppercase opacity-70 italic">Chervantes Workshop Ecosystem</p>
          </div>

          {error && (
            <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[11px] font-black uppercase text-center italic tracking-wider">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2 italic">E-Posta Adresi</label>
              <input 
                required
                type="email" 
                placeholder="usta@chervantes.com"
                className="w-full h-16 bg-zinc-900/50 border border-white/5 rounded-2xl px-6 text-white outline-none focus:border-blue-500/40 transition-all font-bold tracking-tight uppercase"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2 italic">Güvenli Şifre</label>
              <input 
                required
                type="password" 
                placeholder="••••••••"
                className="w-full h-16 bg-zinc-900/50 border border-white/5 rounded-2xl px-6 text-white outline-none focus:border-blue-500/40 transition-all font-bold tracking-tight uppercase"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              disabled={loading}
              className="w-full h-16 bg-white text-zinc-950 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl hover:bg-zinc-200 disabled:opacity-50 transition-all shadow-xl shadow-white/5 active:scale-95"
            >
              {loading ? "MÜHÜRLENİYOR..." : "USTA HESABI OLUŞTUR"}
            </button>
          </form>

          <div className="mt-10 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
            Zaten kayıtlı mısınız? <Link href="/auth/login" className="text-blue-500 ml-2 hover:text-blue-400">GİRİŞ YAP</Link>
          </div>
        </div>
      </div>
    </div>
  );
}