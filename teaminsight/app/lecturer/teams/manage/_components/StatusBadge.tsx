import React from "react";
import type { TeamStatus } from "@/types";

interface StatusBadgeProps {
  status: TeamStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    green: {
      dot: "bg-green-500",
      text: "OK",
      textColor: "text-green-700",
      bg: "bg-green-50",
    },
    yellow: {
      dot: "bg-yellow-400",
      text: "Warning",
      textColor: "text-yellow-700",
      bg: "bg-yellow-50",
    },
    red: {
      dot: "bg-red-500",
      text: "Risk",
      textColor: "text-red-700",
      bg: "bg-red-50",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.textColor}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
      {config.text}
    </span>
  );
}
