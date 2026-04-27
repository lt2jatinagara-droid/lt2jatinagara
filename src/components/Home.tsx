import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  Users, 
  Clock, 
  ChevronLeft,
  ChevronRight, 
  Menu, 
  X, 
  Compass, 
  Tent, 
  Flame,
  Award,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  ExternalLink,
  Globe
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  db, 
  doc, 
  onSnapshot 
} from "../lib/firebase";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [siteData, setSiteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    
    // Initial load from local API
    fetch("/api/data")
      .then(res => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then(data => {
        setSiteData(data);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Local API load failed, waiting for Cloud sync...", err.message);
      });

    // Real-time sync with Cloud (Firebase)
    const unsubscribe = onSnapshot(doc(db, "settings", "site"), (docSnap) => {
      if (docSnap.exists()) {
        setSiteData(docSnap.data());
        setLoading(false);
      }
    }, (error) => {
      console.warn("Firebase sync error:", error.message);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!siteData?.slides?.length) return;
    
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % siteData.slides.length);
    }, 6000);

    return () => clearInterval(slideTimer);
  }, [siteData]);

  if (loading || !siteData) return <div className="min-h-screen bg-brand-surface flex items-center justify-center font-bold uppercase tracking-widest text-brand-muted">Loading...</div>;

  const { schedule, recap, settings, slides = [], news = [] } = siteData;

  const COMPETITIONS = [
    { id: 1, name: "Pionering", icon: <Tent className="w-6 h-6" />, desc: "Ketangkasan membuat bangunan darurat menggunakan tali dan tongkat." },
    { id: 2, name: "Semaphore & Morse", icon: <Compass className="w-6 h-6" />, desc: "Adu cepat dan tepat dalam berkirim pesan rahasia jarak jauh." },
    { id: 3, name: "PBB & Variasi", icon: <Users className="w-6 h-6" />, desc: "Kerapian dan kekompakan dalam baris berbaris." },
    { id: 4, name: "Pentas Seni", icon: <Flame className="w-6 h-6" />, desc: "Menampilkan bakat seni budaya dari masing-masing regu." },
  ];

  const SOCIAL_PLATFORMS = [
    { name: "Instagram", icon: <Instagram className="w-6 h-6" />, handle: "@pramukajatinagara_", url: "https://instagram.com/pramukajatinagara_", color: "bg-pink-600" },
    { name: "YouTube", icon: <Youtube className="w-6 h-6" />, handle: "Pramuka Jatinagara", url: "https://youtube.com/@pramukajatinagara", color: "bg-red-600" },
    { name: "WhatsApp", icon: <MessageCircle className="w-6 h-6" />, handle: "Official Admin", url: "https://wa.me/6281234567890", color: "bg-green-600" },
    { name: "Facebook", icon: <Facebook className="w-6 h-6" />, handle: "Kwarran Jatinagara", url: "https://facebook.com/kwarran.jatinagara", color: "bg-blue-600" },
  ];

  const DOCUMENTS = [
    { title: "Petunjuk Teknis LT 2", type: "PDF", size: "2.4 MB" },
    { title: "Formulir Pendaftaran", type: "DOCX", size: "1.1 MB" },
    { title: "Daftar Perlengkapan", type: "PDF", size: "850 KB" },
    { title: "Surat Izin Orang Tua", type: "PDF", size: "420 KB" },
  ];

  return (
    <div className="min-h-screen selection:bg-brand-primary selection:text-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-white border-b border-brand-border py-4" : "bg-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <h1 className={`text-sm font-black uppercase tracking-tighter leading-none ${scrolled ? "text-brand-dark" : "text-white"}`}>
                LT 2 KWARRAN
              </h1>
              <p className={`text-[20px] font-semibold tracking-widest uppercase leading-none mt-1 ${scrolled ? "text-brand-primary" : "text-brand-primary"}`}>
                JATINAGARA
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex gap-6 text-xs font-bold uppercase tracking-wider">
            {["Beranda", "Tentang", "Berita", "Jadwal", "Lomba", "Denah", "Rekap", "Dokumen", "Lokasi"].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className={`transition-colors pb-1 border-b-2 border-transparent hover:border-brand-primary ${scrolled ? "text-brand-muted hover:text-black" : "text-white/80 hover:text-white"}`}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/admin" className={`hidden md:block text-[10px] font-black px-6 py-3 rounded-full uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 ${scrolled ? "bg-brand-primary text-white hover:bg-brand-dark" : "bg-brand-primary text-white hover:bg-white hover:text-brand-primary"}`}>
              Admin Panel
            </Link>
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className={scrolled ? "text-brand-dark" : "text-white"} /> : <Menu className={scrolled ? "text-brand-dark" : "text-white"} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-white shadow-xl p-6 md:hidden flex flex-col gap-4"
            >
              {["Beranda", "Tentang", "Berita", "Jadwal", "Lomba", "Denah", "Rekap", "Dokumen", "Lokasi"].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-bold uppercase tracking-widest border-b border-brand-border pb-2 text-brand-muted"
                >
                  {item}
                </a>
              ))}
              <Link to="/admin" className="mt-4 w-full text-center bg-brand-primary text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg">
                Masuk Panel Admin
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="beranda" className="h-screen bg-black flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        {/* Image Slider Component */}
        <div className="absolute inset-0 z-0 text-white">
          {slides.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80 z-10" />
                <img 
                  src={slides[currentSlide]?.url} 
                  alt={slides[currentSlide]?.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="absolute inset-0 bg-brand-dark" />
          )}
        </div>

        {slides.length > 0 && (
          <motion.div
            key={`content-${currentSlide}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="z-10 text-white max-w-5xl"
          >
            <div className="inline-block bg-brand-primary text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-8 italic shadow-xl">
              {slides[currentSlide]?.desc}
            </div>
            <h1 className="text-4xl md:text-7xl font-black mb-8 leading-tight tracking-tighter uppercase">
              {slides[currentSlide]?.title}<br />
              <span className="text-brand-primary">TINGKAT II</span>
            </h1>
            <p className="text-lg md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              Lomba Pramuka Penggalang Kwartir Ranting Jatinagara {settings.year}. Ajang kompetisi paling bergengsi tahun ini!
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <a href="#jadwal" className="bg-brand-primary hover:bg-red-700 text-white font-bold px-10 py-5 rounded-full uppercase tracking-widest text-xs transition-all transform hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                Lihat Jadwal
              </a>
              <a href="#tentang" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold px-10 py-5 rounded-full border border-white/20 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2">
                Informasi Detail
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}

        {/* Slider Controls */}
        {slides.length > 1 && (
          <>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 z-20 pointer-events-none">
              <button 
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                className="p-4 rounded-full bg-white/5 hover:bg-brand-primary text-white backdrop-blur-md pointer-events-auto transition-all border border-white/10 group"
              >
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="p-4 rounded-full bg-white/5 hover:bg-brand-primary text-white backdrop-blur-md pointer-events-auto transition-all border border-white/10 group"
              >
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Slider Indicators */}
            <div className="absolute bottom-32 left-0 w-full flex justify-center gap-3 z-20">
              {slides.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 transition-all duration-500 rounded-full ${i === currentSlide ? "w-10 bg-brand-primary" : "w-4 bg-white/30"}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Floating Stats */}
        <div className="absolute bottom-10 left-0 w-full hidden md:block">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-4 gap-8">
            {[
              { icon: <Users />, label: "Peserta Terdaftar", value: "350+" },
              { icon: <MapPin />, label: "Gugus Depan", value: "25" },
              { icon: <Tent />, label: "Tenda Berdiri", value: "50" },
              { icon: <Award />, label: "Penghargaan", value: "12 Mata Lomba" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex items-center gap-4 text-white"
              >
                <div className="p-3 bg-brand-primary/20 rounded-xl text-brand-primary">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{stat.label}</p>
                  <p className="text-xl font-bold tracking-tight">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* News/Berita Section */}
      {news.length > 0 && (
        <section id="berita" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div>
                <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter uppercase mb-2">Berita & Artikel</h2>
                <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em] italic">Kabar Terbaru Seputar LT 2 Jatinagara</p>
              </div>
              <a href="#" className="text-xs font-black uppercase tracking-widest text-brand-primary hover:text-brand-dark transition-colors pb-1 border-b-2 border-brand-primary">
                Lihat Semua Berita →
              </a>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {news.map((item: any, i: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group"
                >
                  <div className="aspect-[16/10] rounded-[32px] overflow-hidden bg-brand-surface border border-brand-border mb-6 relative">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-brand-primary shadow-lg group-hover:bg-brand-primary group-hover:text-white transition-all">
                        {item.date}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4 group-hover:text-brand-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-brand-muted leading-relaxed line-clamp-3 mb-6 italic">
                    {item.excerpt}
                  </p>
                  <button className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:gap-3 transition-all flex items-center gap-2">
                    Baca Selengkapnya <ChevronRight className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hero Stats */}
      <section className="bg-white border-b border-brand-border py-12 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex justify-center gap-12">
           <div className="flex flex-col items-center">
              <p className="text-[10px] uppercase font-bold text-brand-muted mb-1 tracking-widest">Tanggal Pelaksanaan</p>
              <p className="text-black font-black text-2xl tracking-tighter">28 - 30 Juli {settings.year}</p>
           </div>
           <div className="w-px h-12 bg-brand-border"></div>
           <div className="flex flex-col items-center">
              <p className="text-[10px] uppercase font-bold text-brand-muted mb-1 tracking-widest">Lokasi Perkemahan</p>
              <p className="text-black font-black text-2xl tracking-tighter">{settings.location_name}</p>
           </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-24 bg-brand-surface relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-block bg-brand-primary/10 text-brand-primary text-[10px] font-bold px-3 py-1 rounded uppercase tracking-widest mb-6 italic">Mengenal Kegiatan</div>
              <h2 className="text-5xl md:text-6xl font-black text-black leading-tight mb-8">
                Apa itu <span className="text-brand-primary">LT 2?</span>
              </h2>
              <div className="space-y-6 text-lg text-brand-muted leading-relaxed">
                <p>
                  Lomba Tingkat 2 (LT 2) adalah sebuah ajang pertemuan besar bagi para Pramuka Penggalang di tingkat Kwartir Ranting. Kegiatan ini bukan sekadar perlombaan, melainkan sebuah platform untuk mengukur pencapaian kecakapan dan keterampilan bagi seluruh anggota regu.
                </p>
                <p>
                  Tujuannya adalah untuk membentuk pribadi penggalang yang tangguh, mandiri, kreatif, dan memiliki jiwa kepemimpinan serta persaudaraan yang tinggi. Pemenang dari LT 2 akan mewakili Kwarran Jatinagara ke ajang Lomba Tingkat 3 di tingkat Kwartir Cabang.
                </p>
                <ul className="grid grid-cols-2 gap-4 pt-4">
                  {["Sportifitas", "Kemandirian", "Religius", "Persaudaraan"].map((val) => (
                    <li key={val} className="flex items-center gap-3 text-black font-bold uppercase text-[11px] tracking-widest">
                      <div className="w-2 h-2 bg-brand-primary rounded-sm"></div>
                      {val}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-4 bg-white rounded-[32px] border border-brand-border shadow-xl"
            >
              <div className="aspect-square rounded-[24px] overflow-hidden relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1544391219-09419106093f?q=80&w=2072&auto=format&fit=crop" 
                  alt="Scouts Activity"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Lomba Section */}
      <section id="lomba" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-black mb-4 tracking-tighter uppercase">Kompetisi Utama</h2>
          <p className="text-[11px] font-bold text-brand-primary uppercase tracking-[0.3em] mb-20 italic">Ajang Pembuktian Kualitas Regu Penggalang</p>
          <div className="grid md:grid-cols-4 gap-8">
            {COMPETITIONS.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-brand-surface p-10 rounded-3xl border border-brand-border text-center group hover:bg-black hover:border-black transition-all duration-500"
              >
                <div className="w-16 h-16 bg-white shadow-md text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest mb-4 group-hover:text-white">{item.name}</h3>
                <p className="text-xs text-brand-muted group-hover:text-slate-400 leading-relaxed italic">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="jadwal" className="py-24 bg-brand-surface">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter uppercase mb-2">Jadwal Kegiatan</h2>
              <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em] italic">Timeline Pelaksanaan Lomba Tingkat II</p>
            </div>
            <div className="flex gap-2 p-1.5 bg-white rounded-full border border-brand-border">
              {schedule.map((day: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveDay(i)}
                  className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeDay === i ? "bg-brand-primary text-white shadow-xl" : "bg-transparent text-brand-muted hover:text-black uppercase"}`}
                >
                  {day.day}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            key={activeDay}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-dark rounded-[40px] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Clock className="w-64 h-64" />
            </div>
            
            <div className="flex justify-between items-center mb-12 relative z-10">
              <h3 className="text-2xl font-black uppercase tracking-widest text-brand-primary italic">{schedule[activeDay].date}</h3>
              <span className="text-[10px] bg-white/10 px-3 py-1 rounded-md font-bold tracking-widest uppercase">Hari {activeDay + 1}</span>
            </div>

            <div className="space-y-10 relative z-10">
              {schedule[activeDay].events.map((event: any, i: number) => (
                <div key={i} className="flex gap-6 md:gap-10 items-start group">
                  <div className="text-brand-primary font-mono font-bold text-sm pt-1 shrink-0 bg-white/5 px-3 py-1 rounded group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    {event.time.split(' - ')[0]}
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-xl font-black uppercase tracking-tight mb-2 leading-none group-hover:text-brand-primary transition-colors">{event.name}</h4>
                    <p className="text-[11px] text-brand-muted font-bold uppercase tracking-widest flex items-center gap-2">
                       <MapPin className="w-3 h-3 group-hover:animate-bounce" />
                       {event.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Denah Section */}
      <section id="denah" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter uppercase mb-2">Denah Perkemahan</h2>
              <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em] italic">Tata Letak Area & Kapling Tenda</p>
            </div>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-[40px] p-8 md:p-12 relative overflow-hidden group">
            <div className="aspect-[16/9] w-full bg-white rounded-[24px] border border-brand-border flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
               {/* Schematic Site Plan Placeholder */}
               <div className="grid grid-cols-4 grid-rows-3 gap-4 w-full h-full p-8 opacity-20">
                  {Array.from({length: 12}).map((_, i) => (
                    <div key={i} className="border border-brand-muted rounded-lg flex items-center justify-center font-bold text-xs uppercase">Blok {String.fromCharCode(65 + i)}</div>
                  ))}
               </div>
               <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center px-6">
                  <div className="bg-brand-dark text-white p-6 rounded-full mb-6 shadow-2xl group-hover:scale-110 transition-transform">
                    <Tent className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-black uppercase text-black tracking-tighter mb-2 italic">Denah Digital Dalam Proses</h3>
                  <p className="text-brand-muted max-w-md text-xs font-bold uppercase tracking-widest">Hubungi sekretariat untuk mendapatkan salinan fisik site plan terbaru di lokasi bumi perkemahan.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rekap Section */}
      <section id="rekap" className="py-24 bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4">Rekapitulasi <span className="text-brand-primary">Lomba</span></h2>
            <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em] italic">Update Skor & Klasemen Seluruh Mata Lomba</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[2000px]">
                <thead>
                  <tr className="border-b border-white/10 italic text-brand-primary">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">No</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest min-w-[250px]">Nama Regu</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">No Tenda</th>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <th key={i} className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-center whitespace-nowrap">L-0{i + 1}</th>
                    ))}
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right whitespace-nowrap">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/90">
                  {recap.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black ${i === 0 ? "bg-brand-primary text-white scale-110 shadow-lg shadow-brand-primary/20" : "bg-white/10 text-white"}`}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="px-8 py-6 font-black uppercase tracking-tight text-xl">{item.team}</td>
                      <td className="px-8 py-6 text-brand-muted font-bold uppercase text-[11px] tracking-widest italic">{item.tent_no}</td>
                      {item.scores.map((score: number, sIdx: number) => (
                        <td key={sIdx} className="px-4 py-6 text-center text-brand-muted font-bold text-sm">{score}</td>
                      ))}
                      <td className="px-8 py-6 text-right font-black text-2xl tracking-tighter text-brand-primary">
                        {item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-8 border-t border-white/10 bg-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted italic">L-01 s/d L-20 merupakan kode Mata Lomba sesuai Petunjuk Teknis.</p>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted italic">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dokumen Section */}
      <section id="dokumen" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
           <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase mb-4">Unduh Dokumen</h2>
              <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em] italic">Persiapan Administrasi & Teknis</p>
           </div>
           <div className="grid sm:grid-cols-2 gap-6">
              {DOCUMENTS.map((doc, i) => (
                <div key={i} className="p-8 bg-brand-surface border border-brand-border rounded-3xl flex items-center justify-between group hover:border-brand-primary transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-primary shadow-sm group-hover:scale-110 transition-transform">
                       <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight text-black mb-1">{doc.title}</h4>
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{doc.type} • {doc.size}</p>
                    </div>
                  </div>
                  <button className="p-3 bg-white border border-brand-border rounded-xl text-brand-muted hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-sm">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Location Area */}
      <section id="platform" className="py-24 bg-brand-surface border-y border-brand-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter uppercase mb-2">Platform Resmi</h2>
              <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em] italic">Terhubung Melalui Ekosistem Digital Kami</p>
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {SOCIAL_PLATFORMS.map((platform, i) => (
              <motion.a
                key={i}
                href={platform.url}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[32px] border border-brand-border flex flex-col items-center text-center group hover:bg-black hover:border-black transition-all duration-300 shadow-xl"
              >
                <div className={`w-16 h-16 ${platform.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  {platform.icon}
                </div>
                <h4 className="text-lg font-black uppercase text-black group-hover:text-white transition-colors">{platform.name}</h4>
                <p className="text-xs text-brand-muted font-bold group-hover:text-white/60 transition-colors uppercase mt-1 italic">{platform.handle}</p>
                <div className="mt-8 text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2 group-hover:text-white">
                  Kunjungi <ExternalLink className="w-3 h-3" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Location Area */}
      <section id="lokasi" className="py-24 bg-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block bg-brand-dark text-white text-[10px] font-bold px-3 py-1 rounded uppercase tracking-[0.3em] mb-6 italic">Venue Utama</div>
              <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter uppercase mb-6">Informasi <br /><span className="text-brand-primary">Lokasi</span></h2>
              <div className="space-y-6">
                <div className="bg-brand-surface border border-brand-border p-8 rounded-3xl shadow-sm flex gap-6 group hover:border-brand-primary transition-colors">
                  <div className="p-4 bg-white shadow-sm rounded-2xl h-fit text-brand-primary font-black uppercase text-xs tracking-widest">MAP</div>
                  <div className="flex-1">
                    <p className="font-black text-black mb-2 uppercase tracking-tight">{settings.location_name}</p>
                    <p className="text-xs text-brand-muted leading-relaxed">{settings.location_address}</p>
                    <button className="mt-4 text-[10px] font-black text-brand-primary flex items-center gap-1 uppercase tracking-[0.2em] hover:gap-3 transition-all">
                      Buka di Google Maps →
                    </button>
                  </div>
                </div>
                
                <div className="bg-brand-dark border border-brand-dark p-8 rounded-3xl shadow-xl flex gap-6 text-white group">
                  <div className="p-4 bg-white/10 rounded-2xl h-fit text-brand-primary">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-4 text-brand-primary italic">Kontak Panitia</h4>
                    <div className="space-y-2">
                       <p className="text-md font-bold">+62 812 3456 7890 <span className="text-brand-muted font-medium font-sans text-xs ml-2">(Kak Ahmad)</span></p>
                       <p className="text-md font-bold">+62 812 0987 6543 <span className="text-brand-muted font-medium font-sans text-xs ml-2">(Kak Siti)</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[40px] overflow-hidden shadow-2xl aspect-[4/5] bg-brand-surface border border-brand-border relative group">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15832.228581729116!2d108.4144372!3d-7.2345678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6f4f2c00000001%3A0x7d00000000000000!2sJatinagara%2C%20Ciamis%20Regency%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1714197100000!5m2!1sen!2sid" 
                className="w-full h-full border-0 grayscale group-hover:grayscale-0 transition-all duration-1000" 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div>
                   <h4 className="text-md font-black uppercase tracking-tighter text-black leading-none">LT 2 Kwarran</h4>
                   <p className="text-[10px] font-semibold text-brand-primary tracking-widest uppercase leading-none mt-1">JATINAGARA</p>
                </div>
              </div>
              <p className="text-brand-muted text-xs font-medium uppercase tracking-[0.1em] max-w-sm mb-8 italic">
                Sistem Informasi Kegiatan Kepramukaan Kwartir Ranting Jatinagara. Satyaku Kudharmakan, Dharmaku Kubaktikan.
              </p>
              <div className="flex gap-4">
                {[Instagram, Facebook, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="p-3 bg-brand-surface rounded-xl text-brand-muted hover:text-brand-primary transition-all border border-brand-border">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black mb-8 italic">Navigasi Utama</h4>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-brand-muted">
                {["Beranda", "Tentang", "Jadwal", "Lomba"].map(item => (
                  <li key={item}><a href={`#${item.toLowerCase()}`} className="hover:text-brand-primary transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black mb-8 italic">Dokumen & Link</h4>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-brand-muted">
                <li><a href="#" className="hover:text-brand-primary transition-colors">Petunjuk Teknis</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Form Pendaftaran</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Hasil Lomba</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted">
            <p>© {settings.year} KWARRAN JATINAGARA. MuhammadImamSyafi'i.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-black transition-colors italic">Privacy Policy</a>
              <a href="#" className="hover:text-black transition-colors italic">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <a 
        href="https://wa.me/6281234567890" 
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-10 right-10 z-50 bg-green-600 text-white p-5 rounded-full shadow-2xl hover:bg-green-700 hover:scale-110 active:scale-95 transition-all group"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute right-full mr-6 bg-brand-dark text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none translate-x-4 group-hover:translate-x-0">
          WhatsApp Panitia
        </span>
      </a>
    </div>
  );
}
