import crypto from 'crypto';

const MILLISECONDS_PER_SECOND = 1_000;
const SIGNATURE_VERSION = '1';

interface SignatureHeaderData {
  timestamp: number;
  signature: string;
}

interface SignatureHeaderResult {
  success: boolean;
  data: SignatureHeaderData | null;
}

function parseSignatureHeader(header: string): SignatureHeaderResult {
  const parts = header.split(',');
  const timestampStr = parts.find((part) => part.startsWith('t='))?.split('=')[1];
  const signature = parts.find((part) => part.startsWith(`v${SIGNATURE_VERSION}=`))?.split('=')[1];

  if (!timestampStr || !signature) {
    return { success: false, data: null };
  }

  const timestamp = parseInt(timestampStr, 10);
  return { success: true, data: { timestamp, signature } };
}

interface SignaturePayload {
  timestamp: number;
  payload?: any;
  secret: string;
}

function createSignature({ timestamp, payload, secret }: SignaturePayload): string {
  const signedPayloadString = `${timestamp}.${payload ? JSON.stringify(payload) : ''}`;
  return crypto.createHmac('sha256', secret).update(signedPayloadString).digest('hex');
}

interface ValidateSignatureInput {
  incomingSignatureHeader: string;
  payload: any;
  secret: string;
  validForSeconds?: number;
}

export interface ValidateSignatureResult {
  isValid: boolean;
  reason?: string;
}

export function validateSignature({
  incomingSignatureHeader,
  payload,
  secret,
  validForSeconds = 30,
}: ValidateSignatureInput): ValidateSignatureResult {
  if (!incomingSignatureHeader) {
    return { isValid: false, reason: 'Missing signature' };
  }

  const { success, data } = parseSignatureHeader(incomingSignatureHeader);
  if (!success || !data) {
    return { isValid: false, reason: 'Invalid signature header' };
  }

  const { timestamp, signature } = data;
  const generatedSignature = createSignature({ timestamp, payload, secret });

  if (!crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(signature))) {
    return { isValid: false, reason: 'Invalid signature' };
  }

  const differenceInSeconds = Math.abs((Date.now() - timestamp) / MILLISECONDS_PER_SECOND);
  if (validForSeconds !== 0 && differenceInSeconds > validForSeconds) {
    return { isValid: false, reason: 'Invalid timestamp' };
  }

  return { isValid: true };
}