import { cn } from "../../lib/utils/cn";
import { CardBackdrop } from "./CardBackdrop";

export function Card({ className, children, visual, treatment = "glass", imagePriority = false, ...props }) {
  return <section className={cn("ui-card premium-card relative rounded-2xl border", `premium-card--${treatment}`, visual && "premium-card--imagery", className)} {...props}>
    {visual && <CardBackdrop visual={visual} priority={imagePriority} />}
    {children}
  </section>;
}
