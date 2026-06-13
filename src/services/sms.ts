// SMS / OTP service - mock mode.
// Swap implementations later with Kavenegar / SMS.ir without changing callers.

export type SendOtpResult = { success: boolean; message?: string };
export type VerifyOtpResult = { success: boolean; message?: string };

const OTP_STORAGE_KEY = "parsglass_pending_otp";

export async function sendOTP(phone: string): Promise<SendOtpResult> {
  // TODO: integrate real SMS provider (Kavenegar / SMS.ir).
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  try {
    localStorage.setItem(
      OTP_STORAGE_KEY,
      JSON.stringify({ phone, code, ts: Date.now() }),
    );
  } catch {
    /* ignore */
  }
  // eslint-disable-next-line no-console
  console.log(`[sms] sendOTP -> phone=${phone} code=${code} (mock)`);
  return { success: true };
}

export async function verifyOTP(
  phone: string,
  code: string,
): Promise<VerifyOtpResult> {
  // Mock mode: accept any 4-digit code.
  if (!/^\d{4}$/.test(code)) {
    return { success: false, message: "کد باید ۴ رقم باشد" };
  }
  // eslint-disable-next-line no-console
  console.log(`[sms] verifyOTP -> phone=${phone} code=${code} (mock accept)`);
  return { success: true };
}

export function isValidIranMobile(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}
