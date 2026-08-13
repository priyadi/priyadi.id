/**
 * DKIM verifier (RFC 6376) that runs entirely in the browser.
 *
 * The message never leaves the machine: parsing, canonicalization and hashing
 * are done locally with WebCrypto. The only network access is a DNS-over-HTTPS
 * lookup of the signer's public key, which reveals nothing but the domain and
 * selector that are already public information.
 */

/* -------------------------------------------------------------------------- */
/* byte <-> binary-string helpers                                             */
/* -------------------------------------------------------------------------- */

/** Decodes bytes as latin1, so one character is exactly one octet. */
export function bytesToBinaryString(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let out = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return out;
}

function binaryStringToBytes(s: string): Uint8Array {
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    bytes[i] = s.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function base64ToBytes(b64: string): Uint8Array {
  return binaryStringToBytes(atob(b64.replace(/\s+/g, '')));
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(bytesToBinaryString(bytes));
}

/** Decodes latin1 bytes as UTF-8 when they happen to be valid UTF-8. */
function binaryStringToUtf8(s: string): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(
      binaryStringToBytes(s),
    );
  } catch {
    return s;
  }
}

/* -------------------------------------------------------------------------- */
/* message parsing                                                            */
/* -------------------------------------------------------------------------- */

export interface HeaderField {
  /** Lowercased field name. */
  name: string;
  /** Field value, unfolded, without the leading space. */
  value: string;
  /** The field exactly as it appears on the wire, including trailing CRLF. */
  raw: string;
}

export interface ParsedMessage {
  headers: HeaderField[];
  /** Raw body, CRLF normalized. */
  body: string;
}

/**
 * DKIM is defined over CRLF line endings. Mail clients frequently save `.eml`
 * files with bare LF, so restore the canonical form before doing anything else.
 */
export function normalizeEol(raw: string): string {
  return raw.replace(/\r\n|\r|\n/g, '\r\n');
}

export function parseMessage(raw: string): ParsedMessage {
  const message = normalizeEol(raw);
  const separator = message.indexOf('\r\n\r\n');
  const headerBlock = separator === -1 ? message : message.slice(0, separator);
  const body = separator === -1 ? '' : message.slice(separator + 4);

  const headers: HeaderField[] = [];
  let current: string | null = null;

  for (const line of headerBlock.split('\r\n')) {
    if (/^[ \t]/.test(line) && current !== null) {
      current += '\r\n' + line;
      continue;
    }
    if (current !== null) headers.push(toHeaderField(current));
    current = line;
  }
  if (current !== null && current !== '') headers.push(toHeaderField(current));

  return { headers, body };
}

function toHeaderField(raw: string): HeaderField {
  const colon = raw.indexOf(':');
  const name = colon === -1 ? raw : raw.slice(0, colon);
  const value = colon === -1 ? '' : raw.slice(colon + 1);
  return {
    name: name.trim().toLowerCase(),
    value: value.replace(/\r\n[ \t]/g, ' ').trim(),
    raw: raw + '\r\n',
  };
}

export function getHeader(
  message: ParsedMessage,
  name: string,
): string | undefined {
  return message.headers.find((h) => h.name === name.toLowerCase())?.value;
}

/* -------------------------------------------------------------------------- */
/* MIME walking — finding forwarded messages inside attachments               */
/* -------------------------------------------------------------------------- */

export interface MessageCandidate {
  /** Human readable path, e.g. "Lampiran: hasil-slik.eml". */
  label: string;
  /** Raw RFC 822 source of this message. */
  source: string;
  /** Nesting depth; 0 is the file the user supplied. */
  depth: number;
}

interface ContentType {
  type: string;
  params: Record<string, string>;
}

function parseContentType(value: string | undefined): ContentType {
  if (!value) return { type: 'text/plain', params: {} };
  const [head, ...rest] = value.split(';');
  const params: Record<string, string> = {};
  for (const part of rest) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim().toLowerCase();
    let val = part.slice(eq + 1).trim();
    if (val.startsWith('"')) val = val.slice(1, val.lastIndexOf('"'));
    params[key] = val;
  }
  return { type: head.trim().toLowerCase(), params };
}

