export const PASSWORD_POLICY_MESSAGE =
  "Use 12–72 characters with uppercase and lowercase letters, a number, and a symbol."

const PASSWORD_SYMBOLS = "!@#$%^&*()_+-=[]{};':\"\\|<>?,./\u0060~"

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 12 &&
    password.length <= 72 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    Array.from(password).some(character => PASSWORD_SYMBOLS.includes(character))
  )
}
