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

  return (
    <div
      className="absolute top-0 left-0 right-0 z-10 
                 bg-gradient-to-r from-blue-500 to-blue-600 
                 text-white px-4 py-2 shadow-lg"
    >
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">
            {isRunning && "⏱️ Đang làm việc"}
            {isPaused && "⏸️ Đã tạm dừng"}
            {isPending && "⏳ Chờ xác nhận..."}
          </div>
          <div className="text-lg font-mono font-bold">
            {formatDuration(elapsedSeconds)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canPause && (
            <button
              type="button"
              onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                         bg-white/20 hover:bg-white/30 transition-colors
                         text-sm font-medium"
            >
              <Pause className="w-4 h-4" />
              Tạm dừng
            </button>
          )}

          {canEnd && (
            <button
              type="button"
              onClick={onEnd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                         bg-red-500 hover:bg-red-600 transition-colors
                         text-sm font-medium"
            >
              <Square className="w-4 h-4" />
              Kết thúc
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkSessionPinnedBar;