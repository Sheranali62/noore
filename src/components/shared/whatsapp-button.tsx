"use client"

const WHATSAPP_URL =
  "https://wa.me/923150490498?text=Hello%2C%20I%20visited%20your%20website%20and%20would%20like%20to%20make%20an%20inquiry."

export function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="noore-whatsapp"
      aria-label="Chat with NOORÉ on WhatsApp"
    >
      <span className="noore-whatsapp__icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="currentColor"
            d="M16 3.2C8.93 3.2 3.2 8.93 3.2 16c0 2.25.59 4.36 1.62 6.2L3.3 28.7l6.67-1.48A12.73 12.73 0 0 0 16 28.8c7.07 0 12.8-5.73 12.8-12.8S23.07 3.2 16 3.2Zm0 23.27c-2.02 0-3.9-.6-5.47-1.64l-.39-.25-3.96.88.89-3.85-.26-.4A10.6 10.6 0 0 1 5.4 16C5.4 10.15 10.15 5.4 16 5.4S26.6 10.15 26.6 16 21.85 26.47 16 26.47Z"
          />
          <path
            fill="currentColor"
            d="M21.83 18.27c-.32-.16-1.9-.94-2.2-1.05-.3-.11-.52-.16-.74.16-.22.33-.85 1.05-1.04 1.27-.19.22-.38.25-.7.08-.33-.16-1.38-.51-2.62-1.62-.97-.87-1.63-1.94-1.82-2.27-.19-.33-.02-.5.14-.66.15-.15.33-.38.49-.57.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.57-.08-.16-.74-1.79-1.02-2.45-.27-.65-.54-.56-.74-.57h-.63c-.22 0-.57.08-.87.41-.3.33-1.14 1.11-1.14 2.7s1.17 3.13 1.33 3.35c.16.22 2.3 3.52 5.57 4.93.78.34 1.39.54 1.87.69.79.25 1.51.21 2.08.13.63-.09 1.9-.78 2.17-1.54.27-.76.27-1.41.19-1.54-.08-.14-.3-.22-.62-.38Z"
          />
        </svg>
      </span>
      <span className="noore-whatsapp__text">WhatsApp</span>
    </a>
  )
}
