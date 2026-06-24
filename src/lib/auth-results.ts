export type SignUpResult =
  | { status: "success" }
  | { status: "verify_email"; email: string }
  | { status: "error"; message: string };

export type SignInResult =
  | { status: "success" }
  | { status: "error"; message: string };

function isEmailNotConfirmed(message: string, code?: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("email not confirmed") ||
    lower.includes("email not verified") ||
    code === "email_not_confirmed"
  );
}

export function parseSignInError(message: string, code?: string): string {
  if (isEmailNotConfirmed(message, code)) {
    return "Your email isn't verified yet. Check your inbox for the confirmation link, then try signing in again.";
  }
  return message;
}

export { isEmailNotConfirmed };
