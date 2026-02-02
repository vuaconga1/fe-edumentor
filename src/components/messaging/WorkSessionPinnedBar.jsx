import React, { useEffect, useMemo, useState } from "react";
import { Pause, Square } from "lucide-react";

const padTime = (value) => String(value).padStart(2, "0");

const formatDuration = (totalSeconds) => {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)}`;
};

const WorkSessionPinnedBar = ({
  status,
  startTime,
  totalMinutes = 0,
  onPause,
  onEnd,
}) => {
  const [tick, setTick] = useState(Date.now());

  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isPending = status === "pending";

  useEffect(() => {
    if (!isRunning) return undefined;
    const timer = setInterval(() => {
      setTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const elapsedSeconds = useMemo(() => {
    const baseSeconds = Math.max(0, Number(totalMinutes) || 0) * 60;
    if (!startTime || !isRunning) return baseSeconds;
    const startMs = new Date(startTime).getTime();
    if (Number.isNaN(startMs)) return baseSeconds;
    const diffSeconds = Math.floor((tick - startMs) / 1000);
    return baseSeconds + Math.max(0, diffSeconds);
  }, [isRunning, startTime, tick, totalMinutes]);

  const canPause = isRunning && !isPending;
  const canEnd = (isRunning || isPaused) && !isPending;

 
};

export default WorkSessionPinnedBar;