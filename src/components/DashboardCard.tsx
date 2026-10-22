import { Gift, Check, Menu, IndianRupee } from "lucide-react";

export interface DashboardCardProps {
  cardType?: "member" | "downline" | "rank" | "selfBusiness" | "wallet" | "totalBusiness";
  topText?: string | number;
  mainLabel?: string;
  label?: string;
  value?: string | number;
  subtitle?: string;
  color?: "magenta" | "purple" | "green" | "red" | "blue" | "orange";
}

const colorToTypeMap: Record<string, "member" | "downline" | "rank" | "selfBusiness" | "wallet" | "totalBusiness"> = {
  magenta: "member",
  purple: "downline",
  blue: "rank",
  red: "selfBusiness",
  green: "wallet",
  orange: "totalBusiness",
};

const config = {
  member: {
    bg: "bg-[#e20082]",
    icon: Gift,
  },
  downline: {
    bg: "bg-[#5b64a8]",
    icon: Check,
  },
  rank: {
    bg: "bg-[#007cc3]",
    icon: Menu,
  },
  selfBusiness: {
    bg: "bg-[#e03a27]",
    icon: Gift,
  },
  wallet: {
    bg: "bg-[#00c0f3]",
    icon: IndianRupee,
  },
  totalBusiness: {
    bg: "bg-[#f39c12]",
    icon: Check,
  },
};

export default function DashboardCard({
  cardType,
  topText,
  mainLabel,
  label,
  value,
  subtitle,
  color,
}: DashboardCardProps) {
  const resolvedType = cardType || (color ? colorToTypeMap[color] : "member") || "member";
  const current = config[resolvedType];
  const IconComponent = current.icon;

  const displayTop = topText !== undefined && topText !== null ? topText : (subtitle || value || "");
  const displayMain = mainLabel || label || "";

  return (
    <div
      className={`${current.bg} rounded-md p-5 text-white relative overflow-hidden h-[120px] flex flex-col justify-between shadow-sm hover:shadow transition-shadow select-none`}
    >
      {/* Background watermark icon */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-25 pointer-events-none">
        <IconComponent size={78} strokeWidth={2.5} />
      </div>

      {/* Top Value / Text */}
      <div className="relative z-10">
        <p className="text-sm font-medium tracking-wide">{displayTop}</p>
      </div>

      {/* Bottom Main Label */}
      <div className="relative z-10">
        <h3 className="text-xl font-bold tracking-tight">{displayMain}</h3>
      </div>
    </div>
  );
}