function decodeQuotedPrintable(input: string): string {
  return input
    .replace(/=\r\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
}

function decodeTransferEncoding(body: string, encoding: string): string {
  switch (encoding.trim().toLowerCase()) {
    case 'base64':
      try {
        return atob(body.replace(/[^A-Za-z0-9+/=]/g, ''));
      } catch {
        return body;
      }
    case 'quoted-printable':
      return decodeQuotedPrintable(body);
    default:
      return body;
  }
}

function splitMultipart(body: string, boundary: string): string[] {
  const delimiter = '--' + boundary;
  const parts: string[] = [];
  const lines = body.split('\r\n');
  let currentLines: string[] | null = null;

  for (const line of lines) {
    if (line === delimiter || line === delimiter + '--') {
      if (currentLines !== null) parts.push(currentLines.join('\r\n'));
      currentLines = line === delimiter ? [] : null;
      continue;
    }
    if (currentLines !== null) currentLines.push(line);
  }
  if (currentLines !== null) parts.push(currentLines.join('\r\n'));
  return parts;
}

function looksLikeMessage(source: string): boolean {
  // A bare minimum sanity check: a header block with at least one field.
  return /^[!-9;-~]+[ \t]*:/.test(normalizeEol(source).trimStart());
}

/**
 * Returns the supplied message plus every `message/rfc822` (or `.eml`)
 * attachment found within it, so a "forward as attachment" can be verified.
 */
export function collectMessages(source: string): MessageCandidate[] {
  const found: MessageCandidate[] = [
    { label: 'Berkas yang diunggah', source, depth: 0 },
  ];
  walk(source, 0, found);
  return found;
}

function walk(source: string, depth: number, out: MessageCandidate[]): void {
  if (depth > 6) return;
  const message = parseMessage(source);
  const contentType = parseContentType(getHeader(message, 'content-type'));
  const encoding = getHeader(message, 'content-transfer-encoding') ?? '7bit';

  if (contentType.type.startsWith('multipart/')) {
    const boundary = contentType.params.boundary;
    if (!boundary) return;
    for (const part of splitMultipart(message.body, boundary)) {
      const parsed = parseMessage(part);
      const partType = parseContentType(getHeader(parsed, 'content-type'));
      const partEncoding =
        getHeader(parsed, 'content-transfer-encoding') ?? '7bit';
      const filename = attachmentName(parsed);

      const isForwarded =
        partType.type === 'message/rfc822' ||
        /\.eml$/i.test(filename ?? '') ||
        (partType.type === 'application/octet-stream' &&
          looksLikeMessage(decodeTransferEncoding(parsed.body, partEncoding)));

      if (isForwarded) {
        const inner = decodeTransferEncoding(parsed.body, partEncoding);
        if (looksLikeMessage(inner)) {
          out.push({
            label: filename
              ? `Lampiran: ${filename}`
              : `Lampiran pesan (kedalaman ${depth + 1})`,
            source: inner,
            depth: depth + 1,
          });
          walk(inner, depth + 1, out);
          continue;
        }
      }
      if (partType.type.startsWith('multipart/')) walk(part, depth, out);
    }
    return;
  }

  if (contentType.type === 'message/rfc822') {
    const inner = decodeTransferEncoding(message.body, encoding);
    if (looksLikeMessage(inner)) {
      out.push({
        label: `Pesan terlampir (kedalaman ${depth + 1})`,
        source: inner,
        depth: depth + 1,
      });
      walk(inner, depth + 1, out);
    }
  }
}

function attachmentName(message: ParsedMessage): string | undefined {
  const disposition = parseContentType(
    getHeader(message, 'content-disposition'),
  );
  const contentType = parseContentType(getHeader(message, 'content-type'));
  return disposition.params.filename ?? contentType.params.name;
}

/* -------------------------------------------------------------------------- */
/* canonicalization (RFC 6376 §3.4)                                           */
/* -------------------------------------------------------------------------- */

function canonicalizeHeaderRelaxed(field: HeaderField): string {
  const colon = field.raw.indexOf(':');
  const name = field.raw.slice(0, colon).trim().toLowerCase();
  const value = field.raw
    .slice(colon + 1)
    .replace(/\r\n$/, '')
    .replace(/\r\n/g, '') // unfold
    .replace(/[ \t]+/g, ' ')
    .trim();
  return `${name}:${value}\r\n`;
}

export function canonicalizeHeader(field: HeaderField, mode: string): string {
  return mode === 'relaxed' ? canonicalizeHeaderRelaxed(field) : field.raw;
}

export function canonicalizeBody(body: string, mode: string): string {
  if (mode === 'relaxed') {
    const trimmed = body
      .replace(/[ \t]+/g, ' ')
      .replace(/ \r\n/g, '\r\n')
      .replace(/(\r\n)+$/, '');
    return trimmed === '' ? '' : trimmed + '\r\n';
  }
  const trimmed = body.replace(/(\r\n)+$/, '');
  return trimmed === '' ? '\r\n' : trimmed + '\r\n';
}

/* -------------------------------------------------------------------------- */
/* the DKIM-Signature header                                                  */
/* -------------------------------------------------------------------------- */

export interface DkimTags {
  v?: string;
  a?: string;
  c?: string;
  d?: string;
  s?: string;
  h?: string;
  bh?: string;
  b?: string;
  l?: string;
  t?: string;
  x?: string;
  q?: string;
  i?: string;
  [key: string]: string | undefined;
}

function parseTagList(value: string): DkimTags {
  const tags: DkimTags = {};
  for (const chunk of value.split(';')) {
    const eq = chunk.indexOf('=');
    if (eq === -1) continue;
    const key = chunk.slice(0, eq).trim();
    if (key === '') continue;
    tags[key] = chunk.slice(eq + 1).trim();
  }
  return tags;
}

/** Blanks out the `b=` value, which must not be part of the signed data. */
function stripSignatureValue(rawWithoutCrlf: string): string {
  return rawWithoutCrlf.replace(
    /([:;][ \t\r\n]*b[ \t\r\n]*=)[^;]*/,
    (_, prefix: string) => prefix,
  );
}

/* -------------------------------------------------------------------------- */
/* DNS-over-HTTPS public key lookup                                           */
/* -------------------------------------------------------------------------- */

const DOH_ENDPOINTS = [
  'https://dns.google/resolve',
  'https://cloudflare-dns.com/dns-query',
];

interface DohAnswer {
  type: number;
  data: string;
}

export async function fetchDkimRecord(
  domain: string,
  selector: string,
): Promise<string> {
  const name = `${selector}._domainkey.${domain}`;
  let lastError = '';

  for (const endpoint of DOH_ENDPOINTS) {
    try {
      const response = await fetch(
        `${endpoint}?name=${encodeURIComponent(name)}&type=TXT`,
        { headers: { Accept: 'application/dns-json' } },
      );
      if (!response.ok) {
        lastError = `${endpoint} menjawab HTTP ${response.status}`;
        continue;
      }
      const json = (await response.json()) as { Answer?: DohAnswer[] };
      const records = (json.Answer ?? [])
        .filter((answer) => answer.type === 16)
        .map((answer) => joinTxtStrings(answer.data));
      const record = records.find((r) => /(^|;)\s*p\s*=/.test(r));
      if (record) return record;
      lastError = `tidak ada record TXT DKIM pada ${name}`;
    } catch (error) {
      lastError = `${endpoint} tidak dapat dihubungi (${String(error)})`;
    }
  }
  throw new Error(`Gagal mengambil kunci publik: ${lastError}`);
}

/** DNS TXT values arrive as one or more quoted strings that must be joined. */
function joinTxtStrings(data: string): string {
  const chunks = data.match(/"((?:[^"\\]|\\.)*)"/g);
  if (!chunks) return data.trim();
  return chunks
    .map((chunk) => chunk.slice(1, -1).replace(/\\(.)/g, '$1'))
    .join('');
}

