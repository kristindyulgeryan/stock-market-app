"use client";

import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState } from "react";

interface WatchlistButtonProps {
  symbol: string;
  company: string;
  isInWatchlist: boolean;
  showTrashIcon?: boolean;
  type?: "button" | "icon";
  onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
}

export const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist);

  const handleToggle = () => {
    const newState = !inWatchlist;
    setInWatchlist(newState);
    onWatchlistChange?.(symbol, newState);
  };

  if (type === "icon") {
    return (
      <button
        onClick={handleToggle}
        className={`p-2 rounded transition-colors ${
          inWatchlist ? "text-red-500" : "text-gray-400 hover:text-red-500"
        }`}
        title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      >
        <Heart size={20} fill={inWatchlist ? "currentColor" : "none"} />
      </button>
    );
  }

  return (
    <Button
      onClick={handleToggle}
      variant={inWatchlist ? "default" : "outline"}
      className={`w-full ${
        inWatchlist ? "bg-red-600 hover:bg-red-700" : "border-gray-600"
      }`}
    >
      <Heart
        size={18}
        className="mr-2"
        fill={inWatchlist ? "currentColor" : "none"}
      />
      {inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
    </Button>
  );
};
