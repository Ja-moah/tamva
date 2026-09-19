import { Loader2, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => setWasOffline(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !wasOffline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2.5 px-4 py-2 text-xs font-semibold shadow-md transition-all duration-300 select-none ${
        !isOnline
          ? "bg-amber-600 text-white animate-in slide-in-from-top"
          : "bg-emerald-600 text-white"
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="size-4 animate-bounce" />
          <span>Network connection lost. Operating in resilient offline cache mode.</span>
          <Loader2 className="size-3.5 animate-spin ml-1 text-amber-200" />
        </>
      ) : (
        <>
          <Wifi className="size-4" />
          <span>Connection restored. Synchronized live risk feeds with backend node.</span>
        </>
      )}
    </div>
  );
}
