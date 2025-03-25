"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles/Home.module.css";
import { open, open5Minutes, ping } from "./utils/apiService";
import { useSearchParams } from "next/navigation";
import Spinner from "./components/spinner";
import Notification from "./components/notification";
import RelativeTime from "./components/relativeTime";

export type Memory = {
  battery: number | null;
  ip: string | null;
  lastPoll: number | null;
  opening: boolean;
  keepOpenStart: number | null;
  keepOpenDuration: number | null;
};

export default function Home() {
  const search = useSearchParams();
  const token = useMemo(() => search.get("token"), [search]);
  const [memory, setMemory] = useState<Memory>({
    battery: null,
    ip: null,
    lastPoll: null,
    opening: false,
    keepOpenStart: null,
    keepOpenDuration: null,
  });
  const [loading, setLoading] = useState(false);
  const [startedOpening, setStartedOpening] = useState(false);
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const [loadIndex, setLoadIndex] = useState(0);
  const [notLoaded, setNotLoaded] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    if (loadIndex > 0 && notLoaded) setNotLoaded(false);
  }, [loadIndex, notLoaded]);

  useEffect(() => {
    if (refresh) {
      setRefresh(false);
      return;
    }
    if (!token) return;
    let isMounted = true;
    const load = async () => {
      await ping(setMemory, token, notLoaded);
      setLoading(false);
      setLoadIndex((i) => i + 1);
      setLastRefresh(Date.now());
      setTimeout(() => {
        if (isMounted) load();
      }, 200);
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [token, notLoaded, refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefresh(true);
      console.error("Watch dog...");
    }, 12000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  const isOnline = useMemo(
    () =>
      memory.battery !== null &&
      memory.battery > 0 &&
      memory.lastPoll &&
      new Date().getTime() - memory.lastPoll < 1000 * 120,
    [memory]
  );

  const playSound = () => {
    /*try {
      // Play alice.mp3
      const audio = new Audio("/alice.mp3");
      audio.play();
    } catch (e) {
      console.error(e);
    }*/
  };

  const handleOpen = async () => {
    if (!token || !isOnline) return;
    setLoading(true);
    setStartedOpening(true);
    await open(token);
    playSound();
    setLoading(true);
  };

  useEffect(() => {
    if (!startedOpening && memory.opening) {
      setStartedOpening(true);
    }
  }, [memory.opening, startedOpening]);

  useEffect(() => {
    if (startedOpening && !loading && !memory.opening) {
      setStartedOpening(false);
      setOpenedAt(Date.now());
    }
    const timeout = setTimeout(() => setOpenedAt(null), 5000);
    return () => clearTimeout(timeout);
  }, [memory.opening, loading, startedOpening]);

  const openUntil = useMemo(() => {
    if (!memory.keepOpenStart || !memory.keepOpenDuration) return null;
    return memory.keepOpenStart + memory.keepOpenDuration;
  }, [memory.keepOpenStart, memory.keepOpenDuration]);

  useEffect(() => {
    if (openUntil) {
      const interval = setInterval(() => {
        const left = openUntil - Date.now();
        if (left < 0 && left > -101) {
          setTimeout(() => setShowClosed(false), 3000);
          setShowClosed(true);
        }
        if (left <= 0) {
          setTimeLeft(0);
          return;
        }
        setTimeLeft(left);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [openUntil]);

  const handleOpen5Min = async () => {
    if (!token || !isOnline) return;
    if (timeLeft > 0) return open5Minutes(token, 1);
    setLoading(true);
    setStartedOpening(true);
    await open5Minutes(token, 5 * 60);
    playSound();
    setLoading(true);
  };

  return token ? (
    <div className={styles.page}>
      <h1 className={styles.title}>Garage</h1>
      <div className={styles.content}>
        <div className={styles.buttons}>
          <button className={styles.openButton} onClick={handleOpen}>
            {isOnline || loadIndex === 0 ? (
              startedOpening || loadIndex === 0 ? (
                <Spinner />
              ) : (
                "Ouvrir"
              )
            ) : (
              "Hors ligne"
            )}
          </button>
          {isOnline ? (
            <button className={styles.openButton} onClick={handleOpen5Min}>
              {timeLeft > 0
                ? (timeLeft / 1000 / 60).toFixed(2) + " min restantes"
                : "Ouvrir 5 min"}
            </button>
          ) : null}
        </div>
      </div>
      <div className={styles.details}>
        <p>
          <strong>Status:</strong>{" "}
          {loadIndex > 0
            ? isOnline
              ? "En ligne"
              : "⚠️ Hors ligne"
            : "Chargement..."}
        </p>
        <p>
          <strong>Dernier signe de vie:</strong>{" "}
          <RelativeTime date={memory.lastPoll || 0} />
        </p>
        <p>
          <strong>Batterie:</strong>{" "}
          {memory.battery ? `${memory.battery}%` : "N/A"}
        </p>
        <p>
          <strong>Version:</strong> 1.0.5
        </p>
        {!isOnline && loadIndex > 0 && (
          <Notification
            key="offline"
            message={`Le système s'est arrêté le ${new Date(
              memory.lastPoll || 0
            ).toLocaleString()}`}
            icon="🚫"
          />
        )}
      </div>
      {openedAt && (
        <Notification
          key={openedAt}
          message="La porte est en train de s'ouvrir"
          icon="🚪"
        />
      )}
      {showClosed && (
        <Notification key="closed" message="La porte est fermée" icon="🔒" />
      )}
    </div>
  ) : null;
}
