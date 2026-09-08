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
  Globe,
  MoreVertical,
  FileText,
  Download
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { 
  db, 
} from "../lib/firebase";
import rawFallbackData from "../../data.json";
// @ts-ignore
import defaultPembinaImage from "../assets/images/pembina_pramuka_1779719747205.png";

const DEFAULT_SD_COMPETITIONS = [
  "Kuliah",
  "Murotal",
  "Daftaran",
  "PBBT",
  "Quizizz",
  "4K",
  "TU",
  "Peta P",
  "Senam",
  "Sketpan",
  "Isyayan",
  "Menaksir",
  "Adm Regu",
  "Hasta K",
  "Halrin",
  "Katapel",
  "Pidato",
  "P3k",
  "Bivak",
  "Masak",
  "Folksong",
  "Karnafal",
  "Bakiak"
];

const DEFAULT_SMP_COMPETITIONS = [
  "Kuliah",
  "Murotal",
  "Daftaran",
  "PBBT",
  "Quizizz",
  "4K",
  "TU",
  "Peta P",
  "Senam",
  "Peta L",
  "Sketpan",
  "Isyayan",
  "M Pion",
  "Menaksir",
  "KIM",
  "Jernih Air",
  "Adm Regu",
  "Hasta K",
  "Halrin",
  "Katapel",
  "Roket A",
  "Reportase",
  "Pidato",
  "P3k",
  "Bivak",
  "Masak",
  "Obat T",
  "Folksong",
  "Seni R",
  "Karnafal",
  "Bakiak",
  "Lari B"
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [localData, setLocalData] = useState<any>(rawFallbackData);
  const [siteData, setSiteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);

  const mergeWithFallback = (incomingData: any, referenceData: any = rawFallbackData) => {
    if (!incomingData) return referenceData || rawFallbackData;
    const ref = referenceData || rawFallbackData;

    // Merge settings properties safely, avoiding overriding valid image/logo values with empty ones
    const mergedSettings = {
      ...ref.settings,
    };

    if (incomingData.settings) {
      Object.keys(incomingData.settings).forEach((key) => {
        if (incomingData.settings[key] !== undefined && incomingData.settings[key] !== null && incomingData.settings[key] !== "") {
          mergedSettings[key] = incomingData.settings[key];
        }
      });
    }

    const rawSchedule = incomingData.schedule && incomingData.schedule.length > 0 ? incomingData.schedule : ref.schedule;
    const sanitizedSchedule = (rawSchedule || []).map((item: any) => {
      let d = item.date || "";
      if (d.includes("28 Juli") || d.includes("28 Juli 2026")) {
        d = d.replace("28 Juli 2026", "15 September 2026").replace("28 Juli", "15 September 2026");
      }
      if (d.includes("29 Juli") || d.includes("29 Juli 2026")) {
        d = d.replace("29 Juli 2026", "16 September 2026").replace("29 Juli", "16 September 2026");
      }
      if (d.includes("30 Juli") || d.includes("30 Juli 2026")) {
        d = d.replace("30 Juli 2026", "17 September 2026").replace("30 Juli", "17 September 2026");
      }
      if (d === "Selasa, 28 Juli 2026") d = "Selasa, 15 September 2026";
      if (d === "Rabu, 29 Juli 2026") d = "Rabu, 16 September 2026";
      if (d === "Kamis, 30 Juli 2026") d = "Kamis, 17 September 2026";
      return { ...item, date: d };
    });

    return {
      ...ref,
      ...incomingData,
      settings: mergedSettings,
      slides: incomingData.slides && incomingData.slides.length > 0 ? incomingData.slides : ref.slides,
      schedule: sanitizedSchedule,
      news: incomingData.news && incomingData.news.length > 0 ? incomingData.news : ref.news,
      recap: incomingData.recap && incomingData.recap.length > 0 ? incomingData.recap : ref.recap,
      competition_names_sd: incomingData?.competition_names_sd && incomingData.competition_names_sd.length > 0 ? incomingData.competition_names_sd : ref.competition_names_sd,
      competition_names_smp: incomingData?.competition_names_smp && incomingData.competition_names_smp.length > 0 ? incomingData.competition_names_smp : ref.competition_names_smp,
      documents: incomingData.documents && incomingData.documents.length > 0 ? incomingData.documents : ref.documents
    };
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    
    let loadedLocal: any = rawFallbackData;
    
    // Initial load from local API
    fetch("/api/data")
      .then(res => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then(data => {
        loadedLocal = data;
        setLocalData(data);
        setSiteData(mergeWithFallback(data, data));
        setLoading(false);
      })
      .catch(err => {
        console.warn("Local API/Vercel backend offline. Using robust data.json fallback...", err.message);
        setSiteData(mergeWithFallback(null, rawFallbackData));
        setLoading(false);
      });

    // Real-time sync with Cloud (Firebase) - multi-document support
    let latestCloudData: any = {};

    const syncCloudData = () => {
      setSiteData(mergeWithFallback(latestCloudData, loadedLocal));
      setLoading(false);
    };

    const unsubSite = onSnapshot(doc(db, "settings", "site"), (docSnap) => {
      if (docSnap.exists()) {
        latestCloudData = { ...latestCloudData, ...docSnap.data() };
        syncCloudData();
      }
    }, (error) => {
      console.warn("Firebase site sync error:", error.message);
    });

    const unsubSlides = onSnapshot(doc(db, "settings", "slides"), (docSnap) => {
      if (docSnap.exists() && docSnap.data()?.slides) {
        latestCloudData = { ...latestCloudData, slides: docSnap.data().slides };
        syncCloudData();
      }
    }, (error) => {
      console.warn("Firebase slides sync error:", error.message);
    });

    const unsubNews = onSnapshot(doc(db, "settings", "news"), (docSnap) => {
      if (docSnap.exists() && docSnap.data()?.news) {
        latestCloudData = { ...latestCloudData, news: docSnap.data().news };
        syncCloudData();
      }
    }, (error) => {
      console.warn("Firebase news sync error:", error.message);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      unsubSite();
      unsubSlides();
      unsubNews();
    };
  }, []);

  useEffect(() => {
    const logoUrl = siteData?.settings?.logo_url || "https://i.imgur.com/3jPMvNa.png";
    const favicon = document.querySelector("link[rel*='icon']");
    if (favicon) {
      (favicon as HTMLLinkElement).href = logoUrl;
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      link.href = logoUrl;
      document.head.appendChild(link);
    }
  }, [siteData?.settings?.logo_url]);

  useEffect(() => {
    if (!siteData?.slides?.length) return;
    
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % siteData.slides.length);
    }, 6000);

    return () => clearInterval(slideTimer);
  }, [siteData]);

  if (loading || !siteData) return <div className="min-h-screen bg-brand-surface flex items-center justify-center font-bold uppercase tracking-widest text-brand-muted">Loading...</div>;

  const { 
    schedule, 
    recap_sd: rawRecapSd, 
    recap_smp: rawRecapSmp, 
    settings, 
    slides = [], 
    news = [],
    competition_names_sd: rawCompSd,
    competition_names_smp: rawCompSmp
  } = siteData;

  const compNamesSd: string[] = Array.from({ length: 23 }).map((_, i) => {
    if (rawCompSd && rawCompSd[i]) return rawCompSd[i];
    return DEFAULT_SD_COMPETITIONS[i] || (i + 1 < 10 ? `L-0${i + 1}` : `L-${i + 1}`);
  });

  const compNamesSmp: string[] = Array.from({ length: 32 }).map((_, i) => {
    if (rawCompSmp && rawCompSmp[i]) return rawCompSmp[i];
    return DEFAULT_SMP_COMPETITIONS[i] || (i + 1 < 10 ? `L-0${i + 1}` : `L-${i + 1}`);
  });

  const getTentNum = (t: string) => {
    if (!t || typeof t !== "string") return 999;
    const m = t.match(/\d+/);
    return m ? parseInt(m[0], 10) : 999;
  };

  const formatTentNo = (tent: string) => {
    if (!tent || typeof tent !== "string") return tent;
    if (tent.toUpperCase().startsWith("PI-")) {
      return "B." + tent.slice(3);
    }
    return tent;
  };

  const formatTentNoSmp = (tent: string) => {
    if (!tent || typeof tent !== "string") return tent;
    const clean = tent.trim().toUpperCase();
    if (clean === "PA-09" || clean === "PA-9" || clean === "PA-01" || clean === "PA-1" || clean === "A.01" || clean === "A.1" || clean === "A.09" || clean === "A.9") {
      return "C.25";
    }
    // SMP Putri: B-01 / B.01 / PI-01 -> D.25, B-02 / B.02 / PI-02 -> D.26, ..., B-08 / B.08 / PI-08 -> D.32
    if (clean.startsWith("PI-") || clean.startsWith("B.") || clean.startsWith("B-") || clean.startsWith("D.") || clean.startsWith("D-")) {
      const m = clean.match(/\d+/);
      if (m) {
        const num = parseInt(m[0], 10);
        if (num >= 1 && num <= 8) {
          return `D.${24 + num}`;
        }
        if (num >= 25 && num <= 32) {
          return `D.${num}`;
        }
      }
      return "D.25";
    }
    if (clean.startsWith("PA-") || clean.startsWith("A.") || clean.startsWith("C.") || clean.startsWith("C-")) {
      const m = clean.match(/\d+/);
      if (m) {
        const num = parseInt(m[0], 10);
        if (num === 9 || num === 1) {
          return "C.25";
        }
        if (num >= 2 && num <= 8) {
          return `C.${24 + num}`;
        }
        if (num >= 25 && num <= 32) {
          return `C.${num}`;
        }
      }
    }
    return tent;
  };

  // Ensure exactly 48 teams are returned for SD/MI (24 Putra and 24 Putri)
  const ensure64TeamsForSd = (recapList: any[], numScores = 23): any[] => {
    const list = recapList || [];
    
    // Default 24 Putra (PA-01 s/d PA-24)
    const defaultPutra = [
      { team: "Regu Garuda (Putra)", tent_no: "PA-01" },
      { team: "Regu Elang (Putra)", tent_no: "PA-02" },
      { team: "Regu Rajawali (Putra)", tent_no: "PA-03" },
      { team: "Regu Harimau (Putra)", tent_no: "PA-04" },
      { team: "Regu Singa (Putra)", tent_no: "PA-05" },
      { team: "Regu Beruang (Putra)", tent_no: "PA-06" },
      { team: "Regu Banteng (Putra)", tent_no: "PA-07" },
      { team: "Regu Kobra (Putra)", tent_no: "PA-08" },
      { team: "Regu Scorpion (Putra)", tent_no: "PA-09" },
      { team: "Regu Kancil (Putra)", tent_no: "PA-10" },
      { team: "Regu Kelelawar (Putra)", tent_no: "PA-11" },
      { team: "Regu Serigala (Putra)", tent_no: "PA-12" },
      { team: "Regu Hiu (Putra)", tent_no: "PA-13" },
      { team: "Regu Lumba (Putra)", tent_no: "PA-14" },
      { team: "Regu Rusa (Putra)", tent_no: "PA-15" },
      { team: "Regu Singa Emas (Putra)", tent_no: "PA-16" },
      { team: "Regu Cheetah (Putra)", tent_no: "PA-17" },
      { team: "Regu Jaguar (Putra)", tent_no: "PA-18" },
      { team: "Regu Panther (Putra)", tent_no: "PA-19" },
      { team: "Regu Falcon (Putra)", tent_no: "PA-20" },
      { team: "Regu Condor (Putra)", tent_no: "PA-21" },
      { team: "Regu Cobra (Putra)", tent_no: "PA-22" },
      { team: "Regu Scorpion Merah (Putra)", tent_no: "PA-23" },
      { team: "Regu Macan (Putra)", tent_no: "PA-24" }
    ];

    // Default 24 Putri (B.01 s/d B.24)
    const defaultPutri = [
      { team: "Regu Melati (Putri)", tent_no: "B.01" },
      { team: "Regu Mawar (Putri)", tent_no: "B.02" },
      { team: "Regu Dahlia (Putri)", tent_no: "B.03" },
      { team: "Regu Anggrek (Putri)", tent_no: "B.04" },
      { team: "Regu Tulip (Putri)", tent_no: "B.05" },
      { team: "Regu Sakura (Putri)", tent_no: "B.06" },
      { team: "Regu Teratai (Putri)", tent_no: "B.07" },
      { team: "Regu Lavender (Putri)", tent_no: "B.08" },
      { team: "Regu Lily (Putri)", tent_no: "B.09" },
      { team: "Regu Aster (Putri)", tent_no: "B.10" },
      { team: "Regu Kenanga (Putri)", tent_no: "B.11" },
      { team: "Regu Kamboja (Putri)", tent_no: "B.12" },
      { team: "Regu Bougenville (Putri)", tent_no: "B.13" },
      { team: "Regu Flamboyan (Putri)", tent_no: "B.14" },
      { team: "Regu Edelweis (Putri)", tent_no: "B.15" },
      { team: "Regu Matahari (Putri)", tent_no: "B.16" },
      { team: "Regu Jasmine (Putri)", tent_no: "B.17" },
      { team: "Regu Orchid (Putri)", tent_no: "B.18" },
      { team: "Regu Camelia (Putri)", tent_no: "B.19" },
      { team: "Regu Magnolia (Putri)", tent_no: "B.20" },
      { team: "Regu Dahlia Putih (Putri)", tent_no: "B.21" },
      { team: "Regu Sakura Merah (Putri)", tent_no: "B.22" },
      { team: "Regu Lily Putih (Putri)", tent_no: "B.23" },
      { team: "Regu Tulip Merah (Putri)", tent_no: "B.24" }
    ];

    const incomingPutra = list.filter((item: any) => 
      item && item.team && (item.team.toLowerCase().includes("putra") || 
      (item.tent_no && (item.tent_no.toUpperCase().startsWith("PA") || item.tent_no.toUpperCase().startsWith("A."))))
    );

    const incomingPutri = list.filter((item: any) => 
      item && item.team && (item.team.toLowerCase().includes("putri") || 
      (item.tent_no && (item.tent_no.toUpperCase().startsWith("PI") || item.tent_no.toUpperCase().startsWith("B."))))
    );

    const incomingOthers = list.filter((item: any) => 
      item && item.team && 
      !item.team.toLowerCase().includes("putra") && 
      !(item.tent_no && (item.tent_no.toUpperCase().startsWith("PA") || item.tent_no.toUpperCase().startsWith("A."))) &&
      !item.team.toLowerCase().includes("putri") && 
      !(item.tent_no && (item.tent_no.toUpperCase().startsWith("PI") || item.tent_no.toUpperCase().startsWith("B.")))
    );

    const putraResult = [...incomingPutra];
    while (putraResult.length < 24) {
      const idx = putraResult.length;
      const nextDefault = defaultPutra.find(d => !putraResult.some(p => formatTentNo(p.tent_no) === d.tent_no)) 
        || defaultPutra[idx] 
        || { team: `Regu Putra ${idx + 1}`, tent_no: `PA-${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}` };
      
      putraResult.push({
        rank: idx + 1,
        team: nextDefault.team,
        tent_no: nextDefault.tent_no,
        scores: Array(numScores).fill(0),
        total: 0
      });
    }

    const putriResult = [...incomingPutri];
    while (putriResult.length < 24) {
      const idx = putriResult.length;
      const nextDefault = defaultPutri.find(d => !putriResult.some(p => formatTentNo(p.tent_no) === d.tent_no)) 
        || defaultPutri[idx] 
        || { team: `Regu Putri ${idx + 1}`, tent_no: `B.${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}` };

      putriResult.push({
        rank: idx + 1,
        team: nextDefault.team,
        tent_no: nextDefault.tent_no,
        scores: Array(numScores).fill(0),
        total: 0
      });
    }

    putraResult.sort((a, b) => getTentNum(a.tent_no) - getTentNum(b.tent_no));
    putriResult.sort((a, b) => getTentNum(a.tent_no) - getTentNum(b.tent_no));

    const combined = [...putraResult.slice(0, 24), ...putriResult.slice(0, 24), ...incomingOthers];

    return combined.map((item, index) => {
      let scores = Array.isArray(item.scores)
        ? item.scores.map((s: any) => Math.round((Number(s) || 0) * 100) / 100)
        : Array(numScores).fill(0);
      if (scores.length < numScores) {
        scores = [...scores, ...Array(numScores - scores.length).fill(0)];
      } else if (scores.length > numScores) {
        scores = scores.slice(0, numScores);
      }
      const total = Math.round(scores.reduce((sum: number, val: number) => sum + (Number(val) || 0), 0) * 100) / 100;
      return {
        ...item,
        tent_no: formatTentNo(item.tent_no),
        rank: index + 1,
        scores,
        total
      };
    });
  };

  // Ensure exactly 16 teams are returned for SMP/MTs (8 Putra and 8 Putri)
  const ensure32Teams = (recapList: any[], numScores = 32): any[] => {
    const list = recapList || [];
    const defaultPutra = [
      { team: "Regu Garuda (Putra)", tent_no: "C.25" },
      { team: "Regu Elang (Putra)", tent_no: "C.26" },
      { team: "Regu Rajawali (Putra)", tent_no: "C.27" },
      { team: "Regu Harimau (Putra)", tent_no: "C.28" },
      { team: "Regu Singa (Putra)", tent_no: "C.29" },
      { team: "Regu Beruang (Putra)", tent_no: "C.30" },
      { team: "Regu Banteng (Putra)", tent_no: "C.31" },
      { team: "Regu Kobra (Putra)", tent_no: "C.32" }
    ];

    const defaultPutri = [
      { team: "Regu Melati (Putri)", tent_no: "D.25" },
      { team: "Regu Mawar (Putri)", tent_no: "D.26" },
      { team: "Regu Dahlia (Putri)", tent_no: "D.27" },
      { team: "Regu Anggrek (Putri)", tent_no: "D.28" },
      { team: "Regu Tulip (Putri)", tent_no: "D.29" },
      { team: "Regu Sakura (Putri)", tent_no: "D.30" },
      { team: "Regu Teratai (Putri)", tent_no: "D.31" },
      { team: "Regu Lavender (Putri)", tent_no: "D.32" }
    ];

    const incomingPutra = list.filter((item: any) => 
      item && item.team && (item.team.toLowerCase().includes("putra") || 
      (item.tent_no && (item.tent_no.toUpperCase().startsWith("C.") || item.tent_no.toUpperCase().startsWith("PA") || item.tent_no.toUpperCase().startsWith("A."))))
    );

    const incomingPutri = list.filter((item: any) => 
      item && item.team && (item.team.toLowerCase().includes("putri") || 
      (item.tent_no && (item.tent_no.toUpperCase().startsWith("D.") || item.tent_no.toUpperCase().startsWith("PI") || item.tent_no.toUpperCase().startsWith("B."))))
    );

    const incomingOthers = list.filter((item: any) => 
      item && item.team && 
      !item.team.toLowerCase().includes("putra") && 
      !(item.tent_no && (item.tent_no.toUpperCase().startsWith("C.") || item.tent_no.toUpperCase().startsWith("PA") || item.tent_no.toUpperCase().startsWith("A."))) &&
      !item.team.toLowerCase().includes("putri") && 
      !(item.tent_no && (item.tent_no.toUpperCase().startsWith("D.") || item.tent_no.toUpperCase().startsWith("PI") || item.tent_no.toUpperCase().startsWith("B.")))
    );

    const putraResult = [...incomingPutra];
    while (putraResult.length < 8) {
      const idx = putraResult.length;
      const nextDefault = defaultPutra.find(d => !putraResult.some(p => formatTentNoSmp(p.tent_no) === d.tent_no)) 
        || defaultPutra[idx] 
        || { team: `Regu Putra ${idx + 1}`, tent_no: `C.${25 + idx}` };
      
      putraResult.push({
        rank: idx + 1,
        team: nextDefault.team,
        tent_no: nextDefault.tent_no,
        scores: Array(numScores).fill(0),
        total: 0
      });
    }

    const putriResult = [...incomingPutri];
    while (putriResult.length < 8) {
      const idx = putriResult.length;
      const nextDefault = defaultPutri.find(d => !putriResult.some(p => formatTentNoSmp(p.tent_no) === d.tent_no)) 
        || defaultPutri[idx] 
        || { team: `Regu Putri ${idx + 1}`, tent_no: `D.${25 + idx}` };

      putriResult.push({
        rank: idx + 1,
        team: nextDefault.team,
        tent_no: nextDefault.tent_no,
        scores: Array(numScores).fill(0),
        total: 0
      });
    }

    putraResult.sort((a, b) => getTentNum(formatTentNoSmp(a.tent_no)) - getTentNum(formatTentNoSmp(b.tent_no)));
    putriResult.sort((a, b) => getTentNum(formatTentNoSmp(a.tent_no)) - getTentNum(formatTentNoSmp(b.tent_no)));

    const combined = [...putraResult.slice(0, 8), ...putriResult.slice(0, 8), ...incomingOthers];

    // Ensure scores are arrays of numbers and total contains the correct sum
    return combined.map((item, index) => {
      let scores = Array.isArray(item.scores)
        ? item.scores.map((s: any) => Math.round((Number(s) || 0) * 100) / 100)
        : Array(numScores).fill(0);
      if (scores.length < numScores) {
        scores = [...scores, ...Array(numScores - scores.length).fill(0)];
      } else if (scores.length > numScores) {
        scores = scores.slice(0, numScores);
      }
      const total = Math.round(scores.reduce((sum: number, val: number) => sum + (Number(val) || 0), 0) * 100) / 100;
      return {
        ...item,
        rank: index + 1,
        tent_no: formatTentNoSmp(item.tent_no),
        scores,
        total
      };
    });
  };

  const recapSd = ensure64TeamsForSd(rawRecapSd || (siteData as any).recap, 23);
  const recapSdPutra = recapSd
    .filter((item: any) => 
      item.team.toLowerCase().includes("putra") || 
      item.tent_no.toUpperCase().startsWith("PA") ||
      item.tent_no.toUpperCase().startsWith("A.")
    )
    .sort((a, b) => getTentNum(a.tent_no) - getTentNum(b.tent_no));

  const recapSdPutri = recapSd
    .filter((item: any) => 
      item.team.toLowerCase().includes("putri") || 
      item.tent_no.toUpperCase().startsWith("PI") ||
      item.tent_no.toUpperCase().startsWith("B.")
    )
    .sort((a, b) => getTentNum(a.tent_no) - getTentNum(b.tent_no));

  const recapSmp = ensure32Teams(rawRecapSmp || (siteData as any).recap, 32);
  const recapSmpPutra = recapSmp
    .filter((item: any) => 
      item.team.toLowerCase().includes("putra") || 
      item.tent_no.toUpperCase().startsWith("C.") ||
      item.tent_no.toUpperCase().startsWith("PA") ||
      item.tent_no.toUpperCase().startsWith("A.")
    )
    .sort((a, b) => getTentNum(a.tent_no) - getTentNum(b.tent_no));

  const recapSmpPutri = recapSmp
    .filter((item: any) => 
      item.team.toLowerCase().includes("putri") || 
      item.tent_no.toUpperCase().startsWith("D.") ||
      item.tent_no.toUpperCase().startsWith("PI") ||
      item.tent_no.toUpperCase().startsWith("B.")
    )
    .sort((a, b) => getTentNum(a.tent_no) - getTentNum(b.tent_no));
  const tableFontSize = Number(settings?.table_font_size || "12");

  const COMPETITIONS = [
    { id: 1, name: "Pionering", icon: <Tent className="w-6 h-6" />, desc: "Ketangkasan membuat bangunan darurat menggunakan tali dan tongkat." },
    { id: 2, name: "Semaphore & Morse", icon: <Compass className="w-6 h-6" />, desc: "Adu cepat dan tepat dalam berkirim pesan rahasia jarak jauh." },
    { id: 3, name: "PBB & Variasi", icon: <Users className="w-6 h-6" />, desc: "Kerapian dan kekompakan dalam baris berbaris." },
    { id: 4, name: "Pentas Seni", icon: <Flame className="w-6 h-6" />, desc: "Menampilkan bakat seni budaya dari masing-masing regu." },
  ];

  const SOCIAL_PLATFORMS = [
    { name: "Instagram", icon: <Instagram className="w-6 h-6" />, handle: "@pramukajatinagara_", url: "https://instagram.com/pramukajatinagara_", color: "bg-pink-600" },
    { name: "YouTube", icon: <Youtube className="w-6 h-6" />, handle: "Pramuka Jatinagara", url: "https://youtube.com/@pramukajatinagara", color: "bg-red-600" },
    { name: "WhatsApp", icon: <MessageCircle className="w-6 h-6" />, handle: "Official Admin", url: "https://wa.me/6285316377589", color: "bg-green-600" },
    { name: "Facebook", icon: <Facebook className="w-6 h-6" />, handle: "Kwarran Jatinagara", url: "https://facebook.com/kwarran.jatinagara", color: "bg-blue-600" },
  ];

  const DOCUMENTS = siteData.documents && siteData.documents.length > 0
    ? siteData.documents
    : [
        { title: "Petunjuk Teknis LT 2", type: "PDF", size: "2.4 MB", url: "https://example.com/petunjuk-teknis" },
        { title: "Formulir Pendaftaran", type: "DOCX", size: "1.1 MB", url: "https://example.com/formulir" },
        { title: "Daftar Perlengkapan", type: "PDF", size: "850 KB", url: "https://example.com/perlengkapan" },
        { title: "Surat Izin Orang Tua", type: "PDF", size: "420 KB", url: "https://example.com/surat-izin" },
      ];

  return (
    <div className="min-h-screen selection:bg-brand-primary selection:text-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-white border-b border-brand-border py-4" : "bg-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src={settings?.logo_url || "https://i.imgur.com/3jPMvNa.png"} 
              alt="Logo LT2 Kwarran Jatinagara" 
              className="w-10 h-10 object-contain"
              referrerPolicy="no-referrer"
              onError={(e: any) => { e.target.src = "https://i.imgur.com/3jPMvNa.png"; }}
            />
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
            {["Beranda", "Tentang", "Berita", "Jadwal", "Rekap SD/MI", "Rekap SMP/MTs", "Dokumen", "Lokasi"].map((item) => {
              const href = item === "Rekap SD/MI" ? "#rekap-sd" : item === "Rekap SMP/MTs" ? "#rekap-smp" : `#${item.toLowerCase()}`;
              return (
                <a 
                  key={item} 
                  href={href}
                  className={`transition-colors pb-1 border-b-2 border-transparent hover:border-brand-primary ${scrolled ? "text-brand-muted hover:text-black" : "text-white/80 hover:text-white"}`}
                >
                  {item}
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="relative">
              <button 
                onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                className={`p-2 rounded-full cursor-pointer hover:bg-black/5 active:scale-95 transition-all ${scrolled ? "text-brand-dark hover:bg-brand-surface" : "text-white hover:bg-white/10"}`}
                title="Admin Menu"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {isAdminMenuOpen && (
                  <>
                    {/* Click outside overlay */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsAdminMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-brand-border p-3 z-50 flex flex-col gap-2"
                    >
                      <Link 
                        to="/admin" 
                        onClick={() => setIsAdminMenuOpen(false)}
                        className="text-center bg-brand-primary text-white font-black py-3 px-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-brand-dark transition-all block"
                      >
                        Admin Panel
                      </Link>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

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
              {["Beranda", "Tentang", "Berita", "Jadwal", "Rekap SD/MI", "Rekap SMP/MTs", "Dokumen", "Lokasi"].map((item) => {
                const href = item === "Rekap SD/MI" ? "#rekap-sd" : item === "Rekap SMP/MTs" ? "#rekap-smp" : `#${item.toLowerCase()}`;
                return (
                  <a 
                    key={item} 
                    href={href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm font-bold uppercase tracking-widest border-b border-brand-border pb-2 text-brand-muted"
                  >
                    {item}
                  </a>
                );
              })}
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
                  onError={(e: any) => { e.target.src = "https://picsum.photos/seed/scout1/1920/1080"; }}
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
            <p className="text-lg md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              {slides[currentSlide]?.desc || `Lomba Pramuka Penggalang Kwartir Ranting Jatinagara ${settings.year}. Ajang kompetisi paling bergengsi tahun ini!`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((item: any, i: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group"
                >
                  <div 
                    onClick={() => setSelectedNews(item)}
                    className="cursor-pointer w-full aspect-[16/10] sm:aspect-[4/3] md:aspect-[16/10] lg:aspect-[16/11] xl:aspect-[16/10] rounded-[32px] overflow-hidden bg-brand-surface border border-brand-border mb-6 relative pr-0"
                  >
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                      onError={(e: any) => { e.target.src = "https://picsum.photos/seed/news/800/600"; }}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-brand-primary shadow-lg group-hover:bg-brand-primary group-hover:text-white transition-all">
                        {item.date}
                      </span>
                    </div>
                  </div>
                  <h3 
                    onClick={() => setSelectedNews(item)}
                    className="cursor-pointer text-xl font-black uppercase tracking-tight mb-4 group-hover:text-brand-primary transition-colors line-clamp-2"
                  >
                    {item.title}
                  </h3>
                  <p className="text-xs text-brand-muted leading-relaxed line-clamp-3 mb-6 italic">
                    {item.excerpt}
                  </p>
                  <button 
                    onClick={() => setSelectedNews(item)}
                    className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:gap-3 transition-all flex items-center gap-2"
                  >
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
               <p className="text-black font-black text-2xl tracking-tighter">15 - 17 September {settings.year}</p>
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
              className="relative p-4 bg-white rounded-[32px] border border-brand-border shadow-xl max-w-sm mx-auto w-full"
            >
              <div className="aspect-[3/4] rounded-[24px] overflow-hidden relative z-10 bg-slate-50">
                <img 
                  src={settings?.pembina_image || defaultPembinaImage} 
                  alt={settings?.pembina_name || "Kak Dadi Supriadi - Pembina"}
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                  onError={(e: any) => { e.target.src = defaultPembinaImage; }}
                />
              </div>
              <div className="mt-5 text-center px-2">
                <h4 className="font-sans font-black uppercase tracking-tight text-brand-primary text-base">
                  {settings?.pembina_name || "Kak Dadi Supriadi"}
                </h4>
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-1.5 leading-tight">
                  {settings?.pembina_title || "KA Kwarran Jatinagara  Kwarcab Ciamis"}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="jadwal" className="py-24 bg-brand-surface">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between items-start mb-12 md:mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-6xl font-black text-black tracking-tighter uppercase mb-2">Jadwal Kegiatan</h2>
              <p className="text-[10px] sm:text-xs font-bold text-brand-primary uppercase tracking-[0.3em] italic">Timeline Pelaksanaan Lomba Tingkat II</p>
            </div>
            <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-3xl border border-brand-border w-full md:w-auto justify-center md:justify-start">
              {schedule.map((day: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveDay(i)}
                  className={`px-5 sm:px-8 py-2 md:py-3 rounded-2xl md:rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeDay === i ? "bg-brand-primary text-white shadow-xl" : "bg-transparent text-brand-muted hover:text-black"}`}
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
            className="bg-brand-dark rounded-3xl md:rounded-[40px] p-6 sm:p-10 md:p-14 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Clock className="w-64 h-64" />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 relative z-10 border-b border-white/5 pb-6">
              <h3 className="text-lg sm:text-2xl font-black uppercase tracking-wide text-brand-primary italic leading-snug">{schedule[activeDay].date}</h3>
              <span className="text-[10px] bg-white/10 px-3.5 py-1.5 rounded-full font-bold tracking-widest uppercase self-start sm:self-auto">Hari {activeDay + 1}</span>
            </div>

            <div className="space-y-8 relative z-10">
              {schedule[activeDay].events.map((event: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row gap-4 sm:gap-8 md:gap-10 items-start group border-b border-white/5 pb-8 last:border-0 last:pb-0">
                  <div className="text-brand-primary font-mono font-bold text-xs sm:text-sm py-1.5 px-3 sm:px-4 rounded-lg bg-white/5 shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-all">
                    {event.time}
                  </div>
                  <div className="flex-grow w-full">
                    <h4 className="text-base sm:text-lg font-bold text-white tracking-tight mb-3 leading-relaxed whitespace-pre-line group-hover:text-brand-primary transition-colors">
                      {event.name}
                    </h4>
                    <p className="text-[11px] text-brand-muted font-bold uppercase tracking-widest flex items-center gap-2">
                       <MapPin className="w-3.5 h-3.5 group-hover:animate-bounce text-brand-primary/80" />
                       {event.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Rekap SD/MI Section */}
      <section id="rekap-sd" className="py-24 bg-slate-50 text-brand-dark border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-black tracking-tighter uppercase mb-2">REKAPITULASI <span className="text-brand-primary">SD/MI</span></h2>
            <p className="text-[11px] font-black tracking-[0.2em] text-brand-muted uppercase italic">Peringkat & Klasemen Akhir Tingkat SD/MI</p>
          </div>

          {/* REKAPITULASI LOMBA PUTRA SD */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase mb-4">Rekapitulasi Lomba <span className="text-brand-primary">Putra (SD/MI)</span></h2>
            <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em] italic">Update Skor & Klasemen Regu Putra</p>
          </div>
          <div className="bg-white border border-brand-border rounded-[40px] overflow-hidden shadow-2xl mb-24">
            <div className="overflow-auto max-h-[72vh] relative">
              <table className="w-full text-left border-separate border-spacing-0 min-w-[2000px] select-none" style={{ fontSize: `${tableFontSize}px` }}>
                <thead>
                  <tr className="italic text-brand-primary">
                    <th className="sticky top-0 left-0 bg-slate-50 z-50 px-4 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-center w-[64px] min-w-[64px] max-w-[64px] border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]">No</th>
                    <th className="sticky top-0 left-[64px] bg-slate-50 z-50 px-2 py-4 text-[10px] font-black uppercase tracking-widest w-[100px] min-w-[100px] max-w-[100px] border-r border-brand-border shadow-[4px_2px_8px_-2px_rgba(0,0,0,0.08)] border-b border-brand-border">Nama Regu</th>
                    <th className="sticky top-0 bg-slate-50 z-40 px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]">No Tenda</th>
                    {compNamesSd.map((name: string, i: number) => (
                      <th key={i} className="sticky top-0 bg-slate-50 z-40 px-3 py-4 text-[10px] font-black uppercase tracking-widest text-center whitespace-nowrap border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]" title={`Lomba ${i + 1}: ${name}`}>{name}</th>
                    ))}
                    <th className="sticky top-0 bg-slate-50 z-40 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right whitespace-nowrap border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="text-brand-dark">
                  {recapSdPutra.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-20 px-4 py-3 text-center w-[64px] min-w-[64px] max-w-[64px] border-b border-brand-border/60">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black bg-slate-100 text-brand-dark mx-auto text-[10px] border border-brand-border">
                          {i + 1}
                        </div>
                      </td>
                      <td className="sticky left-[64px] bg-white group-hover:bg-slate-50 transition-colors z-20 px-2 py-3 font-semibold uppercase tracking-tight text-[12px] border-r border-brand-border shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] w-[100px] min-w-[100px] max-w-[100px] truncate border-b border-brand-border/60">
                        <span className="text-brand-dark font-black">{item.team}</span>
                      </td>
                      <td className="px-6 py-3 text-brand-muted font-bold uppercase text-[10px] tracking-widest italic border-b border-brand-border/60">{item.tent_no}</td>
                      {item.scores.map((score: number, sIdx: number) => (
                        <td key={sIdx} className="px-3 py-3 text-center text-brand-muted font-bold text-xs border-b border-brand-border/60">
                          {Number.isInteger(Number(score)) ? Number(score) : Number(Number(score).toFixed(2))}
                        </td>
                      ))}
                      <td className="px-6 py-3 text-right font-black text-lg tracking-tighter text-brand-primary border-b border-brand-border/60">
                        {Number.isInteger(Number(item.total)) ? Number(item.total) : Number(Number(item.total).toFixed(2))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-8 border-t border-brand-border bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted italic">23 Mata Lomba sesuai Petunjuk Teknis LT-II.</p>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted italic">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>

          {/* REKAPITULASI LOMBA PUTRI SD */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase mb-4">Rekapitulasi Lomba <span className="text-brand-primary">Putri (SD/MI)</span></h2>
            <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em] italic">Update Skor & Klasemen Regu Putri</p>
          </div>
          <div className="bg-white border border-brand-border rounded-[40px] overflow-hidden shadow-2xl">
            <div className="overflow-auto max-h-[72vh] relative">
              <table className="w-full text-left border-separate border-spacing-0 min-w-[2000px] select-none" style={{ fontSize: `${tableFontSize}px` }}>
                <thead>
                  <tr className="italic text-brand-primary">
                    <th className="sticky top-0 left-0 bg-slate-50 z-50 px-4 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-center w-[64px] min-w-[64px] max-w-[64px] border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]">No</th>
                    <th className="sticky top-0 left-[64px] bg-slate-50 z-50 px-2 py-4 text-[10px] font-black uppercase tracking-widest w-[100px] min-w-[100px] max-w-[100px] border-r border-brand-border shadow-[4px_2px_8px_-2px_rgba(0,0,0,0.08)] border-b border-brand-border">Nama Regu</th>
                    <th className="sticky top-0 bg-slate-50 z-40 px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]">No Tenda</th>
                    {compNamesSd.map((name: string, i: number) => (
                      <th key={i} className="sticky top-0 bg-slate-50 z-40 px-3 py-4 text-[10px] font-black uppercase tracking-widest text-center whitespace-nowrap border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]" title={`Lomba ${i + 1}: ${name}`}>{name}</th>
                    ))}
                    <th className="sticky top-0 bg-slate-50 z-40 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right whitespace-nowrap border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="text-brand-dark">
                  {recapSdPutri.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-20 px-4 py-3 text-center w-[64px] min-w-[64px] max-w-[64px] border-b border-brand-border/60">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black bg-slate-100 text-brand-dark mx-auto text-[10px] border border-brand-border">
                          {i + 1}
                        </div>
                      </td>
                      <td className="sticky left-[64px] bg-white group-hover:bg-slate-50 transition-colors z-20 px-2 py-3 font-semibold uppercase tracking-tight text-[12px] border-r border-brand-border shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] w-[100px] min-w-[100px] max-w-[100px] truncate border-b border-brand-border/60">
                        <span className="text-brand-dark font-black">{item.team}</span>
                      </td>
                      <td className="px-6 py-3 text-brand-muted font-bold uppercase text-[10px] tracking-widest italic border-b border-brand-border/60">{item.tent_no}</td>
                      {item.scores.map((score: number, sIdx: number) => (
                        <td key={sIdx} className="px-3 py-3 text-center text-brand-muted font-bold text-xs border-b border-brand-border/60">
                          {Number.isInteger(Number(score)) ? Number(score) : Number(Number(score).toFixed(2))}
                        </td>
                      ))}
                      <td className="px-6 py-3 text-right font-black text-lg tracking-tighter text-brand-primary border-b border-brand-border/60">
                        {Number.isInteger(Number(item.total)) ? Number(item.total) : Number(Number(item.total).toFixed(2))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-8 border-t border-brand-border bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted italic">23 Mata Lomba sesuai Petunjuk Teknis LT-II.</p>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted italic">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rekap SMP/MTs Section */}
      <section id="rekap-smp" className="py-24 bg-slate-50 text-brand-dark border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-black tracking-tighter uppercase mb-2">REKAPITULASI <span className="text-brand-primary">SMP/MTs</span></h2>
            <p className="text-[11px] font-black tracking-[0.2em] text-brand-muted uppercase italic">Peringkat & Klasemen Akhir Tingkat SMP/MTs</p>
          </div>

          {/* REKAPITULASI LOMBA PUTRA SMP */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase mb-4">Rekapitulasi Lomba <span className="text-brand-primary">Putra (SMP/MTs)</span></h2>
            <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em] italic">Update Skor & Klasemen Regu Putra</p>
          </div>
          <div className="bg-white border border-brand-border rounded-[40px] overflow-hidden shadow-2xl mb-24">
            <div className="overflow-auto max-h-[72vh] relative">
              <table className="w-full text-left border-separate border-spacing-0 min-w-[2000px] select-none" style={{ fontSize: `${tableFontSize}px` }}>
                <thead>
                  <tr className="italic text-brand-primary">
                    <th className="sticky top-0 left-0 bg-slate-50 z-50 px-4 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-center w-[64px] min-w-[64px] max-w-[64px] border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]">No</th>
                    <th className="sticky top-0 left-[64px] bg-slate-50 z-50 px-2 py-4 text-[10px] font-black uppercase tracking-widest w-[100px] min-w-[100px] max-w-[100px] border-r border-brand-border shadow-[4px_2px_8px_-2px_rgba(0,0,0,0.08)] border-b border-brand-border">Nama Regu</th>
                    <th className="sticky top-0 bg-slate-50 z-40 px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]">No Tenda</th>
                    {compNamesSmp.map((name: string, i: number) => (
                      <th key={i} className="sticky top-0 bg-slate-50 z-40 px-3 py-4 text-[10px] font-black uppercase tracking-widest text-center whitespace-nowrap border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]" title={`Lomba ${i + 1}: ${name}`}>{name}</th>
                    ))}
                    <th className="sticky top-0 bg-slate-50 z-40 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right whitespace-nowrap border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="text-brand-dark">
                  {recapSmpPutra.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-20 px-4 py-3 text-center w-[64px] min-w-[64px] max-w-[64px] border-b border-brand-border/60">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black bg-slate-100 text-brand-dark mx-auto text-[10px] border border-brand-border">
                          {i + 1}
                        </div>
                      </td>
                      <td className="sticky left-[64px] bg-white group-hover:bg-slate-50 transition-colors z-20 px-2 py-3 font-semibold uppercase tracking-tight text-[12px] border-r border-brand-border shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] w-[100px] min-w-[100px] max-w-[100px] truncate border-b border-brand-border/60">
                        <span className="text-brand-dark font-black">{item.team}</span>
                      </td>
                      <td className="px-6 py-3 text-brand-muted font-bold uppercase text-[10px] tracking-widest italic border-b border-brand-border/60">{item.tent_no}</td>
                      {item.scores.map((score: number, sIdx: number) => (
                        <td key={sIdx} className="px-3 py-3 text-center text-brand-muted font-bold text-xs border-b border-brand-border/60">
                          {Number.isInteger(Number(score)) ? Number(score) : Number(Number(score).toFixed(2))}
                        </td>
                      ))}
                      <td className="px-6 py-3 text-right font-black text-lg tracking-tighter text-brand-primary border-b border-brand-border/60">
                        {Number.isInteger(Number(item.total)) ? Number(item.total) : Number(Number(item.total).toFixed(2))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-8 border-t border-brand-border bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted italic">32 Mata Lomba sesuai Petunjuk Teknis LT-II.</p>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted italic">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>

          {/* REKAPITULASI LOMBA PUTRI SMP */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase mb-4">Rekapitulasi Lomba <span className="text-brand-primary">Putri (SMP/MTs)</span></h2>
            <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em] italic">Update Skor & Klasemen Regu Putri</p>
          </div>
          <div className="bg-white border border-brand-border rounded-[40px] overflow-hidden shadow-2xl">
            <div className="overflow-auto max-h-[72vh] relative">
              <table className="w-full text-left border-separate border-spacing-0 min-w-[2000px] select-none" style={{ fontSize: `${tableFontSize}px` }}>
                <thead>
                  <tr className="italic text-brand-primary">
                    <th className="sticky top-0 left-0 bg-slate-50 z-50 px-4 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-center w-[64px] min-w-[64px] max-w-[64px] border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]">No</th>
                    <th className="sticky top-0 left-[64px] bg-slate-50 z-50 px-2 py-4 text-[10px] font-black uppercase tracking-widest w-[100px] min-w-[100px] max-w-[100px] border-r border-brand-border shadow-[4px_2px_8px_-2px_rgba(0,0,0,0.08)] border-b border-brand-border">Nama Regu</th>
                    <th className="sticky top-0 bg-slate-50 z-40 px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]">No Tenda</th>
                    {compNamesSmp.map((name: string, i: number) => (
                      <th key={i} className="sticky top-0 bg-slate-50 z-40 px-3 py-4 text-[10px] font-black uppercase tracking-widest text-center whitespace-nowrap border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]" title={`Lomba ${i + 1}: ${name}`}>{name}</th>
                    ))}
                    <th className="sticky top-0 bg-slate-50 z-40 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right whitespace-nowrap border-b border-brand-border shadow-[0_2px_4px_rgba(0,0,0,0.03)]">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="text-brand-dark">
                  {recapSmpPutri.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-20 px-4 py-3 text-center w-[64px] min-w-[64px] max-w-[64px] border-b border-brand-border/60">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black bg-slate-100 text-brand-dark mx-auto text-[10px] border border-brand-border">
                          {i + 1}
                        </div>
                      </td>
                      <td className="sticky left-[64px] bg-white group-hover:bg-slate-50 transition-colors z-20 px-2 py-3 font-semibold uppercase tracking-tight text-[12px] border-r border-brand-border shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] w-[100px] min-w-[100px] max-w-[100px] truncate border-b border-brand-border/60">
                        <span className="text-brand-dark font-black">{item.team}</span>
                      </td>
                      <td className="px-6 py-3 text-brand-muted font-bold uppercase text-[10px] tracking-widest italic border-b border-brand-border/60">{item.tent_no}</td>
                      {item.scores.map((score: number, sIdx: number) => (
                        <td key={sIdx} className="px-3 py-3 text-center text-brand-muted font-bold text-xs border-b border-brand-border/60">
                          {Number.isInteger(Number(score)) ? Number(score) : Number(Number(score).toFixed(2))}
                        </td>
                      ))}
                      <td className="px-6 py-3 text-right font-black text-lg tracking-tighter text-brand-primary border-b border-brand-border/60">
                        {Number.isInteger(Number(item.total)) ? Number(item.total) : Number(Number(item.total).toFixed(2))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-8 border-t border-brand-border bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted italic">32 Mata Lomba sesuai Petunjuk Teknis LT-II.</p>
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
                <a 
                  key={i} 
                  href={doc.url || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-8 bg-brand-surface border border-brand-border rounded-3xl flex items-center justify-between group hover:border-brand-primary transition-all cursor-pointer text-left block"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-primary shadow-sm group-hover:scale-110 transition-transform">
                       <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight text-black mb-1">{doc.title}</h4>
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{doc.type} • {doc.size}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white border border-brand-border rounded-xl text-brand-muted group-hover:bg-brand-primary group-hover:text-white group-hover:border-brand-primary transition-all shadow-sm">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </a>
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
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-primary shrink-0 mt-1">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase text-black tracking-tight">Pondok Pesantren Sabilurrosyad</h3>
                    <p className="text-brand-muted text-xs font-semibold uppercase tracking-wider mt-1">Kec. Jatinagara, Kab. Ciamis, Jawa Barat</p>
                  </div>
                </div>
              </div>
              <a 
                href="https://maps.app.goo.gl/kjoqLwsRuRKLGja4A" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-primary text-white text-xs font-black px-6 py-3.5 rounded-2xl uppercase tracking-widest shadow-lg hover:bg-brand-primary/90 transition-all"
              >
                <span>Buka di Google Maps</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="rounded-[40px] overflow-hidden shadow-2xl aspect-[4/5] bg-brand-surface border border-brand-border relative group">
              <iframe 
                src="https://maps.google.com/maps?q=-7.175580,108.388238&t=h&z=17&output=embed" 
                className="w-full h-full border-0 transition-all duration-1000" 
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
                {["Beranda", "Tentang", "Jadwal"].map(item => (
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
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-border py-1.5 px-3 md:py-2 md:px-6 flex justify-center items-center text-[9px] md:text-[10px] font-medium normal-case tracking-wider text-brand-muted shadow-lg">
            <p className="truncate text-center">© {settings.year} kwarran jatinagara. muhammadimamsyafi'i.</p>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <a 
        href="https://wa.me/6285316377589" 
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-4 md:bottom-10 md:right-8 z-50 bg-green-600 text-white p-3 md:p-4 rounded-full shadow-2xl hover:bg-green-700 hover:scale-110 active:scale-95 transition-all group"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute right-full mr-6 bg-brand-dark text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none translate-x-4 group-hover:translate-x-0">
          WhatsApp Panitia
        </span>
      </a>

      {/* News Article Detail Modal */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md" 
              onClick={() => setSelectedNews(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
              className="relative bg-white rounded-[40px] border border-brand-border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] max-w-3xl w-full overflow-hidden max-h-[90vh] flex flex-col z-10"
            >
              {/* Header Image */}
              <div className="relative h-60 md:h-80 w-full overflow-hidden shrink-0 bg-brand-surface">
                <img 
                  src={selectedNews.image} 
                  alt={selectedNews.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e: any) => { e.target.src = "https://picsum.photos/seed/news/800/600"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-6 md:p-10">
                  <div>
                    <span className="bg-brand-primary text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block mb-3 shadow-md">
                      {selectedNews.date}
                    </span>
                    <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                      {selectedNews.title}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all backdrop-blur-md border border-white/20 hover:scale-110 active:scale-95"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 md:p-10 overflow-y-auto text-brand-dark font-sans leading-relaxed text-sm space-y-6 scrollbar-thin">
                {String(selectedNews.excerpt || "")
                  .split("\n\n")
                  .map((para, pIdx) => {
                    if (para.startsWith("**") && para.includes("**")) {
                      const parts = para.split("**");
                      return (
                        <p key={pIdx} className="text-base font-bold text-brand-dark leading-snug">
                          {parts.map((p, idx) => (
                            idx % 2 === 1 ? <strong key={idx} className="font-extrabold text-brand-primary">{p}</strong> : p
                          ))}
                        </p>
                      );
                    }
                    return (
                      <p key={pIdx} className="text-slate-600 font-medium whitespace-pre-line leading-relaxed">
                        {para}
                      </p>
                    );
                  })}
              </div>

              {/* Sticky footer */}
              <div className="px-6 py-4 md:px-10 border-t border-brand-border bg-slate-50 flex justify-end shrink-0 gap-4">
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="px-6 py-3 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-dark transition-all shadow-md active:scale-95 text-center"
                >
                  Tutup Artikel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