/* -------------------------------------------------------------------------- */
/* key import                                                                 */
/* -------------------------------------------------------------------------- */

function derLength(length: number): number[] {
  if (length < 0x80) return [length];
  const bytes: number[] = [];
  let remaining = length;
  while (remaining > 0) {
    bytes.unshift(remaining & 0xff);
    remaining >>= 8;
  }
  return [0x80 | bytes.length, ...bytes];
}

/**
 * A handful of domains publish a bare PKCS#1 `RSAPublicKey` instead of the
 * SubjectPublicKeyInfo the RFC asks for. Wrap it so WebCrypto accepts it.
 */
function wrapPkcs1AsSpki(pkcs1: Uint8Array): Uint8Array {
  const algorithm = [
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01,
    0x01, 0x05, 0x00,
  ];
  const bitString = [
    0x03,
    ...derLength(pkcs1.length + 1),
    0x00,
    ...Array.from(pkcs1),
  ];
  const body = [...algorithm, ...bitString];
  return new Uint8Array([0x30, ...derLength(body.length), ...body]);
}

async function importPublicKey(
  keyType: string,
  keyBytes: Uint8Array,
): Promise<{ key: CryptoKey; algorithm: string }> {
  if (keyType === 'ed25519') {
    const raw = keyBytes.length === 32 ? keyBytes : keyBytes.slice(-32);
    const key = await crypto.subtle.importKey(
      'raw',
      raw as BufferSource,
      { name: 'Ed25519' },
      false,
      ['verify'],
    );
    return { key, algorithm: 'Ed25519' };
  }

  const params = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } as const;
  try {
    const key = await crypto.subtle.importKey(
      'spki',
      keyBytes as BufferSource,
      params,
      false,
      ['verify'],
    );
    return { key, algorithm: 'RSASSA-PKCS1-v1_5' };
  } catch {
    const key = await crypto.subtle.importKey(
      'spki',
      wrapPkcs1AsSpki(keyBytes) as BufferSource,
      params,
      false,
      ['verify'],
    );
    return { key, algorithm: 'RSASSA-PKCS1-v1_5' };
  }
}

