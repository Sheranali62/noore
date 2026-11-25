export const PASSWORD_POLICY_MESSAGE =
  "Use at least 12 characters with uppercase and lowercase letters, a number, and a symbol."

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 12 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}
