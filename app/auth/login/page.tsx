"use client";

import { useState } from "react";
import { auth } from "../../../lib/firebase"; 
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FirebaseError {
  code: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin"); // Giriş başarılıysa admine git
    } catch (err: unknown) {
      const firebaseErr = err as FirebaseError;
      if (firebaseErr.code === "auth/user-not-found" || firebaseErr.code === "auth/wrong-password" || firebaseErr.code === "auth/invalid-credential") {
        setError("E-posta veya şifre hatalı.");
      } else {
        setError("Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      
      <div className="max-w-md w-full relative">
        <div className="p-10 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Usta Paneli</div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Hoş Geldiniz</h2>
          </div>

          {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs text-center font-bold italic">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-6">
            <input required type="email" placeholder="E-POSTA ADRESİ" className="w-full h-14 bg-zinc-900/50 border border-white/5 rounded-2xl px-5 text-white outline-none focus:border-blue-500/50" onChange={(e) => setEmail(e.target.value)} />
            <input required type="password" placeholder="ŞİFRE" className="w-full h-14 bg-zinc-900/50 border border-white/5 rounded-2xl px-5 text-white outline-none focus:border-blue-500/50" onChange={(e) => setPassword(e.target.value)} />
            <button disabled={loading} className="w-full h-14 bg-white text-zinc-950 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-zinc-200 transition-all">
              {loading ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-zinc-500 font-medium">
            Hesabınız yok mu? <Link href="/auth/register" className="text-blue-400 font-bold ml-1">Hemen Kayıt Ol</Link>
          </div>
        </div>
      </div>
    </div>
  );
}