/* -------------------------------------------------------------------------- */
/* verification                                                               */
/* -------------------------------------------------------------------------- */

export type SignatureStatus = 'pass' | 'fail' | 'error';

export interface SignatureResult {
  status: SignatureStatus;
  /** Short verdict in Indonesian, safe to show as the headline. */
  summary: string;
  domain?: string;
  selector?: string;
  algorithm?: string;
  canonicalization?: string;
  signedHeaders: string[];
  bodyHashValid?: boolean;
  signatureValid?: boolean;
  /** True when `d=` equals, or is a parent of, the From header's domain. */
  aligned?: boolean;
  fromDomain?: string;
  keyBits?: number;
  signedAt?: Date;
  expiresAt?: Date;
  warnings: string[];
  record?: string;
}

export interface MessageSummary {
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
}

export interface VerificationReport {
  summary: MessageSummary;
  signatures: SignatureResult[];
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', data as BufferSource);
  return new Uint8Array(digest);
}

function domainOf(address: string | undefined): string | undefined {
  if (!address) return undefined;
  const match = address.match(/@([A-Za-z0-9.\-_]+)/g);
  if (!match) return undefined;
  return match[match.length - 1].slice(1).replace(/[.>]+$/, '').toLowerCase();
}

function isAligned(signingDomain: string, fromDomain: string): boolean {
  return (
    fromDomain === signingDomain || fromDomain.endsWith('.' + signingDomain)
  );
}

export function summarizeMessage(message: ParsedMessage): MessageSummary {
  const read = (name: string) => {
    const value = getHeader(message, name);
    return value === undefined ? undefined : decodeEncodedWords(value);
  };
  return {
    from: read('from'),
    to: read('to'),
    subject: read('subject'),
    date: read('date'),
  };
}

/** Decodes RFC 2047 encoded words so subjects render readably. */
function decodeEncodedWords(value: string): string {
  return value.replace(
    /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,
    (whole, charset: string, encoding: string, text: string) => {
      try {
        const raw =
          encoding.toUpperCase() === 'B'
            ? atob(text)
            : decodeQuotedPrintable(text.replace(/_/g, ' '));
        return /utf-?8/i.test(charset) ? binaryStringToUtf8(raw) : raw;
      } catch {
        return whole;
      }
    },
  );
}

