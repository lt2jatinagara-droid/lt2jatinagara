import { useState, useEffect } from "react";
import { Save, Plus, Trash2, ArrowLeft, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [isVercelStatic, setIsVercelStatic] = useState(false);

  useEffect(() => {
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
        setIsVercelStatic(true);
        // Fallback to empty structure or local storage if we wanted to be fancy, 
        // but for now just data from data.json if we could, but we can't fetch it if API fails.
        setData({
          settings: { title: "LT 2 Kwarran Jatinagara", year: "2026", location_name: "Bumi Perkemahan", location_address: "" },
          schedule: [],
          recap: []
        });
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (isVercelStatic) {
      setMessage("Gagal: Penyimpanan tidak didukung di Vercel Statis. Gunakan Firebase!");
      return;
    }
    setMessage("Menyimpan...");
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, data }),
      });
      const result = await res.json();
      if (result.success) {
        setMessage("Berhasil disimpan!");
        setIsLoggedIn(true);
      } else {
        setMessage("Password salah atau gagal menyimpan.");
      }
    } catch (e) {
      setMessage("Terjadi kesalahan.");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  if (!isLoggedIn && !password) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-brand-border max-w-md w-full">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">Admin Login</h2>
          <input
            type="password"
            placeholder="Masukkan Password Admin"
            className="w-full p-4 rounded-xl border border-brand-border mb-6 font-bold"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={() => {
              if (password === "admin123") {
                setIsLoggedIn(true);
                setMessage("Login berhasil (Mode Offline)");
              } else {
                setMessage("Password salah!");
              }
            }}
            className="w-full bg-brand-primary text-white font-bold p-4 rounded-xl hover:bg-brand-dark transition-all uppercase tracking-widest text-xs"
          >
            Masuk ke Panel
          </button>
          {message && <p className="mt-4 text-center text-xs font-bold text-red-500 uppercase tracking-widest">{message}</p>}
          <Link to="/" className="block text-center mt-6 text-xs font-bold text-brand-muted uppercase tracking-widest hover:text-brand-dark">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-surface font-sans">
      <nav className="bg-white border-b border-brand-border p-6 sticky top-0 z-50 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-brand-surface rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-brand-muted" />
          </Link>
          <h1 className="text-xl font-black uppercase tracking-tighter">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest italic">{message}</span>
          <button
            onClick={handleSave}
            className="bg-brand-primary text-white font-bold px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-brand-dark transition-all shadow-lg"
          >
            <Save className="w-3 h-3" />
            Simpan Perubahan
          </button>
          <button onClick={() => setIsLoggedIn(false)} className="p-2 text-brand-muted hover:text-brand-dark">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-10 space-y-12">
        {/* Settings Section */}
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
