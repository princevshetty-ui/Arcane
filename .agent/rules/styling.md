---
trigger: always_on
---

# UI & Aesthetic Rules
Always follow these constraints for any frontend task:
- **Theme:** Strictly Dark Mode (slate-950/zinc-900 background).
- **Styling:** Use Tailwind CSS with `backdrop-blur` and `border-white/10` for a glassmorphism effect.
- **Typography:** Use the 'Inter' or 'Geist' font family.
- **Motion:** Every new component entry must use `framer-motion` for a subtle fade-in and slide-up.
- **Components:** Use `shadcn/ui` patterns for inputs and cards.
- **Icons:** Use `lucide-react` exclusively.
- **The "Glow":** Interactive elements (like graph nodes) should have a `drop-shadow` or `box-shadow` with a subtle primary color (electric blue or neon red).