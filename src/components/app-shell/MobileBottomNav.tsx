import { NavLink } from "react-router-dom";
import { Home, FilePlus2, Sparkles, History, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Início", url: "/app", icon: Home, end: true },
  { title: "Nova", url: "/app/prescricao/nova", icon: FilePlus2 },
  { title: "Modelos", url: "/app/modelos", icon: Sparkles },
  { title: "Histórico", url: "/app/historico", icon: History },
  { title: "Mais", url: "/app/pacientes", icon: Menu },
];

export default function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t flex items-stretch justify-between safe-bottom">
      {items.map((it) => (
        <NavLink
          key={it.url}
          to={it.url}
          end={it.end}
          className={({ isActive }) =>
            cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium",
              isActive ? "text-primary" : "text-muted-foreground",
            )
          }
        >
          <it.icon className="h-5 w-5" />
          <span>{it.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}
