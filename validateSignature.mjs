import crypto from 'crypto';

const MILLISECONDS_PER_SECOND = 1_000;
const SIGNATURE_VERSION = '1';

function parseSignatureHeader(header) {
  const parts = header.split(',');
  const timestamp = parts.find((part) => part.startsWith('t='))?.split('=')[1];
  const signature = parts.find((part) => part.startsWith(`v${SIGNATURE_VERSION}=`))?.split('=')[1];

  if (!timestamp || !signature) {
    return { success: false, data: null };
  }

  return { success: true, data: { timestamp: parseInt(timestamp, 10), signature } };
}

function createSignature({ timestamp, payload, secret }) {
  const signedPayloadString = `${timestamp}.${payload ? JSON.stringify(payload) : ''}`;
  return crypto.createHmac('sha256', secret).update(signedPayloadString).digest('hex');
}

export function validateSignature({ incomingSignatureHeader, payload, secret, validForSeconds = 30 }) {
  if (!incomingSignatureHeader) {
    return { isValid: false, reason: 'Missing signature' };
  }

  const { success, data } = parseSignatureHeader(incomingSignatureHeader);
  if (!success) {
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
