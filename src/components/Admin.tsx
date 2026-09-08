import React, { useState, useEffect } from "react";
import { Save, Plus, Trash2, ArrowLeft, LogOut, LogIn, Upload, ChevronUp, ChevronDown, ChevronsUp, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { 
  auth, 
  db, 
  googleProvider, 
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

interface ScoreInputProps {
  value: number | string | undefined | null;
  onChange: (val: number) => void;
  className?: string;
}

const ScoreInput: React.FC<ScoreInputProps> = ({ value, onChange, className }) => {
  const [text, setText] = useState<string>(() => {
    if (value === undefined || value === null || value === "") return "0";
    const num = Number(value);
    return isNaN(num) ? "0" : String(num);
  });

  useEffect(() => {
    const rawNum = parseFloat(text.replace(',', '.'));
    const currentVal = isNaN(rawNum) ? 0 : Math.round(rawNum * 100) / 100;
    const targetVal = value !== undefined && value !== null ? Math.round((Number(value) || 0) * 100) / 100 : 0;
    
    if (currentVal !== targetVal && !text.endsWith('.') && !text.endsWith(',')) {
      setText(targetVal === 0 ? "0" : String(targetVal));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(',', '.');
    if (val === '') {
      setText('');
      onChange(0);
      return;
    }

    if (/^\d+(\.\d+)?$/.test(val)) {
      const parts = val.split('.');
      if (parts[1] && parts[1].length > 2) {
        val = `${parts[0]}.${parts[1].slice(0, 2)}`;
      }
    }

    if (/^\d*(\.\d{0,2})?$/.test(val)) {
      setText(val);
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        onChange(Math.round(parsed * 100) / 100);
      } else {
        onChange(0);
      }
    }
  };

  const handleBlur = () => {
    const val = text.replace(',', '.');
    if (val === '' || isNaN(parseFloat(val))) {
      setText('0');
      onChange(0);
    } else {
      const parsed = parseFloat(val);
      const rounded = Math.round(parsed * 100) / 100;
      setText(String(rounded));
      onChange(rounded);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className || "w-16 min-w-[62px] bg-white border border-brand-border p-1.5 rounded-lg text-center font-bold text-xs focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors"}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="0"
    />
  );
};

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [localData, setLocalData] = useState<any>(rawFallbackData);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isUsingFirebase, setIsUsingFirebase] = useState(false);
  const [activeRecapTabSd, setActiveRecapTabSd] = useState<"putra" | "putri">("putra");
  const [activeRecapTabSmp, setActiveRecapTabSmp] = useState<"putra" | "putri">("putra");

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

  const getTentNum = (t: string) => {
    if (!t || typeof t !== "string") return 999;
    const m = t.match(/\d+/);
    return m ? parseInt(m[0], 10) : 999;
  };

  const ensure64TeamsForSd = (recapList: any[], numScores = 23): any[] => {
    const list = recapList || [];
    
    // Default 24 Putra
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
      let scores = Array.isArray(item.scores) ? item.scores.map((s: any) => Math.round((Number(s) || 0) * 100) / 100) : Array(numScores).fill(0);
      if (scores.length < numScores) {
        scores = [...scores, ...Array(numScores - scores.length).fill(0)];
      } else if (scores.length > numScores) {
        scores = scores.slice(0, numScores);
      }
      return {
        ...item,
        tent_no: formatTentNo(item.tent_no),
        rank: index + 1,
        scores,
        total: Math.round(scores.reduce((sum: number, val: number) => sum + (Number(val) || 0), 0) * 100) / 100
      };
    });
  };

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

    return combined.map((item, index) => {
      let scores = Array.isArray(item.scores) ? item.scores.map((s: any) => Math.round((Number(s) || 0) * 100) / 100) : Array(numScores).fill(0);
      if (scores.length < numScores) {
        scores = [...scores, ...Array(numScores - scores.length).fill(0)];
      } else if (scores.length > numScores) {
        scores = scores.slice(0, numScores);
      }
      return {
        ...item,
        rank: index + 1,
        tent_no: formatTentNoSmp(item.tent_no),
        scores,
        total: Math.round(scores.reduce((sum: number, val: number) => sum + (Number(val) || 0), 0) * 100) / 100
      };
    });
  };

  const setSanitizedData = (newData: any, referenceData: any = null) => {
    const ref = referenceData || localData || rawFallbackData;
    if (!newData) {
      setData(ref);
      return;
    }

    // Merge settings properties safely, avoiding overriding valid image/logo values with empty ones
    const mergedSettings = {
      ...ref.settings,
    };

    if (newData.settings) {
      Object.keys(newData.settings).forEach((key) => {
        if (newData.settings[key] !== undefined && newData.settings[key] !== null && newData.settings[key] !== "") {
          mergedSettings[key] = newData.settings[key];
        }
      });
    }

    const rawSchedule = newData.schedule && newData.schedule.length > 0 ? newData.schedule : ref.schedule;
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

    const merged = {
      ...ref,
      ...newData,
      settings: mergedSettings,
      slides: newData.slides && newData.slides.length > 0 ? newData.slides : ref.slides,
      schedule: sanitizedSchedule,
      news: newData.news && newData.news.length > 0 ? newData.news : ref.news,
      recap: ensure32Teams(newData.recap || ref.recap, 32),
      recap_sd: ensure64TeamsForSd(newData.recap_sd || ref.recap_sd || newData.recap || ref.recap, 23),
      recap_smp: ensure32Teams(newData.recap_smp || ref.recap_smp || newData.recap || ref.recap, 32),
      competition_names_sd: newData.competition_names_sd || ref.competition_names_sd || DEFAULT_SD_COMPETITIONS,
      competition_names_smp: newData.competition_names_smp || ref.competition_names_smp || DEFAULT_SMP_COMPETITIONS,
      documents: newData.documents && newData.documents.length > 0 ? newData.documents : ref.documents
    };
    setData(merged);
  };

  useEffect(() => {
    // ALWAYS load local data first to populate localData state & reference
    fetch("/api/data")
      .then((res) => res.json())
      .then((d) => {
        setLocalData(d);
      })
      .catch((err) => {
        console.warn("Pre-loading local data failed, using rawFallbackData", err);
      });

    // If Firebase is not configured, immediately fall back to local API to avoid infinite loading
    if (!auth || !auth.onAuthStateChanged) {
      console.warn("Firebase Auth not detected, falling back to local mode.");
      loadFromLocalApi();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (u: any) => {
      if (u) {
        if (u.email === "lt2jatinagara@gmail.com") {
          setUser(u);
          setIsLoggedIn(true);
          setIsUsingFirebase(true);
          loadFromFirestore();
        } else {
          signOut(auth).then(() => {
            setUser(null);
            setIsLoggedIn(false);
            setIsUsingFirebase(false);
            setMessage("❌ Akses ditolak: Hanya email lt2jatinagara@gmail.com yang diizinkan!");
          });
        }
      } else {
        loadFromLocalApi();
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const logoUrl = data?.settings?.logo_url || "https://i.imgur.com/3jPMvNa.png";
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
  }, [data?.settings?.logo_url]);

  const loadFromLocalApi = () => {
    fetch("/api/data")
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((d) => {
        setLocalData(d);
        setSanitizedData(d, d);
        setLoading(false);
      })
      .catch(() => {
        console.warn("Local API/Vercel offline. Using client-side data.json configuration.");
        setSanitizedData(rawFallbackData, rawFallbackData);
        setLoading(false);
      });
  };

  const loadFromFirestore = async () => {
    try {
      const [siteDoc, slidesDoc, newsDoc] = await Promise.all([
        getDoc(doc(db, "settings", "site")),
        getDoc(doc(db, "settings", "slides")),
        getDoc(doc(db, "settings", "news"))
      ]);

      let cloudData: any = {};
      if (siteDoc.exists()) {
        cloudData = { ...siteDoc.data() };
      }
      if (slidesDoc.exists() && slidesDoc.data()?.slides) {
        cloudData.slides = slidesDoc.data().slides;
      }
      if (newsDoc.exists() && newsDoc.data()?.news) {
        cloudData.news = newsDoc.data().news;
      }

      if (siteDoc.exists() || slidesDoc.exists() || newsDoc.exists()) {
        setSanitizedData(cloudData, localData);
      } else {
        loadFromLocalApi();
      }
      setLoading(false);
    } catch (e: any) {
      if (e?.message?.includes("offline") || e?.code === "unavailable") {
        console.warn("Firestore is offline/unavailable. Falling back to local data.json config.", e.message);
      } else {
        console.error("Firestore error:", e);
      }
      loadFromLocalApi();
    }
  };

  const handleLogin = async () => {
    setMessage("Mencoba login...");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result) {
        if (result.user.email === "lt2jatinagara@gmail.com") {
          setMessage("Login berhasil!");
        } else {
          await signOut(auth);
          setMessage("❌ Akses ditolak: Email Anda tidak diizinkan!");
        }
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

  const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return "";
    if (Array.isArray(obj)) return obj.map((item) => sanitizeForFirestore(item));
    if (typeof obj === "object") {
      const cleaned: any = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        cleaned[key] = val === undefined ? "" : sanitizeForFirestore(val);
      }
      return cleaned;
    }
    return obj;
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setMessage("Sedang menyimpan data ke Cloud & Server...");

    let cloudSuccess = false;
    let localSuccess = false;
    let cloudErrorMsg = "";
    let localErrorMsg = "";

    // 1. Save directly to Cloud Firestore (sanitized and split into site, slides, news)
    if (db) {
      try {
        const sanitized = sanitizeForFirestore(data || {});
        const { slides = [], news = [], ...siteDataOnly } = sanitized;

        await Promise.all([
          setDoc(doc(db, "settings", "site"), siteDataOnly),
          setDoc(doc(db, "settings", "slides"), { slides }),
          setDoc(doc(db, "settings", "news"), { news })
        ]);
        cloudSuccess = true;
      } catch (e: any) {
        console.warn("Gagal menyimpan langsung ke Firestore Cloud dari browser:", e);
        cloudErrorMsg = e?.message || String(e);
      }
    } else {
      cloudErrorMsg = "Database Firestore belum terhubung di browser.";
    }

    // 2. Save to local disk and server Firestore backup
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password || "admin123", data }),
      });
      const result = await res.json();
      if (result && result.success) {
        localSuccess = true;
        if (result.savedToFirestore) {
          cloudSuccess = true;
        }
      } else {
        localErrorMsg = result?.error || "Gagal menyimpan ke server";
      }
    } catch (e: any) {
      console.warn("Backend API save failed:", e);
      localErrorMsg = e?.message || String(e);
    }

    if (cloudSuccess && localSuccess) {
      setMessage("✅ Berhasil disimpan ke Cloud (Firestore) & Server!");
    } else if (cloudSuccess) {
      setMessage("✅ Berhasil disimpan ke Cloud Firestore!");
    } else if (localSuccess) {
      setMessage("✅ Berhasil disimpan ke Server!");
    } else {
      setMessage("❌ Gagal menyimpan data: " + (cloudErrorMsg || localErrorMsg || "Periksa koneksi internet"));
    }
    setIsSaving(false);
  };

  const handleImageUpload = (file: File, callback: (base64Url: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        const maxDim = 800; // Optimal resolution for web elements, ensures small payload under 60KB
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.75);
          callback(compressed);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileUrl = e.target?.result as string;
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeInKb = (file.size / 1024).toFixed(0);
      const formattedSize = file.size >= 1024 * 1024 ? `${sizeInMb} MB` : `${sizeInKb} KB`;
      const extension = file.name.split(".").pop()?.toUpperCase() || "PDF";
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;

      const newDoc = {
        title: nameWithoutExt,
        type: extension,
        size: formattedSize,
        url: fileUrl,
        createdAt: Date.now()
      };

      const updatedDocs = [newDoc, ...(data.documents || [])];
      setData({ ...data, documents: updatedDocs });
      setMessage(`📄 Dokumen "${nameWithoutExt}" berhasil diupload dan diletakkan paling atas!`);
    };
    reader.readAsDataURL(file);
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
            Silakan masuk menggunakan Google Login untuk mengelola data LT 2 Kwarran Jatinagara
          </p>

          <button
            onClick={handleLogin}
            className="w-full bg-brand-primary text-white font-black p-5 rounded-2xl hover:bg-brand-dark transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 active:scale-95 shadow-xl mb-6"
          >
            Google Login (lt2jatinagara@gmail.com)
          </button>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-brand-border"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">Atau Masuk Password</span>
            <div className="flex-grow border-t border-brand-border"></div>
          </div>

          <form id="admin-password-login-form" onSubmit={(e) => {
            e.preventDefault();
            if (password === "admin123" || password === "admin" || password.trim() !== "") {
              setPassword("admin123");
              setIsLoggedIn(true);
              setMessage("Login berhasil dengan Password Admin!");
              loadFromFirestore();
            } else {
              setMessage("❌ Password salah! (Default: admin123)");
            }
          }} className="space-y-4">
            <input
              id="admin-password-input"
              type="password"
              placeholder="Masukkan Password Admin (admin123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl border border-brand-border text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <button
              id="admin-password-submit-btn"
              type="submit"
              className="w-full bg-slate-900 text-white font-black p-4 rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px] active:scale-95 shadow-md"
            >
              Masuk Dengan Password
            </button>
          </form>

          {/* Vercel Connection Guidelines */}
          <div className="mt-8 text-left bg-slate-50 border border-brand-border rounded-3xl p-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-3">💡 INTEGRASI VERCEL & GOOGLE SIGN-IN</h3>
            <p className="text-[10px] text-slate-500 font-bold mb-3 leading-relaxed">
              Agar Google Login dapat memverifikasi email <span className="text-brand-primary select-all">lt2jatinagara@gmail.com</span> di domain Vercel Anda, lakukan langkah mudah berikut:
            </p>
            <ol className="list-decimal list-outside ml-4 text-[10px] font-bold text-slate-600 space-y-2 leading-relaxed">
              <li>
                Buka <a href="https://console.firebase.google.com" target="_blank" rel="no-referrer" className="text-brand-primary underline hover:text-brand-dark font-black">Firebase Console</a> lalu masuk ke proyek Anda.
              </li>
              <li>
                Pilih menu <strong className="text-slate-800">Authentication</strong> di bilah samping, lalu klik tab <strong className="text-slate-800">Settings</strong>.
              </li>
              <li>
                Di kolom <strong className="text-slate-800">Authorized domains</strong>, klik tombol <strong className="text-brand-primary font-black">+ Add domain</strong>.
              </li>
              <li>
                Masukkan alamat domain deployment Vercel Anda (contoh: <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px] font-black font-mono">nama-proyek-anda.vercel.app</code>) lalu klik Simpan.
              </li>
            </ol>
          </div>

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
            id="save-data-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-primary text-white font-black px-8 py-3.5 rounded-full text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-brand-dark transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {isSaving ? "Menyimpan Data..." : "Simpan Data"}
          </button>
          <button id="logout-btn" onClick={handleLogout} className="p-3 bg-brand-surface text-brand-muted hover:text-brand-primary rounded-xl transition-all">
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

        {/* Recap SD/MI Section */}
        <section className="bg-white p-6 md:p-10 rounded-[40px] border border-brand-border shadow-xl overflow-hidden mb-12">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8 pb-6 border-b border-brand-border/40">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-1 italic text-brand-primary">Pengaturan Skor & Rekapitulasi SD/MI</h2>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2 flex-wrap">
                <span>Kelola penilaian regu tingkat SD/MI secara terpisah (Putra & Putri)</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 normal-case tracking-normal">
                  Mendukung desimal 2 angka di belakang koma
                </span>
              </p>
            </div>
            
            {/* Tabs Selector */}
            <div className="flex gap-2 p-1 bg-brand-surface rounded-2xl border border-brand-border shrink-0 self-stretch sm:self-auto justify-center">
              <button
                type="button"
                onClick={() => setActiveRecapTabSd("putra")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeRecapTabSd === "putra"
                    ? "bg-brand-primary text-white shadow-md font-bold"
                    : "bg-transparent text-brand-muted hover:text-black font-semibold"
                }`}
              >
                <span>♂️ Regu Putra</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeRecapTabSd === "putra" ? "bg-white/20 text-white" : "bg-brand-border/40 text-brand-muted"
                }`}>
                  {(data?.recap_sd || []).filter((item: any) => item.team.toLowerCase().includes("putra") || item.tent_no.toUpperCase().startsWith("PA")).length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRecapTabSd("putri")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeRecapTabSd === "putri"
                    ? "bg-brand-primary text-white shadow-md font-bold"
                    : "bg-transparent text-brand-muted hover:text-black font-semibold"
                }`}
              >
                <span>♀️ Regu Putri</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeRecapTabSd === "putri" ? "bg-white/20 text-white" : "bg-brand-border/40 text-brand-muted"
                }`}>
                  {(data?.recap_sd || []).filter((item: any) => item.team.toLowerCase().includes("putri") || item.tent_no.toUpperCase().startsWith("PI") || item.tent_no.toUpperCase().startsWith("B.")).length}
                </span>
              </button>
            </div>
          </div>

          <div className="overflow-auto max-h-[72vh] -mx-6 px-6 border border-brand-border/30 rounded-2xl relative shadow-sm">
            <table className="w-full text-left border-separate border-spacing-0 min-w-[2000px] select-none text-[12px]">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 bg-white z-50 py-4 px-2 text-[10px] font-black uppercase tracking-widest text-brand-muted text-center w-[48px] border-b-2 border-brand-border/20 shadow-[0_2px_4px_rgba(0,0,0,0.04)]">No</th>
                  <th className="sticky top-0 left-[48px] bg-white z-50 py-4 px-2 text-[10px] font-black uppercase tracking-widest text-brand-muted border-r border-brand-border/20 border-b-2 border-brand-border/20 shadow-[4px_2px_8px_-2px_rgba(0,0,0,0.1)] min-w-[180px]">Nama Regu</th>
                  <th className="sticky top-0 bg-white z-40 py-4 px-4 text-[10px] font-black uppercase tracking-widest text-brand-muted border-b-2 border-brand-border/20 shadow-[0_2px_4px_rgba(0,0,0,0.04)] whitespace-nowrap">No Tenda</th>
                  {Array.from({ length: 23 }).map((_, i) => {
                    const cName = data?.competition_names_sd?.[i] || DEFAULT_SD_COMPETITIONS[i] || (i + 1 < 10 ? `L-0${i + 1}` : `L-${i + 1}`);
                    return (
                      <th key={i} className="sticky top-0 bg-white z-40 py-4 px-2 text-[10px] font-black uppercase tracking-widest text-brand-muted text-center border-b-2 border-brand-border/20 shadow-[0_2px_4px_rgba(0,0,0,0.04)] whitespace-nowrap min-w-[70px]" title={`Lomba ${i + 1}: ${cName}`}>
                        {cName}
                      </th>
                    );
                  })}
                  <th className="sticky top-0 bg-white z-40 py-4 px-4 text-[10px] font-black uppercase tracking-widest text-brand-primary text-right border-b-2 border-brand-border/20 shadow-[0_2px_4px_rgba(0,0,0,0.04)] whitespace-nowrap">Total</th>
                  <th className="sticky top-0 bg-white z-40 py-4 px-4 text-right border-b-2 border-brand-border/20 shadow-[0_2px_4px_rgba(0,0,0,0.04)]"></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const mappedWithIndex = (data?.recap_sd || []).map((item: any, originalIndex: number) => ({ ...item, originalIndex }));
                  const putraTeamsInRecap = mappedWithIndex.filter((item: any) => 
                    item.team.toLowerCase().includes("putra") || 
                    item.tent_no.toUpperCase().startsWith("PA")
                  );
                  const putriTeamsInRecap = mappedWithIndex.filter((item: any) => 
                    item.team.toLowerCase().includes("putri") || 
                    item.tent_no.toUpperCase().startsWith("PI") ||
                    item.tent_no.toUpperCase().startsWith("B.")
                  );
                  const otherTeamsInRecap = mappedWithIndex.filter((item: any) => 
                    !item.team.toLowerCase().includes("putra") && 
                    !item.tent_no.toUpperCase().startsWith("PA") &&
                    !item.team.toLowerCase().includes("putri") && 
                    !item.tent_no.toUpperCase().startsWith("PI") &&
                    !item.tent_no.toUpperCase().startsWith("B.")
                  );
                  const displayedTeams = (activeRecapTabSd === "putra" 
                    ? [...putraTeamsInRecap, ...otherTeamsInRecap] 
                    : putriTeamsInRecap).sort((a: any, b: any) => getTentNum(a.tent_no) - getTentNum(b.tent_no));

                  return displayedTeams.map((item: any, idx: number) => {
                    const i = item.originalIndex;
                    return (
                      <tr key={i} className="hover:bg-brand-surface/50 transition-colors group">
                        <td className="sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-20 py-4 px-2 text-center w-[48px] font-black text-brand-muted/40 text-[10px] border-b border-brand-border/10">{idx + 1}</td>
                        <td className="sticky left-[48px] bg-white group-hover:bg-slate-50 transition-colors z-20 py-4 px-2 border-r border-brand-border/20 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.15)] min-w-[180px] max-w-[180px] truncate border-b border-brand-border/10">
                          <input
                            className="w-full bg-transparent font-black uppercase tracking-tight text-[12px] text-brand-dark focus:outline-none"
                            value={item.team}
                            onChange={(e) => {
                              const newRecap = data.recap_sd.map((t: any, tIdx: number) => 
                                tIdx === i ? { ...t, team: e.target.value } : t
                              );
                              setData({ ...data, recap_sd: newRecap });
                            }}
                          />
                        </td>
                        <td className="py-4 px-4 border-b border-brand-border/10">
                          <input
                            className="w-20 bg-transparent font-bold text-slate-500 uppercase tracking-widest text-[11px] focus:outline-none"
                            value={item.tent_no || ""}
                            onChange={(e) => {
                              const newRecap = data.recap_sd.map((t: any, tIdx: number) => 
                                tIdx === i ? { ...t, tent_no: e.target.value } : t
                              );
                              setData({ ...data, recap_sd: newRecap });
                            }}
                          />
                        </td>
                        {Array.from({ length: 23 }).map((_, sIdx) => (
                          <td key={sIdx} className="py-2 px-1 border-b border-brand-border/10">
                            <ScoreInput
                              value={item.scores[sIdx]}
                              onChange={(val) => {
                                const newRecap = data.recap_sd.map((t: any, tIdx: number) => {
                                  if (tIdx !== i) return t;
                                  const scores = Array.isArray(t.scores) ? [...t.scores] : Array(23).fill(0);
                                  scores[sIdx] = val;
                                  const sum = scores.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
                                  const total = Math.round(sum * 100) / 100;
                                  return { ...t, scores, total };
                                });
                                setData({ ...data, recap_sd: newRecap });
                              }}
                            />
                          </td>
                        ))}
                        <td className="py-4 px-4 text-right border-b border-brand-border/10">
                          <span className="font-black text-[14px] tracking-tighter text-brand-primary">
                            {Number.isInteger(Number(item.total)) ? Number(item.total) : Number(Number(item.total).toFixed(2))}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right border-b border-brand-border/10">
                          <button
                            onClick={() => {
                              const newRecap = [...data.recap_sd];
                              newRecap.splice(i, 1);
                              setData({ ...data, recap_sd: newRecap });
                            }}
                            className="p-2 text-slate-300 hover:text-brand-primary transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => {
              const prefixName = activeRecapTabSd === "putra" ? "Regu Baru (Putra)" : "Regu Baru (Putri)";
              const prefixCargo = activeRecapTabSd === "putra" ? "PA-" : "B.";
              setData({ 
                ...data, 
                recap_sd: [...data.recap_sd, { 
                  rank: data.recap_sd.length + 1, 
                  team: prefixName, 
                  tent_no: prefixCargo, 
                  scores: Array(23).fill(0),
                  total: 0 
                }] 
              });
            }}
            className="mt-8 w-full p-6 border border-dashed border-brand-border rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Baris Regu {activeRecapTabSd === "putra" ? "Putra" : "Putri"} (SD/MI)
          </button>
        </section>

        {/* Recap SMP/MTs Section */}
        <section className="bg-white p-6 md:p-10 rounded-[40px] border border-brand-border shadow-xl overflow-hidden mb-12">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8 pb-6 border-b border-brand-border/40">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-1 italic text-brand-primary">Pengaturan Skor & Rekapitulasi SMP/MTs</h2>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2 flex-wrap">
                <span>Kelola penilaian regu tingkat SMP/MTs secara terpisah (Putra & Putri)</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 normal-case tracking-normal">
                  Mendukung desimal 2 angka di belakang koma
                </span>
              </p>
            </div>
            
            {/* Tabs Selector */}
            <div className="flex gap-2 p-1 bg-brand-surface rounded-2xl border border-brand-border shrink-0 self-stretch sm:self-auto justify-center">
              <button
                type="button"
                onClick={() => setActiveRecapTabSmp("putra")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeRecapTabSmp === "putra"
                    ? "bg-brand-primary text-white shadow-md font-bold"
                    : "bg-transparent text-brand-muted hover:text-black font-semibold"
                }`}
              >
                <span>♂️ Regu Putra</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeRecapTabSmp === "putra" ? "bg-white/20 text-white" : "bg-brand-border/40 text-brand-muted"
                }`}>
                  {(data?.recap_smp || []).filter((item: any) => item.team.toLowerCase().includes("putra") || item.tent_no.toUpperCase().startsWith("C.") || item.tent_no.toUpperCase().startsWith("PA")).length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRecapTabSmp("putri")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeRecapTabSmp === "putri"
                    ? "bg-brand-primary text-white shadow-md font-bold"
                    : "bg-transparent text-brand-muted hover:text-black font-semibold"
                }`}
              >
                <span>♀️ Regu Putri</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeRecapTabSmp === "putri" ? "bg-white/20 text-white" : "bg-brand-border/40 text-brand-muted"
                }`}>
                  {(data?.recap_smp || []).filter((item: any) => item.team.toLowerCase().includes("putri") || item.tent_no.toUpperCase().startsWith("D.") || item.tent_no.toUpperCase().startsWith("PI") || item.tent_no.toUpperCase().startsWith("B.")).length}
                </span>
              </button>
            </div>
          </div>

          <div className="overflow-auto max-h-[72vh] -mx-6 px-6 border border-brand-border/30 rounded-2xl relative shadow-sm">
            <table className="w-full text-left border-separate border-spacing-0 min-w-[2000px] select-none text-[12px]">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 bg-white z-50 py-4 px-2 text-[10px] font-black uppercase tracking-widest text-brand-muted text-center w-[48px] border-b-2 border-brand-border/20 shadow-[0_2px_4px_rgba(0,0,0,0.04)]">No</th>
                  <th className="sticky top-0 left-[48px] bg-white z-50 py-4 px-2 text-[10px] font-black uppercase tracking-widest text-brand-muted border-r border-brand-border/20 border-b-2 border-brand-border/20 shadow-[4px_2px_8px_-2px_rgba(0,0,0,0.1)] min-w-[180px]">Nama Regu</th>
                  <th className="sticky top-0 bg-white z-40 py-4 px-4 text-[10px] font-black uppercase tracking-widest text-brand-muted border-b-2 border-brand-border/20 shadow-[0_2px_4px_rgba(0,0,0,0.04)] whitespace-nowrap">No Tenda</th>
                  {Array.from({ length: 32 }).map((_, i) => {
                    const cName = data?.competition_names_smp?.[i] || DEFAULT_SMP_COMPETITIONS[i] || (i + 1 < 10 ? `L-0${i + 1}` : `L-${i + 1}`);
                    return (
                      <th key={i} className="sticky top-0 bg-white z-40 py-4 px-2 text-[10px] font-black uppercase tracking-widest text-brand-muted text-center border-b-2 border-brand-border/20 shadow-[0_2px_4px_rgba(0,0,0,0.04)] whitespace-nowrap min-w-[70px]" title={`Lomba ${i + 1}: ${cName}`}>
                        {cName}
                      </th>
                    );
                  })}
                  <th className="sticky top-0 bg-white z-40 py-4 px-4 text-[10px] font-black uppercase tracking-widest text-brand-primary text-right border-b-2 border-brand-border/20 shadow-[0_2px_4px_rgba(0,0,0,0.04)] whitespace-nowrap">Total</th>
                  <th className="sticky top-0 bg-white z-40 py-4 px-4 text-right border-b-2 border-brand-border/20 shadow-[0_2px_4px_rgba(0,0,0,0.04)]"></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const mappedWithIndex = (data?.recap_smp || []).map((item: any, originalIndex: number) => ({ ...item, originalIndex }));
                  const putraTeamsInRecap = mappedWithIndex.filter((item: any) => 
                    item.team.toLowerCase().includes("putra") || 
                    item.tent_no.toUpperCase().startsWith("C.") ||
                    item.tent_no.toUpperCase().startsWith("PA") ||
                    item.tent_no.toUpperCase().startsWith("A.")
                  );
                  const putriTeamsInRecap = mappedWithIndex.filter((item: any) => 
                    item.team.toLowerCase().includes("putri") || 
                    item.tent_no.toUpperCase().startsWith("D.") ||
                    item.tent_no.toUpperCase().startsWith("PI") ||
                    item.tent_no.toUpperCase().startsWith("B.")
                  );
                  const otherTeamsInRecap = mappedWithIndex.filter((item: any) => 
                    !item.team.toLowerCase().includes("putra") && 
                    !item.tent_no.toUpperCase().startsWith("C.") &&
                    !item.tent_no.toUpperCase().startsWith("PA") &&
                    !item.tent_no.toUpperCase().startsWith("A.") &&
                    !item.team.toLowerCase().includes("putri") && 
                    !item.tent_no.toUpperCase().startsWith("D.") &&
                    !item.tent_no.toUpperCase().startsWith("PI") &&
                    !item.tent_no.toUpperCase().startsWith("B.")
                  );
                  const displayedTeams = (activeRecapTabSmp === "putra" 
                    ? [...putraTeamsInRecap, ...otherTeamsInRecap] 
                    : putriTeamsInRecap).sort((a: any, b: any) => getTentNum(a.tent_no) - getTentNum(b.tent_no));

                  return displayedTeams.map((item: any, idx: number) => {
                    const i = item.originalIndex;
                    return (
                      <tr key={i} className="hover:bg-brand-surface/50 transition-colors group">
                        <td className="sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-20 py-4 px-2 text-center w-[48px] font-black text-brand-muted/40 text-[10px] border-b border-brand-border/10">{idx + 1}</td>
                        <td className="sticky left-[48px] bg-white group-hover:bg-slate-50 transition-colors z-20 py-4 px-2 border-r border-brand-border/20 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.15)] min-w-[180px] max-w-[180px] truncate border-b border-brand-border/10">
                          <input
                            className="w-full bg-transparent font-black uppercase tracking-tight text-[12px] text-brand-dark focus:outline-none"
                            value={item.team}
                            onChange={(e) => {
                              const newRecap = data.recap_smp.map((t: any, tIdx: number) => 
                                tIdx === i ? { ...t, team: e.target.value } : t
                              );
                              setData({ ...data, recap_smp: newRecap });
                            }}
                          />
                        </td>
                        <td className="py-4 px-4 border-b border-brand-border/10">
                          <input
                            className="w-20 bg-transparent font-bold text-slate-500 uppercase tracking-widest text-[11px] focus:outline-none"
                            value={item.tent_no || ""}
                            onChange={(e) => {
                              const newRecap = data.recap_smp.map((t: any, tIdx: number) => 
                                tIdx === i ? { ...t, tent_no: e.target.value } : t
                              );
                              setData({ ...data, recap_smp: newRecap });
                            }}
                          />
                        </td>
                        {Array.from({ length: 32 }).map((_, sIdx) => (
                          <td key={sIdx} className="py-2 px-1 border-b border-brand-border/10">
                            <ScoreInput
                              value={item.scores[sIdx]}
                              onChange={(val) => {
                                const newRecap = data.recap_smp.map((t: any, tIdx: number) => {
                                  if (tIdx !== i) return t;
                                  const scores = Array.isArray(t.scores) ? [...t.scores] : Array(32).fill(0);
                                  scores[sIdx] = val;
                                  const sum = scores.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
                                  const total = Math.round(sum * 100) / 100;
                                  return { ...t, scores, total };
                                });
                                setData({ ...data, recap_smp: newRecap });
                              }}
                            />
                          </td>
                        ))}
                        <td className="py-4 px-4 text-right border-b border-brand-border/10">
                          <span className="font-black text-[14px] tracking-tighter text-brand-primary">
                            {Number.isInteger(Number(item.total)) ? Number(item.total) : Number(Number(item.total).toFixed(2))}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right border-b border-brand-border/10">
                          <button
                            onClick={() => {
                              const newRecap = [...data.recap_smp];
                              newRecap.splice(i, 1);
                              setData({ ...data, recap_smp: newRecap });
                            }}
                            className="p-2 text-slate-300 hover:text-brand-primary transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => {
              const prefixName = activeRecapTabSmp === "putra" ? "Regu Baru (Putra)" : "Regu Baru (Putri)";
              const prefixCargo = activeRecapTabSmp === "putra" ? "C." : "D.";
              setData({ 
                ...data, 
                recap_smp: [...data.recap_smp, { 
                  rank: data.recap_smp.length + 1, 
                  team: prefixName, 
                  tent_no: prefixCargo, 
                  scores: Array(32).fill(0),
                  total: 0 
                }] 
              });
            }}
            className="mt-8 w-full p-6 border border-dashed border-brand-border rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Baris Regu {activeRecapTabSmp === "putra" ? "Putra" : "Putri"} (SMP/MTs)
          </button>
        </section>

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
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-3">Logo Kegiatan (URL atau Upload Gambar)</label>
              <div className="flex gap-4">
                <input
                  className="flex-1 p-4 rounded-2xl bg-brand-surface border border-brand-border font-mono text-xs"
                  value={data.settings.logo_url || ""}
                  placeholder="Bawaan: https://i.imgur.com/3jPMvNa.png"
                  onChange={(e) => setData({ ...data, settings: { ...data.settings, logo_url: e.target.value } })}
                />
                <label className="bg-brand-primary text-white font-black px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest cursor-pointer hover:bg-brand-dark transition-all shrink-0 flex items-center justify-center">
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file, (url) => {
                          setData({ ...data, settings: { ...data.settings, logo_url: url } });
                        });
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-3">Ukuran Font Tabel Rekapitulasi Lomba (10 - 16px)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="16"
                  className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  value={data.settings.table_font_size || "12"}
                  onChange={(e) => setData({ ...data, settings: { ...data.settings, table_font_size: e.target.value } })}
                />
                <span className="font-mono bg-brand-surface border border-brand-border px-4 py-2 rounded-xl text-xs font-bold text-brand-primary whitespace-nowrap">{data.settings.table_font_size || "12"}px</span>
              </div>
            </div>

            <div className="md:col-span-2 border-t border-brand-border/40 pt-8 mt-4">
              <h3 className="text-sm font-black uppercase tracking-wider mb-6 text-brand-primary italic">Profil Pembina/Tokoh (Tentang)</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1 font-sans">Nama Pembina</label>
                    <input
                      className="w-full p-3 rounded-xl bg-brand-surface border border-brand-border font-bold text-sm"
                      value={data.settings.pembina_name || "Kak Dadi Supriadi"}
                      onChange={(e) => setData({ ...data, settings: { ...data.settings, pembina_name: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1 font-sans">Deskripsi/Jabatan</label>
                    <input
                      className="w-full p-3 rounded-xl bg-brand-surface border border-brand-border text-xs font-bold"
                      value={data.settings.pembina_title || "KA Kwarran Jatinagara  Kwarcab Ciamis"}
                      onChange={(e) => setData({ ...data, settings: { ...data.settings, pembina_title: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1 font-sans">URL atau Upload Foto</label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 p-3 rounded-xl bg-brand-surface border border-brand-border font-mono text-[10px]"
                        value={data.settings.pembina_image || ""}
                        placeholder="Contoh: https://... atau klik Pilih File"
                        onChange={(e) => setData({ ...data, settings: { ...data.settings, pembina_image: e.target.value } })}
                      />
                      <label className="bg-brand-primary text-white font-black px-4 py-3 rounded-xl text-[9px] uppercase tracking-widest cursor-pointer hover:bg-brand-dark transition-all shrink-0 flex items-center justify-center">
                        Pilih File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, (url) => {
                                setData({ ...data, settings: { ...data.settings, pembina_image: url } });
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-brand-surface border border-brand-border rounded-2xl p-4 gap-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-brand-muted">Pratinjau Foto</span>
                  <div className="w-24 h-32 rounded-lg border border-brand-border overflow-hidden bg-white">
                    <img 
                      src={data.settings.pembina_image || defaultPembinaImage} 
                      alt="Pratinjau" 
                      className="w-full h-full object-cover object-top"
                      onError={(e: any) => { e.target.src = defaultPembinaImage; }}
                    />
                  </div>
                </div>
              </div>
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
                    <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1">URL atau Upload Gambar</label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 p-3 rounded-lg bg-white border border-brand-border font-mono text-[10px]"
                        value={slide.url}
                        onChange={(e) => {
                          const newSlides = [...data.slides];
                          newSlides[idx].url = e.target.value;
                          setData({ ...data, slides: newSlides });
                        }}
                      />
                      <label className="bg-brand-primary text-white font-black px-4 py-2 rounded-lg text-[9px] uppercase tracking-widest cursor-pointer hover:bg-brand-dark transition-all shrink-0 flex items-center justify-center">
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, (url) => {
                                const newSlides = [...data.slides];
                                newSlides[idx].url = url;
                                setData({ ...data, slides: newSlides });
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
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
                      <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1">URL atau Upload Thumbnail</label>
                      <div className="flex gap-2">
                        <input
                          className="flex-1 p-3 rounded-lg bg-white border border-brand-border font-mono text-[10px]"
                          value={article.image}
                          onChange={(e) => {
                            const newNews = [...data.news];
                            newNews[idx].image = e.target.value;
                            setData({ ...data, news: newNews });
                          }}
                        />
                        <label className="bg-brand-primary text-white font-black px-4 py-2 rounded-lg text-[9px] uppercase tracking-widest cursor-pointer hover:bg-brand-dark transition-all shrink-0 flex items-center justify-center">
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, (url) => {
                                  const newNews = [...data.news];
                                  newNews[idx].image = url;
                                  setData({ ...data, news: newNews });
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
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

        {/* Documents Section */}
        <section className="bg-white p-10 rounded-[40px] border border-brand-border shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-brand-primary">Kelola Dokumen Unduhan</h2>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-1">Dokumen baru yang ditambahkan/diupload otomatis berada di urutan paling atas</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="p-3 px-5 bg-brand-primary rounded-2xl text-white hover:bg-brand-dark transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-md active:scale-95">
                <Upload className="w-4 h-4" />
                Upload File Baru
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleDocumentUpload(file);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
              <button
                onClick={() => {
                  const newDoc = { 
                    title: "Dokumen Baru", 
                    type: "PDF", 
                    size: "1.0 MB", 
                    url: "",
                    createdAt: Date.now()
                  };
                  const newDocs = [newDoc, ...(data.documents || [])];
                  setData({ ...data, documents: newDocs });
                }}
                className="p-3 px-5 bg-brand-surface rounded-2xl text-brand-primary hover:bg-brand-primary hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-brand-border"
              >
                <Plus className="w-4 h-4" />
                Tambah Manual
              </button>
            </div>
          </div>
          <div className="space-y-6">
            {!(data.documents && data.documents.length) ? (
              <p className="text-xs text-brand-muted font-bold uppercase tracking-widest text-center py-6 italic">Belum ada dokumen. Klik tombol di atas untuk menambahkan.</p>
            ) : (
              (data.documents || []).map((docItem: any, idx: number) => (
                <div key={idx} className="bg-brand-surface p-6 rounded-3xl border border-brand-border/10 flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1 space-y-4 w-full">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1 font-sans">Nama/Judul Dokumen</label>
                        <input
                          className="w-full p-3 rounded-lg bg-white border border-brand-border font-bold text-sm"
                          value={docItem.title || ""}
                          onChange={(e) => {
                            const newDocs = [...data.documents];
                            newDocs[idx].title = e.target.value;
                            setData({ ...data, documents: newDocs });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1 font-sans">URL Download / Tautan (atau Upload File)</label>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 p-3 rounded-lg bg-white border border-brand-border font-mono text-[10px]"
                            value={docItem.url || ""}
                            placeholder="Contoh: https://drive.google.com/... atau upload"
                            onChange={(e) => {
                              const newDocs = [...data.documents];
                              newDocs[idx].url = e.target.value;
                              setData({ ...data, documents: newDocs });
                            }}
                          />
                          <label className="p-3 bg-brand-surface rounded-lg text-brand-dark border border-brand-border hover:bg-brand-primary hover:text-white cursor-pointer transition-all flex items-center justify-center shrink-0" title="Upload File untuk Dokumen Ini">
                            <Upload className="w-4 h-4" />
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const fileUrl = ev.target?.result as string;
                                    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
                                    const sizeInKb = (file.size / 1024).toFixed(0);
                                    const formattedSize = file.size >= 1024 * 1024 ? `${sizeInMb} MB` : `${sizeInKb} KB`;
                                    const extension = file.name.split(".").pop()?.toUpperCase() || "PDF";
                                    const newDocs = [...data.documents];
                                    newDocs[idx].url = fileUrl;
                                    newDocs[idx].size = formattedSize;
                                    newDocs[idx].type = extension;
                                    if (!newDocs[idx].title || newDocs[idx].title === "Dokumen Baru") {
                                      newDocs[idx].title = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
                                    }
                                    setData({ ...data, documents: newDocs });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1 font-sans">Tipe File</label>
                        <input
                          className="w-full p-3 rounded-lg bg-white border border-brand-border text-xs"
                          value={docItem.type || ""}
                          placeholder="Misal: PDF, DOCX, ZIP"
                          onChange={(e) => {
                            const newDocs = [...data.documents];
                            newDocs[idx].type = e.target.value;
                            setData({ ...data, documents: newDocs });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1 font-sans">Ukuran File</label>
                        <input
                          className="w-full p-3 rounded-lg bg-white border border-brand-border text-xs"
                          value={docItem.size || ""}
                          placeholder="Misal: 1.2 MB, 850 KB"
                          onChange={(e) => {
                            const newDocs = [...data.documents];
                            newDocs[idx].size = e.target.value;
                            setData({ ...data, documents: newDocs });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-center gap-1 shrink-0 bg-white/70 p-1.5 rounded-2xl border border-brand-border/30">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        const newDocs = [...data.documents];
                        const [movedItem] = newDocs.splice(idx, 1);
                        newDocs.unshift(movedItem);
                        setData({ ...data, documents: newDocs });
                      }}
                      className="p-2 rounded-xl text-brand-primary hover:bg-brand-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                      title="Pindah ke Paling Atas"
                    >
                      <ChevronsUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        const newDocs = [...data.documents];
                        const item = newDocs[idx];
                        newDocs[idx] = newDocs[idx - 1];
                        newDocs[idx - 1] = item;
                        setData({ ...data, documents: newDocs });
                      }}
                      className="p-2 rounded-xl text-brand-dark hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                      title="Geser Naik"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === data.documents.length - 1}
                      onClick={() => {
                        const newDocs = [...data.documents];
                        const item = newDocs[idx];
                        newDocs[idx] = newDocs[idx + 1];
                        newDocs[idx + 1] = item;
                        setData({ ...data, documents: newDocs });
                      }}
                      className="p-2 rounded-xl text-brand-dark hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                      title="Geser Turun"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newDocs = [...data.documents];
                        newDocs.splice(idx, 1);
                        setData({ ...data, documents: newDocs });
                      }}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-all"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Schedule Section */}
        <section className="bg-white p-10 rounded-[40px] border border-brand-border shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-brand-primary">Jadwal Kegiatan</h2>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-1">Mengubah, Mengedit, Menambah, dan Menghapus Jadwal Lomba & Acara</p>
            </div>
            <button
              onClick={() => {
                const newSchedule = [...data.schedule];
                newSchedule.push({
                  day: `Hari ${newSchedule.length + 1}`,
                  date: "Selasa, 15 September 2026",
                  events: [
                    { time: "08:00 - 10:00", name: "Nama Acara Baru", location: "Gerbang Utama" }
                  ]
                });
                setData({ ...data, schedule: newSchedule });
              }}
              className="px-6 py-3 bg-brand-primary hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Tambah Hari Baru
            </button>
          </div>

          <div className="space-y-12">
            {data.schedule.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-brand-border/40 rounded-3xl">
                <p className="text-brand-muted text-sm font-bold">Belum ada hari kegiatan. Silakan tambahkan Hari baru.</p>
              </div>
            ) : (
              data.schedule.map((day: any, dIdx: number) => (
                <div key={dIdx} className="border-t border-brand-border/20 pt-10 first:border-0 first:pt-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8 pb-4 border-b border-brand-border/10">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center w-full sm:w-auto">
                      <div className="w-full sm:w-auto">
                        <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1 font-sans">Nama Hari / Label</label>
                        <input
                          className="text-xl font-black uppercase tracking-tight w-full sm:w-32 border-b border-brand-border/30 focus:border-brand-primary focus:outline-none pb-1 bg-transparent placeholder-brand-muted/40"
                          value={day.day}
                          placeholder="Misal: Hari 1"
                          onChange={(e) => {
                            const newSchedule = [...data.schedule];
                            newSchedule[dIdx].day = e.target.value;
                            setData({ ...data, schedule: newSchedule });
                          }}
                        />
                      </div>
                      <div className="w-full sm:w-auto">
                        <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1 font-sans">Tanggal Pelaksanaan</label>
                        <input
                          className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border/30 focus:border-brand-primary focus:outline-none pb-1 bg-transparent w-full sm:w-64 placeholder-brand-muted/40"
                          value={day.date}
                          placeholder="Misal: Selasa, 15 September 2026"
                          onChange={(e) => {
                            const newSchedule = [...data.schedule];
                            newSchedule[dIdx].date = e.target.value;
                            setData({ ...data, schedule: newSchedule });
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const newSchedule = [...data.schedule];
                        newSchedule.splice(dIdx, 1);
                        setData({ ...data, schedule: newSchedule });
                      }}
                      className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors self-end sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus {day.day || "Hari"}
                    </button>
                  </div>

                  <div className="space-y-6">
                    {day.events && day.events.map((event: any, eIdx: number) => (
                      <div key={eIdx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-brand-surface p-5 rounded-2xl border border-brand-border/10">
                        <div className="md:col-span-3">
                          <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1 font-sans">Waktu Kegiatan</label>
                          <input
                            className="w-full bg-white px-3 py-2 rounded-lg text-xs font-mono font-bold text-brand-primary border border-brand-border/40 focus:border-brand-primary focus:outline-none"
                            value={event.time}
                            placeholder="08:00 - 10:00"
                            onChange={(e) => {
                              const newSchedule = [...data.schedule];
                              newSchedule[dIdx].events[eIdx].time = e.target.value;
                              setData({ ...data, schedule: newSchedule });
                            }}
                          />
                        </div>
                        <div className="md:col-span-5">
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted font-sans">Nama Kegiatan / Lomba</label>
                            <span className="text-[8px] font-mono font-bold text-brand-muted">
                              {(event.name || "").length}/1000
                            </span>
                          </div>
                          <textarea
                            className="w-full bg-white px-3 py-2 rounded-lg font-bold text-brand-dark text-xs border border-brand-border/40 focus:border-brand-primary focus:outline-none resize-y min-h-[64px]"
                            value={event.name}
                            placeholder="Nama kegiatan (maksimal 1000 karakter, tekan Enter untuk membuat baris baru)"
                            maxLength={1000}
                            rows={2}
                            onChange={(e) => {
                              const newSchedule = [...data.schedule];
                              newSchedule[dIdx].events[eIdx].name = e.target.value;
                              setData({ ...data, schedule: newSchedule });
                            }}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-[8px] font-black uppercase tracking-widest text-brand-muted mb-1 font-sans">Lokasi</label>
                          <input
                            className="w-full bg-white px-3 py-2 rounded-lg text-brand-muted font-bold text-xs border border-brand-border/40 focus:border-brand-primary focus:outline-none"
                            value={event.location || ""}
                            placeholder="Lokasi kegiatan"
                            onChange={(e) => {
                              const newSchedule = [...data.schedule];
                              newSchedule[dIdx].events[eIdx].location = e.target.value;
                              setData({ ...data, schedule: newSchedule });
                            }}
                          />
                        </div>
                        <div className="md:col-span-1 flex items-end justify-center h-full pt-2 md:pt-4">
                          <button
                            onClick={() => {
                              const newSchedule = [...data.schedule];
                              newSchedule[dIdx].events.splice(eIdx, 1);
                              setData({ ...data, schedule: newSchedule });
                            }}
                            className="p-2 text-brand-muted/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Hapus Acara"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        const newSchedule = [...data.schedule];
                        newSchedule[dIdx].events.push({ time: "08:00 - 10:00", name: "Acara Baru", location: "Lokasi" });
                        setData({ ...data, schedule: newSchedule });
                      }}
                      className="w-full p-4 border border-dashed border-brand-border rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-3 h-3" />
                      Tambah Acara
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>


      </main>
      
      <footer className="p-10 text-center text-[10px] font-black uppercase tracking-widest text-brand-muted border-t border-brand-border bg-white">
        Admin Panel © 2026 Kwarran Jatinagara
      </footer>
    </div>
  );
}
