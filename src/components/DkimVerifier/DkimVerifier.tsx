import React, { useCallback, useRef, useState } from 'react';
import styles from './DkimVerifier.module.css';
import {
  bytesToBinaryString,
  collectMessages,
  domainOf,
  looksLikeMessage,
  verifyMessage,
  type MessageCandidate,
  type SignatureResult,
  type VerificationReport,
} from './dkim';

interface CandidateReport {
  candidate: MessageCandidate;
  report: VerificationReport;
}

type State =
  | { phase: 'idle' }
  | { phase: 'working'; filename: string; note?: string }
  | {
      phase: 'done';
      filename: string;
      note?: string;
      source: string;
      results: CandidateReport[];
    }
  | { phase: 'error'; filename: string; message: string };

export interface DkimVerifierProps {
  /**
   * Domains expected to have signed the message. When set, the verdict is
   * about a message from one of these domains, and signatures from other
   * domains are shown only in the technical details.
   */
  expectedDomains?: string[];
  /** Shown under a verdict that the message is genuine: what to do next. */
  afterPass?: React.ReactNode;
}

export default function DkimVerifier({
  expectedDomains,
  afterPass,
}: DkimVerifierProps): React.ReactNode {
  const [state, setState] = useState<State>({ phase: 'idle' });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFile = useRef<{ file: File; note?: string } | null>(null);

  const handleFile = useCallback(async (file: File, note?: string) => {
    lastFile.current = { file, note };
    setState({ phase: 'working', filename: file.name, note });
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const source = bytesToBinaryString(bytes);
      const results: CandidateReport[] = [];
      if (looksLikeMessage(source)) {
        for (const candidate of collectMessages(source)) {
          results.push({
            candidate,
            report: await verifyMessage(candidate.source),
          });
        }
      }
      setState({ phase: 'done', filename: file.name, note, source, results });
    } catch (error) {
      setState({
        phase: 'error',
        filename: file.name,
        message:
          error instanceof Error && error.message
            ? error.message
            : 'Berkas tidak dapat dibaca.',
      });
    }
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null | undefined) => {
      const file = files?.[0];
      if (!file) return;
      const note =
        files.length > 1
          ? `${files.length} berkas dipilih; hanya ${file.name} yang diperiksa.`
          : undefined;
      void handleFile(file, note);
    },
    [handleFile],
  );

  const retry = useCallback(() => {
    if (lastFile.current) {
      void handleFile(lastFile.current.file, lastFile.current.note);
    }
  }, [handleFile]);

  const verdicts =
    state.phase === 'done'
      ? judge(state.source, state.results, expectedDomains)
      : [];

  return (
    <div className={styles.verifier}>
      <p className={styles.title}>Pemeriksa tanda tangan DKIM</p>
      <p className={styles.privacy}>
        Pemeriksaan berjalan di peramban Anda. Isi email tidak dikirim ke mana
        pun, termasuk ke situs ini. Yang diambil dari internet hanya kunci
        publik pengirim, lewat DNS Google atau Cloudflare.
      </p>

      <div
        className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <FileIcon className={styles.fileIcon} />
        <span className={styles.pickText}>
          <button
            type="button"
            className={styles.pick}
            onClick={() => inputRef.current?.click()}
          >
            Pilih berkas .eml
          </button>
          <span className={styles.dropHint}>atau seret berkasnya ke sini</span>
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".eml,message/rfc822"
          className={styles.fileInput}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      <p className="sr-only" aria-live="polite">
        {state.phase === 'working'
          ? `Memeriksa ${state.filename}`
          : state.phase === 'done'
            ? `Selesai. ${verdicts.map((v) => v.headline).join('. ')}`
            : state.phase === 'error'
              ? `Gagal. ${state.message}`
              : ''}
      </p>

      {state.phase === 'working' && (
        <p className={styles.status}>Memeriksa {state.filename}…</p>
      )}

      {state.phase === 'error' && (
        <div className={styles.result}>
          <p className={styles.fileLine}>Hasil untuk {state.filename}</p>
          <Verdict
            tone="unknown"
            headline="Berkas tidak dapat dibaca"
            body={<p className={styles.explain}>{state.message}</p>}
          />
        </div>
      )}

      {state.phase === 'done' && (
        <div className={styles.result}>
          <p className={styles.fileLine}>Hasil untuk {state.filename}</p>
          {state.note && <p className={styles.fileLine}>{state.note}</p>}

          {verdicts.map((verdict, index) => (
            <div key={index} className={styles.verdictBlock}>
              <Verdict
                tone={verdict.tone}
                headline={verdict.headline}
                body={
                  <>
                    {verdict.body}
                    {verdict.message && (
                      <MessageFacts report={verdict.message.report} />
                    )}
                    {verdict.tone === 'pass' && afterPass && (
                      <div className={styles.next}>{afterPass}</div>
                    )}
                    {verdict.retry && (
                      <button
                        type="button"
                        className={styles.button}
                        onClick={retry}
                      >
                        Periksa lagi
                      </button>
                    )}
                  </>
                }
              />
            </div>
          ))}

          {forwarders(state.results, verdicts).map(({ report }, index) => (
            <p key={index} className={styles.forwarder}>
              Email penerus dari {report.summary.from ?? 'pengirim tak dikenal'}{' '}
              tidak perlu diperiksa. Yang menentukan adalah email{' '}
              {domainList(expectedDomains) ?? 'terlampir'} di dalamnya.
            </p>
          ))}

          {state.results.length > 0 && (
            <details className={styles.technical}>
              <summary>Rincian teknis</summary>
              {state.results.map((result, index) => (
                <CandidateDetails
                  key={index}
                  result={result}
                  relevant={verdicts.some((v) => v.message === result)}
                  expectedDomains={expectedDomains}
                />
              ))}
            </details>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Verdict                                                                    */
/* -------------------------------------------------------------------------- */

type Tone = 'pass' | 'fail' | 'unknown';

interface Judgement {
  tone: Tone;
  headline: string;
  body?: React.ReactNode;
  /** The message the verdict is about, whose facts are listed under it. */
  message?: CandidateReport;
  retry?: boolean;
}

const RANK: Record<Tone, number> = { pass: 0, fail: 1, unknown: 2 };

function domainList(domains: string[] | undefined): string | undefined {
  if (!domains || domains.length === 0) return undefined;
  return domains.join(' atau ');
}

function inDomains(domain: string | undefined, domains: string[]): boolean {
  return (
    domain !== undefined &&
    domains.some((d) => domain === d || domain.endsWith('.' + d))
  );
}

/**
 * Reduces every message in the file to one answer per message that matters:
 * a message from, or signed by, an expected domain. Without expected domains,
 * the innermost messages are the ones that matter.
 */
function judge(
  source: string,
  results: CandidateReport[],
  expectedDomains: string[] | undefined,
): Judgement[] {
  const first = results[0];
  const looksEmpty =
    !first ||
    (first.report.signatures.length === 0 &&
      !first.report.summary.from &&
      !first.report.summary.date);

  if (looksEmpty) {
    const pdf = source.startsWith('%PDF');
    return [
      {
        tone: 'unknown',
        headline: pdf ? 'Ini berkas PDF, bukan email' : 'Berkas ini bukan email',
        body: (
          <p className={styles.explain}>
            {pdf
              ? 'Dokumen PDF tidak bisa diperiksa di sini. Yang diperiksa adalah email yang memuat tautan ke dokumen itu, '
              : 'Berkas ini tidak berisi header email. Pilih email yang '}
            disimpan sebagai berkas <code>.eml</code>.
          </p>
        ),
      },
    ];
  }

  const domains = expectedDomains ?? [];
  const named = domainList(expectedDomains);
  const maxDepth = Math.max(...results.map((r) => r.candidate.depth));

  const matches = (signature: SignatureResult) =>
    domains.length > 0
      ? inDomains(signature.domain, domains)
      : signature.aligned === true;

  const relevant = results.filter(({ candidate, report }) =>
    domains.length > 0
      ? inDomains(domainOf(report.summary.from), domains) ||
        report.signatures.some(matches)
      : candidate.depth === maxDepth,
  );

  if (relevant.length === 0) {
    const attached = results.length - 1;
    return [
      {
        tone: 'fail',
        headline: `Tidak ada email dari ${named} di berkas ini`,
        body:
          attached === 0 ? (
            <p className={styles.explain}>
              Berkas ini adalah email dari{' '}
              {first.report.summary.from ?? 'pengirim lain'}, dan tidak ada
              email lain yang terlampir di dalamnya. Jika email {named}{' '}
              diteruskan dengan cara biasa, bukan sebagai lampiran, header
              yang dibutuhkan untuk pemeriksaan ikut hilang. Minta email itu
              diteruskan lagi sebagai lampiran.
            </p>
          ) : (
            <p className={styles.explain}>
              Ada {attached} email terlampir, tetapi tidak satu pun berasal
              dari {named}. Pastikan yang dilampirkan adalah email yang
              dimaksud.
            </p>
          ),
      },
    ];
  }

  return relevant
    .map((result): Judgement => {
      const signatures = result.report.signatures.filter(matches);
      const fromDomain = domainOf(result.report.summary.from);
      const pass = signatures.find((s) => s.status === 'pass');
      const failed = signatures.find((s) => s.status === 'fail');
      const errored = signatures.find((s) => s.status === 'error');

      if (pass) {
        const signer = pass.domain!;
        const cautions: string[] = [];
        if (pass.aligned === false) {
          cautions.push(
            `Tanda tangan dibuat oleh ${signer}, tetapi alamat pengirimnya dari ${fromDomain ?? 'domain lain'}.`,
          );
        }
        if (!pass.signedHeaders.includes('from')) {
          cautions.push(
            'Alamat pengirim (From) tidak ikut ditandatangani, sehingga bisa dipalsukan.',
          );
        }
        if (pass.bodyLength !== undefined) {
          cautions.push(
            `Hanya ${pass.bodyLength} byte pertama isi email yang ditandatangani. Bagian setelahnya bisa saja ditambahkan orang lain.`,
          );
        }
        if (cautions.length === 0) {
          return {
            tone: 'pass',
            headline: `Asli dari ${signer} dan tidak diubah sejak dikirim`,
            body: (
              <p className={styles.explain}>
                Tanda tangan DKIM-nya sah, dibuat oleh {signer}, domain yang
                sama dengan alamat pengirimnya.
              </p>
            ),
            message: result,
          };
        }
        return {
          tone: 'unknown',
          headline: `Tanda tangan ${signer} sah, tetapi ada catatan`,
          body: (
            <ul className={styles.cautions}>
              {cautions.map((caution) => (
                <li key={caution}>{caution}</li>
              ))}
            </ul>
          ),
          message: result,
        };
      }

      if (failed) {
        return {
          tone: 'fail',
          headline: `Email ini sudah diubah setelah dikirim oleh ${failed.domain}`,
          body: (
            <p className={styles.explain}>
              {failed.summary}. Bisa jadi isinya dipalsukan, bisa juga email
              itu rusak saat diteruskan atau disimpan. Minta email aslinya
              diteruskan lagi sebagai lampiran, lalu periksa ulang.
            </p>
          ),
          message: result,
        };
      }

      if (errored) {
        return {
          tone: 'unknown',
          headline: 'Keaslian belum bisa dipastikan',
          body: <p className={styles.explain}>{errored.summary}</p>,
          message: result,
          retry: true,
        };
      }

      return {
        tone: 'fail',
        headline: named
          ? `Email ini mengaku dari ${named}, tetapi tidak ditandatangani olehnya`
          : 'Email ini tidak memiliki tanda tangan DKIM',
        body: (
          <p className={styles.explain}>
            {named
              ? `Email dari ${named} seharusnya ditandatangani oleh domain itu. Tanpa tanda tangan tersebut, tidak ada bukti bahwa email ini benar berasal dari sana.`
              : 'Tanpa tanda tangan, keaslian email ini tidak dapat dibuktikan.'}
          </p>
        ),
        message: result,
      };
    })
    .sort((a, b) => RANK[a.tone] - RANK[b.tone]);
}

/** Outer messages that only carry the message the verdict is about. */
function forwarders(
  results: CandidateReport[],
  verdicts: Judgement[],
): CandidateReport[] {
  const judged = verdicts.flatMap((v) => (v.message ? [v.message] : []));
  if (judged.length === 0 || judged.every((r) => r.candidate.depth === 0)) {
    return [];
  }
  return results.filter(
    (r) => r.candidate.depth === 0 && !judged.includes(r),
  );
}

function Verdict({
  tone,
  headline,
  body,
}: {
  tone: Tone;
  headline: string;
  body?: React.ReactNode;
}) {
  return (
    <div className={`${styles.verdict} ${styles[tone]}`}>
      <StatusIcon tone={tone} className={styles.verdictIcon} />
      <div className={styles.verdictText}>
        <p className={styles.headline}>{headline}</p>
        {body}
      </div>
    </div>
  );
}

function formatDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : formatInstant(date);
}

function formatInstant(date: Date): string {
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function MessageFacts({ report }: { report: VerificationReport }) {
  const { summary } = report;
  return (
    <dl className={styles.facts}>
      <Field label="Dari" value={summary.from} />
      <Field label="Kepada" value={summary.to} />
      <Field label="Subjek" value={summary.subject} />
      <Field label="Tanggal" value={formatDate(summary.date)} />
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/* Technical details                                                          */
/* -------------------------------------------------------------------------- */

function CandidateDetails({
  result,
  relevant,
  expectedDomains,
}: {
  result: CandidateReport;
  relevant: boolean;
  expectedDomains?: string[];
}) {
  const { candidate, report } = result;
  const { summary, signatures } = report;

  return (
    <section className={styles.candidate}>
      <p className={styles.candidateLabel}>
        {candidate.label}
        {!relevant && candidate.depth === 0 && (
          <span className={styles.muted}> · email penerus</span>
        )}
      </p>

      <dl className={styles.fields}>
        <Field label="Dari" value={summary.from} />
        <Field label="Kepada" value={summary.to} />
        <Field label="Subjek" value={summary.subject} />
        <Field label="Header Date" value={summary.date} mono />
      </dl>

      {signatures.length === 0 ? (
        <p className={styles.sigLine}>
          <StatusIcon tone="unknown" className={styles.sigIcon} />
          <span>Tidak ada tanda tangan DKIM.</span>
        </p>
      ) : (
        signatures.map((signature, index) => (
          <SignatureDetails
            key={index}
            signature={signature}
            secondary={
              relevant &&
              expectedDomains !== undefined &&
              !inDomains(signature.domain, expectedDomains)
            }
          />
        ))
      )}
    </section>
  );
}

function SignatureDetails({
  signature,
  secondary,
}: {
  signature: SignatureResult;
  /** A signature from another domain on the message that matters. */
  secondary: boolean;
}) {
  const tone: Tone =
    signature.status === 'pass'
      ? 'pass'
      : signature.status === 'fail'
        ? 'fail'
        : 'unknown';

  return (
    <div className={styles.signature}>
      <p className={`${styles.sigLine} ${styles[tone]}`}>
        <StatusIcon tone={tone} className={styles.sigIcon} />
        <span>
          {signature.summary}
          {secondary && (
            <span className={styles.muted}>
              {' '}
              · tanda tangan tambahan, misalnya dari server perantara; tidak
              memengaruhi hasil
            </span>
          )}
        </span>
      </p>

      <dl className={styles.fields}>
        <Field label="Domain penanda tangan (d=)" value={signature.domain} mono />
        <Field label="Selektor (s=)" value={signature.selector} mono />
        <Field label="Algoritma (a=)" value={signature.algorithm} mono />
        <Field
          label="Kanonikalisasi (c=)"
          value={signature.canonicalization}
          mono
        />
        <Field
          label="Panjang kunci"
          value={signature.keyBits ? `${signature.keyBits} bit` : undefined}
        />
        <Field
          label="Ditandatangani (t=)"
          value={signature.signedAt && formatInstant(signature.signedAt)}
        />
        <Field
          label="Berlaku sampai (x=)"
          value={signature.expiresAt && formatInstant(signature.expiresAt)}
        />
        <Field
          label="Hash isi email (bh=)"
          value={
            signature.bodyHashValid === undefined
              ? undefined
              : signature.bodyHashValid
                ? 'cocok'
                : 'tidak cocok'
          }
        />
        <Field
          label="Tanda tangan (b=)"
          value={
            signature.signatureValid === undefined
              ? undefined
              : signature.signatureValid
                ? 'sah'
                : 'tidak sah'
          }
        />
        <Field
          label="Domain pengirim (From)"
          value={signature.fromDomain}
          mono
        />
        <Field
          label="Kesesuaian domain"
          value={
            signature.aligned === undefined
              ? undefined
              : signature.aligned
                ? 'sesuai dengan domain penanda tangan'
                : 'berbeda dari domain penanda tangan'
          }
        />
        <Field
          label="Header yang ditandatangani (h=)"
          value={
            signature.signedHeaders.length > 0
              ? signature.signedHeaders.join(', ')
              : undefined
          }
          mono
        />
        {signature.record && (
          <Field
            label={`DNS ${signature.selector}._domainkey.${signature.domain}`}
            value={signature.record}
            mono
          />
        )}
        <Field label="Kesalahan" value={signature.detail} mono />
      </dl>

      {signature.warnings.map((warning, index) => (
        <p key={index} className={styles.warning}>
          {warning}
        </p>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  if (value === undefined || value === '') return null;
  return (
    <>
      <dt className={styles.term}>{label}</dt>
      <dd className={`${styles.definition} ${mono ? styles.mono : ''}`}>
        {value}
      </dd>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function StatusIcon({ tone, className }: { tone: Tone; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.25" />
      {tone === 'pass' && <path d="m7.75 12.25 2.75 2.75 5.75-6" />}
      {tone === 'fail' && <path d="m9 9 6 6m0-6-6 6" />}
      {tone === 'unknown' && <path d="M12 7.5v5.25M12 16.25v.25" />}
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.75 6.5h16.5v11H3.75z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
