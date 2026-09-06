import { SOCIAL_LINKS } from "@/config/social-links"

type IconProps = { className?: string }

function InstagramIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7"/><circle cx="17.4" cy="6.7" r="1" fill="currentColor"/></svg>
}

function FacebookIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.87.24-1.46 1.5-1.46h1.72V4a22 22 0 0 0-2.5-.13c-2.48 0-4.17 1.51-4.17 4.29V10H7.3v3h2.75v8h3.45Z"/></svg>
}

function XIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4.5 19 19.5M19 4.5 5 19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}

function TikTokIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.2 3h3.1c.22 1.45 1.06 2.56 2.7 3.08v3.12c-1.18-.03-2.17-.35-3.04-.87v6.08c0 3.6-2.27 6.14-5.96 6.14-3.13 0-5.2-2.2-5.2-5.04 0-3.18 2.48-5.32 5.52-5.32.45 0 .85.05 1.25.15v3.2a3.6 3.6 0 0 0-1.17-.2c-1.23 0-2.27.82-2.27 2.08 0 1.08.82 2.02 2 2.02 1.53 0 2.16-1.07 2.16-2.64V3h.91Z"/></svg>
}

function WhatsAppIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path fill="currentColor" d="M12 2.4A9.6 9.6 0 0 0 3.75 16.9L2.6 21.4l4.62-1.13A9.6 9.6 0 1 0 12 2.4Zm0 17.2c-1.6 0-3.08-.48-4.32-1.31l-.31-.2-2.74.67.68-2.67-.2-.32A7.2 7.2 0 1 1 12 19.6Zm3.8-5.38c-.2-.1-1.17-.58-1.35-.65-.18-.07-.31-.1-.44.1-.13.19-.5.65-.61.78-.11.13-.22.15-.42.05-.2-.1-.83-.3-1.58-.96-.58-.52-.97-1.16-1.08-1.35-.11-.2-.01-.3.08-.39.09-.09.2-.22.29-.33.1-.11.13-.2.2-.33.07-.13.04-.24-.02-.34-.05-.1-.44-1.07-.6-1.46-.16-.38-.32-.33-.44-.34h-.38c-.13 0-.33.05-.5.24-.17.2-.67.65-.67 1.58s.69 1.84.78 1.96c.1.13 1.35 2.06 3.27 2.89.46.2.82.31 1.1.4.46.14.88.12 1.21.07.37-.05 1.11-.45 1.27-.88.16-.44.16-.82.11-.9-.05-.08-.18-.13-.38-.23Z"/></svg>
}

const items = [
  { key: "instagram", label: "Instagram", href: SOCIAL_LINKS.instagram, Icon: InstagramIcon },
  { key: "facebook", label: "Facebook", href: SOCIAL_LINKS.facebook, Icon: FacebookIcon },
  { key: "twitter", label: "X / Twitter", href: SOCIAL_LINKS.twitter, Icon: XIcon },
  { key: "tiktok", label: "TikTok", href: SOCIAL_LINKS.tiktok, Icon: TikTokIcon },
  { key: "whatsapp", label: "WhatsApp", href: SOCIAL_LINKS.whatsapp, Icon: WhatsAppIcon },
] as const

export function SocialLinks({ showLabels = false }: { showLabels?: boolean }) {
  return (
    <div className={showLabels ? "flex flex-wrap gap-4" : "flex items-center gap-2"}>
      {items.map(({ key, label, href, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`NOORÉ on ${label}`}
          title={label}
          className={showLabels
            ? "inline-flex items-center gap-2 text-[10px] uppercase tracking-[.16em] text-white/65 transition hover:text-white"
            : "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/65 transition hover:border-white/30 hover:text-white"
          }
        >
          <Icon className="h-[17px] w-[17px]" />
          {showLabels && <span>{label}</span>}
        </a>
      ))}
    </div>
  )
}
