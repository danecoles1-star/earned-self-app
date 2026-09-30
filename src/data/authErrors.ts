export function authMessage(error: {
  code?: string;
  status?: number;
  message?: string;
}): string {
  if (error.code === "over_email_send_rate_limit")
    return "Email sending is temporarily limited. Your draft is safe on this device. Please try again later.";
  if (error.status === 429 || error.code === "over_request_rate_limit")
    return "Too many attempts. Please wait before trying again. Your draft is still here.";
  if (error.code === "invalid_credentials")
    return "The email or password is incorrect. Try again, or choose Forgot password.";
  if (error.code === "email_not_confirmed")
    return "Verify your email first. Choose Email me a code to continue.";
  if (error.code === "otp_expired")
    return "That code is invalid or expired. Use the newest code, or request another.";
  if (error.code === "weak_password")
    return "Choose a stronger password with at least 12 characters.";
  if (error.code === "same_password")
    return "Choose a different password from your current one.";
  return "We could not finish that request. Your draft is still here. Please try again.";
}