export interface VerifyOptions {
  /** Overridable so the DNS lookup can be stubbed in tests. */
  lookupRecord?: (domain: string, selector: string) => Promise<string>;
}

export async function verifyMessage(
  source: string,
  options: VerifyOptions = {},
): Promise<VerificationReport> {
  const message = parseMessage(source);
  const summary = summarizeMessage(message);
  const fromDomain = domainOf(getHeader(message, 'from'));

  const signatureFields = message.headers.filter(
    (h) => h.name === 'dkim-signature',
  );

  const signatures = await Promise.all(
    signatureFields.map((field) =>
      verifySignature(message, field, fromDomain, options).catch(
        (error): SignatureResult => ({
          status: 'error',
          summary:
            error instanceof Error ? error.message : 'Kesalahan tidak dikenal',
          signedHeaders: [],
          warnings: [],
        }),
      ),
    ),
  );

  return { summary, signatures };
}

async function verifySignature(
  message: ParsedMessage,
  field: HeaderField,
  fromDomain: string | undefined,
  options: VerifyOptions,
): Promise<SignatureResult> {
  const tags = parseTagList(field.value);
  const warnings: string[] = [];

  const domain = tags.d;
  const selector = tags.s;
  if (!domain || !selector || !tags.b || !tags.bh || !tags.h) {
    return {
      status: 'error',
      summary: 'Header DKIM-Signature tidak lengkap',
      domain,
      selector,
      signedHeaders: [],
      warnings,
    };
  }

  const algorithm = (tags.a ?? 'rsa-sha256').toLowerCase();
  if (!algorithm.endsWith('-sha256')) {
    return {
      status: 'error',
      summary: `Algoritma ${algorithm} tidak didukung (hanya SHA-256)`,
      domain,
      selector,
      algorithm,
      signedHeaders: [],
      warnings,
    };
  }

  const [headerCanon = 'simple', bodyCanon = 'simple'] = (
    tags.c ?? 'simple/simple'
  )
    .toLowerCase()
    .split('/');

  const signedHeaders = tags.h
    .split(':')
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name !== '');

  const result: SignatureResult = {
    status: 'fail',
    summary: '',
    domain,
    selector,
    algorithm,
    canonicalization: `${headerCanon}/${bodyCanon}`,
    signedHeaders,
    fromDomain,
    warnings,
  };

  if (tags.t && /^\d+$/.test(tags.t)) {
    result.signedAt = new Date(Number(tags.t) * 1000);
  }
  if (tags.x && /^\d+$/.test(tags.x)) {
    result.expiresAt = new Date(Number(tags.x) * 1000);
    if (result.expiresAt.getTime() < Date.now()) {
      warnings.push('Tanda tangan sudah melewati masa berlaku (tag x=).');
    }
  }
  if (!signedHeaders.includes('from')) {
    warnings.push(
      'Header From tidak ikut ditandatangani, sehingga pengirim dapat dipalsukan.',
    );
  }
  for (const name of ['subject', 'date', 'to']) {
    if (!signedHeaders.includes(name)) {
      warnings.push(`Header ${name} tidak ikut ditandatangani.`);
    }
  }
  if (tags.l !== undefined) {
    warnings.push(
      `Hanya ${tags.l} oktet pertama dari badan email yang ditandatangani (tag l=), sisanya dapat diubah.`,
    );
  }

  // 1. Body hash.
  let canonicalBody = canonicalizeBody(message.body, bodyCanon);
  if (tags.l !== undefined && /^\d+$/.test(tags.l)) {
    canonicalBody = canonicalBody.slice(0, Number(tags.l));
  }
  const bodyHash = bytesToBase64(
    await sha256(binaryStringToBytes(canonicalBody)),
  );
  result.bodyHashValid = bodyHash === tags.bh.replace(/\s+/g, '');

  // 2. The signed header set, taken from the bottom of the message up.
  const remaining = new Map<string, HeaderField[]>();
  for (const header of message.headers) {
    const list = remaining.get(header.name) ?? [];
    list.push(header);
    remaining.set(header.name, list);
  }

  let signedData = '';
  for (const name of signedHeaders) {
    const list = remaining.get(name);
    const header = list?.pop();
    if (header) signedData += canonicalizeHeader(header, headerCanon);
  }
  const signatureField: HeaderField = {
    ...field,
    raw: stripSignatureValue(field.raw.replace(/\r\n$/, '')),
  };
  signedData += canonicalizeHeader(signatureField, headerCanon).replace(
    /\r\n$/,
    '',
  );

  // 3. Public key from DNS.
  const lookup = options.lookupRecord ?? fetchDkimRecord;
  let record: string;
  try {
    record = await lookup(domain, selector);
  } catch (error) {
    return {
      ...result,
      status: 'error',
      summary: error instanceof Error ? error.message : String(error),
    };
  }
  result.record = record;
  const keyTags = parseTagList(record);
  if (!keyTags.p) {
    return {
      ...result,
      status: 'error',
      summary: `Record DKIM ${selector}._domainkey.${domain} tidak memuat kunci publik`,
    };
  }
  if (keyTags.p === '') {
    return {
      ...result,
      status: 'error',
      summary: 'Kunci publik telah dicabut oleh pemilik domain',
    };
  }

  const keyBytes = base64ToBytes(keyTags.p);
  const keyType = (keyTags.k ?? 'rsa').toLowerCase();
  result.keyBits = keyType === 'ed25519' ? 256 : estimateRsaBits(keyBytes);
  if (keyType !== 'ed25519' && result.keyBits < 1024) {
    warnings.push(
      `Kunci RSA hanya ${result.keyBits} bit, di bawah minimum 1024 bit yang disarankan.`,
    );
  }

  let key: CryptoKey;
  let verifyAlgorithm: string;
  try {
    const imported = await importPublicKey(keyType, keyBytes);
    key = imported.key;
    verifyAlgorithm = imported.algorithm;
  } catch (error) {
    return {
      ...result,
      status: 'error',
      summary: `Kunci publik tidak dapat dibaca (${String(error)})`,
    };
  }

  // 4. Signature. RFC 8463 signs the SHA-256 digest of the header set with
  // Ed25519, whereas RSASSA-PKCS1-v1_5 hashes the data itself.
  const signedBytes = binaryStringToBytes(signedData);
  const signedInput =
    verifyAlgorithm === 'Ed25519' ? await sha256(signedBytes) : signedBytes;

  result.signatureValid = await crypto.subtle.verify(
    { name: verifyAlgorithm },
    key,
    base64ToBytes(tags.b) as BufferSource,
    signedInput as BufferSource,
  );

  result.aligned = fromDomain ? isAligned(domain, fromDomain) : false;

  if (result.bodyHashValid && result.signatureValid) {
    result.status = 'pass';
    result.summary = `Tanda tangan sah dan cocok dengan domain ${domain}`;
  } else if (!result.bodyHashValid && !result.signatureValid) {
    result.status = 'fail';
    result.summary =
      'Tanda tangan tidak sah: isi maupun header email tidak cocok';
  } else if (!result.bodyHashValid) {
    result.status = 'fail';
    result.summary = 'Isi email telah berubah setelah ditandatangani';
  } else {
    result.status = 'fail';
    result.summary = 'Header email telah berubah setelah ditandatangani';
  }

  return result;
}

/** Reads the modulus length out of a DER encoded RSA key, best effort. */
function estimateRsaBits(der: Uint8Array): number {
  // The modulus is the first and longest INTEGER in the structure.
  for (let i = 0; i < der.length - 4; i++) {
    if (der[i] !== 0x02) continue;
    let length = der[i + 1];
    let offset = i + 2;
    if (length & 0x80) {
      const count = length & 0x7f;
      if (count > 3) continue;
      length = 0;
      for (let j = 0; j < count; j++) length = (length << 8) | der[offset + j];
      offset += count;
    }
    if (length > 64) {
      const leadingZero = der[offset] === 0x00 ? 1 : 0;
      return (length - leadingZero) * 8;
    }
  }
  return 0;
}
