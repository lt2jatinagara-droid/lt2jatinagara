import { useState, useEffect } from "react";
import { Save, Plus, Trash2, ArrowLeft, LogOut, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { 
  auth, 
  db, 
  googleProvider, 
} from "../lib/firebase";

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isUsingFirebase, setIsUsingFirebase] = useState(false);

  useEffect(() => {
    // If Firebase is not configured, immediately fall back to local API to avoid infinite loading
    if (!auth || !auth.onAuthStateChanged) {
      console.warn("Firebase Auth not detected, falling back to local mode.");
      loadFromLocalApi();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (u: any) => {
      setUser(u);
      if (u) {
        setIsLoggedIn(true);
        setIsUsingFirebase(true);
        loadFromFirestore();
      } else {
        loadFromLocalApi();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadFromLocalApi = () => {
    fetch("/api/data")
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setData({
          settings: { title: "LT 2 Kwarran Jatinagara", year: "2026", location_name: "Bumi Perkemahan", location_address: "" },
          schedule: [],
          recap: [],
          slides: [],
          news: []
        });
        setLoading(false);
      });
  };

  const loadFromFirestore = async () => {
    try {
      const siteDoc = await getDoc(doc(db, "settings", "site"));
      if (siteDoc.exists()) {
        setData(siteDoc.data());
      } else {
        // If not in firestore yet, try local API or default
        loadFromLocalApi();
      }
      setLoading(false);
    } catch (e) {
      console.error("Firestore error:", e);
      loadFromLocalApi();
    }
  };

  const handleLogin = async () => {
    setMessage("Mencoba login...");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result) {
        setMessage("Login berhasil!");
      } else {
        setMessage("⚠️ Firebase belum dikonfigurasi. Gunakan mode password.");
      }
    } catch (e) {
      setMessage("❌ Login gagal: " + (e as Error).message);
    }
  };

  const handleLogout = async () => {
    if (auth && auth.signOut) await signOut(auth);
    setIsLoggedIn(false);
    setIsUsingFirebase(false);
    setUser(null);
    setPassword("");
    setMessage("Anda telah keluar.");
  };

  const handleSave = async () => {
    setMessage("Sedang menyimpan...");
    
    if (isUsingFirebase && db) {
      try {
        await setDoc(doc(db, "settings", "site"), data);
        setMessage("✅ Berhasil disimpan ke Cloud!");
      } catch (e) {
        setMessage("❌ Gagal simpan ke Cloud: " + (e as Error).message);
      }
      return;
    }

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, data }),
      });
      const result = await res.json();
      if (result.success) {
        setMessage("✅ Berhasil disimpan secara lokal!");
        setIsLoggedIn(true);
      } else {
        setMessage("❌ Password salah (Gunakan: admin123)");
      }
    } catch (e) {
      setMessage("❌ Terjadi kesalahan saat menyimpan.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center p-6">
      <div className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-muted animate-pulse">Memuat Data...</div>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[48px] shadow-2xl border border-brand-border max-w-md w-full text-center">
           <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <LogIn className="w-8 h-8 text-brand-primary" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">Admin Portal</h2>
          <p className="text-xs text-brand-muted font-bold uppercase tracking-widest mb-10 leading-relaxed italic">
            Masukkan password keamanan untuk mengelola data LT 2 Kwarran Jatinagara
          </p>

          <input
            type="password"
            placeholder="Ketik password: admin123"
            className="w-full p-5 rounded-2xl border-2 border-brand-border mb-4 font-bold text-center bg-brand-surface focus:border-brand-primary transition-all outline-none text-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (password === "admin123" ? setIsLoggedIn(true) : setMessage("❌ Password Salah!"))}
          />
          
          <button
            onClick={() => {
              if (password === "admin123") {
                setIsLoggedIn(true);
                setMessage("✅ Login berhasil (Mode Lokal)");
              } else {
                setMessage("❌ Password salah (Gunakan: admin123)");
              }
            }}
            className="w-full bg-brand-primary text-white font-black p-5 rounded-2xl hover:bg-brand-dark transition-all uppercase tracking-widest text-[11px] shadow-xl active:scale-95 mb-8"
          >
            Masuk Sekarang
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-border"></div></div>
            <div className="relative text-[8px] font-black text-brand-muted uppercase bg-white px-4">Atau Gunakan Akun Google</div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full border-2 border-brand-border text-brand-dark font-black p-4 rounded-2xl hover:bg-brand-surface transition-all uppercase tracking-widest text-[9px] flex items-center justify-center gap-3 active:scale-95"
          >
            Google Login
          </button>

          {message && <p className="mt-8 text-center text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] italic bg-brand-primary/5 p-3 rounded-xl">{message}</p>}
          <Link to="/" className="block text-center mt-10 text-[9px] font-black text-brand-muted uppercase tracking-[0.3em] hover:text-brand-dark transition-all italic">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-surface font-sans">
      <nav className="bg-white border-b border-brand-border p-6 sticky top-0 z-50 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-brand-surface rounded-xl transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-brand-muted" />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter italic">Admin Panel</h1>
            {user && <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">{user.email}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest italic animate-pulse">{message}</span>
          <button
            onClick={handleSave}
            className="bg-brand-primary text-white font-black px-8 py-3.5 rounded-full text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-brand-dark transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Cloud
          </button>
          <button onClick={handleLogout} className="p-3 bg-brand-surface text-brand-muted hover:text-brand-primary rounded-xl transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-10 space-y-12">
        {/* Warnings */}
        {!isUsingFirebase && (
          <div className="bg-brand-primary/5 border-2 border-brand-primary/20 p-8 rounded-[32px] flex items-center gap-6">
            <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center shrink-0">
              <Plus className="w-6 h-6 text-white rotate-45" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight italic">Mode Terbatas (Offline)</h4>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-1">Anda menggunakan login password. Data tidak tersimpan di Cloud. Silakan gunakan Google Login.</p>
            </div>
          </div>
        )}
        <section className="bg-white p-10 rounded-[40px] border border-brand-border shadow-xl">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 italic text-brand-primary">Pengaturan Umum</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-3">Judul Kegiatan</label>
              <input
                className="w-full p-4 rounded-2xl bg-brand-surface border border-brand-border font-bold"
                value={data.settings.title}
                onChange={(e) => setData({ ...data, settings: { ...data.settings, title: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-3">Tahun</label>
              <input
                className="w-full p-4 rounded-2xl bg-brand-surface border border-brand-border font-bold"
                value={data.settings.year}
                onChange={(e) => setData({ ...data, settings: { ...data.settings, year: e.target.value } })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-3">Nama Lokasi</label>
              <input
                className="w-full p-4 rounded-2xl bg-brand-surface border border-brand-border font-bold"
                value={data.settings.location_name}
                onChange={(e) => setData({ ...data, settings: { ...data.settings, location_name: e.target.value } })}
              />
            </div>
          </div>
        </section>

        {/* Slides Section */}
        <section className="bg-white p-10 rounded-[40px] border border-brand-border shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic text-brand-primary">Gambar Slide Beranda</h2>
            <button
              onClick={() => {
                const newSlides = [...(data.slides || [])];
                newSlides.push({ url: "https://picsum.photos/seed/new/1920/1080", title: "JUDUL SLIDE", desc: "Deskripsi singkat slide." });
                setData({ ...data, slides: newSlides });
              }}
              className="p-3 bg-brand-surface rounded-full text-brand-primary hover:bg-brand-primary hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              Tambah Slide
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {(data.slides || []).map((slide: any, idx: number) => (
              <div key={idx} className="bg-brand-surface p-6 rounded-2xl relative border border-brand-border/10">
                <button
                  onClick={() => {
                    const newSlides = [...data.slides];
                    newSlides.splice(idx, 1);
                    setData({ ...data, slides: newSlides });
                  }}
                  className="absolute top-4 right-4 text-brand-muted hover:text-brand-primary"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1">URL Gambar</label>
                    <input
                      className="w-full p-3 rounded-lg bg-white border border-brand-border font-mono text-[10px]"
                      value={slide.url}
                      onChange={(e) => {
                        const newSlides = [...data.slides];
                        newSlides[idx].url = e.target.value;
                        setData({ ...data, slides: newSlides });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1">Judul</label>
                    <input
                      className="w-full p-3 rounded-lg bg-white border border-brand-border font-bold text-xs"
                      value={slide.title}
                      onChange={(e) => {
                        const newSlides = [...data.slides];
                        newSlides[idx].title = e.target.value;
                        setData({ ...data, slides: newSlides });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1">Deskripsi</label>
                    <textarea
                      className="w-full p-3 rounded-lg bg-white border border-brand-border text-xs min-h-[60px]"
                      value={slide.desc}
                      onChange={(e) => {
                        const newSlides = [...data.slides];
                        newSlides[idx].desc = e.target.value;
                        setData({ ...data, slides: newSlides });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* News Section */}
        <section className="bg-white p-10 rounded-[40px] border border-brand-border shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic text-brand-primary">Berita & Artikel</h2>
            <button
              onClick={() => {
                const newNews = [...(data.news || [])];
                newNews.unshift({ 
                  id: Date.now(), 
                  title: "Judul Berita Baru", 
                  excerpt: "Ringkasan isi berita yang menarik...", 
                  date: new Date().toISOString().split('T')[0], 
                  image: "https://picsum.photos/seed/news/600/400" 
                });
                setData({ ...data, news: newNews });
              }}
              className="p-3 bg-brand-surface rounded-full text-brand-primary hover:bg-brand-primary hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              Tulis Berita
            </button>
          </div>
          <div className="space-y-6">
            {(data.news || []).map((article: any, idx: number) => (
              <div key={idx} className="bg-brand-surface p-6 rounded-3xl border border-brand-border/10 flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden bg-white border border-brand-border">
                  <img src={article.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1">Judul Berita</label>
                      <input
                        className="w-full p-3 rounded-lg bg-white border border-brand-border font-bold text-sm"
                        value={article.title}
                        onChange={(e) => {
                          const newNews = [...data.news];
                          newNews[idx].title = e.target.value;
                          setData({ ...data, news: newNews });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1">URL Gambar Thumbnail</label>
                      <input
                        className="w-full p-3 rounded-lg bg-white border border-brand-border font-mono text-[10px]"
                        value={article.image}
                        onChange={(e) => {
                          const newNews = [...data.news];
                          newNews[idx].image = e.target.value;
                          setData({ ...data, news: newNews });
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1">Ringkasan (Excerpt)</label>
                    <textarea
                      className="w-full p-3 rounded-lg bg-white border border-brand-border text-sm min-h-[80px]"
                      value={article.excerpt}
                      onChange={(e) => {
                        const newNews = [...data.news];
                        newNews[idx].excerpt = e.target.value;
                        setData({ ...data, news: newNews });
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newNews = [...data.news];
                    newNews.splice(idx, 1);
                    setData({ ...data, news: newNews });
                  }}
                  className="p-3 text-brand-muted hover:text-brand-primary"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Schedule Section */}
        <section className="bg-white p-10 rounded-[40px] border border-brand-border shadow-xl">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 italic text-brand-primary">Jadwal Kegiatan</h2>
          <div className="space-y-8">
            {data.schedule.map((day: any, dIdx: number) => (
              <div key={dIdx} className="border-t border-brand-border/10 pt-8 first:border-0 first:pt-0">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex gap-4 items-center">
                    <input
                      className="text-xl font-black uppercase tracking-tight w-32 border-b border-transparent focus:border-brand-primary"
                      value={day.day}
                      onChange={(e) => {
                        const newSchedule = [...data.schedule];
                        newSchedule[dIdx].day = e.target.value;
                        setData({ ...data, schedule: newSchedule });
                      }}
                    />
                    <input
                      className="text-sm font-bold text-brand-muted uppercase tracking-widest"
                      value={day.date}
                      onChange={(e) => {
                        const newSchedule = [...data.schedule];
                        newSchedule[dIdx].date = e.target.value;
                        setData({ ...data, schedule: newSchedule });
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {day.events.map((event: any, eIdx: number) => (
                    <div key={eIdx} className="flex gap-4 items-center bg-brand-surface p-4 rounded-2xl">
                      <input
                        className="w-32 bg-transparent text-xs font-mono font-bold text-brand-primary"
                        value={event.time}
                        onChange={(e) => {
                          const newSchedule = [...data.schedule];
                          newSchedule[dIdx].events[eIdx].time = e.target.value;
                          setData({ ...data, schedule: newSchedule });
                        }}
                      />
                      <input
                        className="flex-1 bg-transparent font-bold text-brand-dark"
                        value={event.name}
                        onChange={(e) => {
                          const newSchedule = [...data.schedule];
                          newSchedule[dIdx].events[eIdx].name = e.target.value;
                          setData({ ...data, schedule: newSchedule });
                        }}
                      />
                      <button
                        onClick={() => {
                          const newSchedule = [...data.schedule];
                          newSchedule[dIdx].events.splice(eIdx, 1);
                          setData({ ...data, schedule: newSchedule });
                        }}
                        className="p-2 text-brand-muted/30 hover:text-brand-primary transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newSchedule = [...data.schedule];
                      newSchedule[dIdx].events.push({ time: "00:00 - 00:00", name: "Acara Baru", location: "Lokasi" });
                      setData({ ...data, schedule: newSchedule });
                    }}
                    className="w-full p-4 border border-dashed border-brand-border rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    Tambah Acara
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recap Section */}
        <section className="bg-white p-6 md:p-10 rounded-[40px] border border-brand-border shadow-xl overflow-hidden">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 italic text-brand-primary">Pengaturan Skor & Rekapitulasi</h2>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left border-collapse min-w-[2000px]">
              <thead>
                <tr className="border-b border-brand-border/10">
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-brand-muted">No</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-brand-muted min-w-[200px]">Nama Regu</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-brand-muted">No Tenda</th>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <th key={i} className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-brand-muted text-center">Lomba {i + 1}</th>
                  ))}
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-brand-primary text-right">Total</th>
                  <th className="py-4 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-surface">
                {data.recap.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-brand-surface/50 transition-colors group">
                    <td className="py-4 px-4 font-black text-brand-muted/30">{i + 1}</td>
                    <td className="py-4 px-4">
                      <input
                        className="w-full bg-transparent font-black uppercase tracking-tight"
                        value={item.team}
                        onChange={(e) => {
                          const newRecap = [...data.recap];
                          newRecap[i].team = e.target.value;
                          setData({ ...data, recap: newRecap });
                        }}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        className="w-24 bg-transparent font-bold text-slate-500 uppercase tracking-widest text-xs"
                        value={item.tent_no}
                        onChange={(e) => {
                          const newRecap = [...data.recap];
                          newRecap[i].tent_no = e.target.value;
                          setData({ ...data, recap: newRecap });
                        }}
                      />
                    </td>
                    {Array.from({ length: 20 }).map((_, sIdx) => (
                      <td key={sIdx} className="py-4 px-1">
                        <input
                          type="number"
                          className="w-16 bg-white border border-brand-border/10 p-2 rounded-lg text-center font-bold text-xs focus:border-brand-primary outline-none transition-colors"
                          value={item.scores[sIdx] || 0}
                          onChange={(e) => {
                            const newRecap = [...data.recap];
                            const val = parseInt(e.target.value) || 0;
                            newRecap[i].scores[sIdx] = val;
                            // Recalculate total
                            newRecap[i].total = newRecap[i].scores.reduce((a: number, b: number) => a + b, 0);
                            setData({ ...data, recap: newRecap });
                          }}
                        />
                      </td>
                    ))}
                    <td className="py-4 px-4 text-right">
                      <span className="font-black text-lg tracking-tighter text-brand-primary">{item.total}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          const newRecap = [...data.recap];
                          newRecap.splice(i, 1);
                          setData({ ...data, recap: newRecap });
                        }}
                        className="p-2 text-slate-200 hover:text-brand-primary transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => {
              setData({ 
                ...data, 
                recap: [...data.recap, { 
                  rank: data.recap.length + 1, 
                  team: "Regu Baru", 
                  tent_no: "-", 
                  scores: Array(20).fill(0),
                  total: 0 
                }] 
              });
            }}
            className="mt-8 w-full p-6 border border-dashed border-brand-border rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Baris Regu
          </button>
        </section>
      </main>
      
      <footer className="p-10 text-center text-[10px] font-black uppercase tracking-widest text-brand-muted border-t border-brand-border bg-white">
        Admin Panel © 2026 Kwarran Jatinagara
      </footer>
    </div>
  );
}
