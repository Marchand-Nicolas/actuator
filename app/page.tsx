"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles/Home.module.css";
import { open, ping } from "./utils/apiService";
import getRelativeTime from "./utils/getRelativeTime";
import { useSearchParams } from "next/navigation";
import Spinner from "./modules/spinner";
import Notification from "./modules/notification";

export type Memory = {
  battery: number | null;
  ip: string | null;
  lastPoll: number | null;
  opening: boolean;
};

export default function Home() {
  const search = useSearchParams();
  const token = useMemo(() => search.get("token"), [search]);
  const [memory, setMemory] = useState<Memory>({
    battery: null,
    ip: null,
    lastPoll: null,
    opening: false,
  });
  const [loading, setLoading] = useState(false);
  const [startedOpening, setStartedOpening] = useState(false);
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const [loadIndex, setLoadIndex] = useState(0);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      await ping(setMemory, token);
      setLoading(false);
      setLoadIndex((i) => i + 1);
    }, 1000);
    ping(setMemory, token);
    return () => clearInterval(interval);
  }, [token]);

  const isOnline = useMemo(
    () =>
      memory.battery !== null &&
      memory.battery > 0 &&
      memory.lastPoll &&
      new Date().getTime() - memory.lastPoll < 1000 * 120,
    [memory]
  );

  const handleOpen = async () => {
    if (loading || !token || !isOnline) return;
    setLoading(true);
    setStartedOpening(true);
    await open(token);
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

  return token ? (
    <div className={styles.page}>
      <h1 className={styles.title}>Garage</h1>
      <div className={styles.content}>
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
      </div>
      <div className={styles.details}>
        <p>
          <strong>Status:</strong>{" "}
          {loadIndex > 1
            ? isOnline
              ? "En ligne"
              : "⚠️ Hors ligne"
            : "Chargement..."}
        </p>
        <p>
          <strong>Dernier signe de vie:</strong>{" "}
          {getRelativeTime(memory.lastPoll || 0)}
        </p>
        <p>
          <strong>Batterie:</strong>{" "}
          {memory.battery ? `${memory.battery}%` : "N/A"}
        </p>
        {!isOnline && loadIndex > 1 && (
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
    </div>
  ) : null;
}
