import type React from "react";
import { NavLink } from "react-router-dom";

type Props = {
  to: string;
  label: string;
  icon: React.ReactElement;
  collapsed: boolean;
  /** Match only when path is exactly this route (use for index-like routes) */
  end?: boolean;
};

/**
 * Sidebar navigation link with neon-green active/hover glow.
 *
 * Active state:  strong left border + background tint + outer glow
 * Hover state:   soft glow + slight bg tint (never overrides active)
 * Collapsed mode: icon-only with tooltip via `title`
 */
export function NavItem({ to, label, icon, collapsed, end }: Props) {
  return (
    <NavLink to={to} end={end} title={collapsed ? label : undefined}>
      {({ isActive }) => (
        <div
          className={[
            "relative rounded-lg border-l-2 transition-all duration-150 ease-out",
            isActive
              ? "border-emerald-400 bg-[rgba(34,197,94,0.10)] shadow-[0_0_14px_rgba(34,197,94,0.30)]"
              : "border-transparent hover:border-emerald-900/60 hover:bg-[rgba(34,197,94,0.05)] hover:shadow-[0_0_8px_rgba(34,197,94,0.12)]",
          ].join(" ")}
        >
          <div
            className={[
              "flex items-center gap-3 py-2 pr-3 transition-all duration-150",
              collapsed ? "justify-center px-2.5" : "pl-2.5",
            ].join(" ")}
          >
            {/* Icon */}
            <span
              className={[
                "shrink-0 transition-colors duration-150",
                isActive ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-400",
              ].join(" ")}
            >
              {icon}
            </span>

            {/* Label — hidden in collapsed mode */}
            {!collapsed && (
              <span
                className={[
                  "truncate text-sm transition-colors duration-150",
                  isActive ? "font-semibold text-white" : "text-zinc-500",
                ].join(" ")}
              >
                {label}
              </span>
            )}
          </div>
        </div>
      )}
    </NavLink>
  );
}
