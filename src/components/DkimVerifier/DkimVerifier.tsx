import React, { useCallback, useRef, useState } from 'react';
import styles from './DkimVerifier.module.css';
import {
  bytesToBinaryString,
  collectMessages,
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
  | { phase: 'working'; filename: string }
  | { phase: 'done'; filename: string; results: CandidateReport[] }
  | { phase: 'error'; message: string };

export interface DkimVerifierProps {
  /**
   * Domains expected to have signed the message. When set, a signature from
   * another domain is reported as not matching the expectation.
   */
  expectedDomains?: string[];
}

export default function DkimVerifier({
  expectedDomains,
}: DkimVerifierProps): React.ReactNode {
  const [state, setState] = useState<State>({ phase: 'idle' });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setState({ phase: 'working', filename: file.name });
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const source = bytesToBinaryString(bytes);
      const candidates = collectMessages(source);
      const results: CandidateReport[] = [];
      for (const candidate of candidates) {
        results.push({ candidate, report: await verifyMessage(candidate.source) });
      }
      setState({ phase: 'done', filename: file.name, results });
    } catch (error) {
      setState({
        phase: 'error',
        message:
          error instanceof Error ? error.message : 'Berkas gagal diproses.',
      });
    }
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className={styles.verifier}>
      <div
        className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".eml,message/rfc822,text/plain"
          className={styles.fileInput}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <strong>Letakkan berkas .eml di sini</strong>
        <span className={styles.hint}>atau klik untuk memilih berkas</span>
      </div>

      {state.phase === 'working' && (
        <p className={styles.status}>Memeriksa {state.filename}…</p>
      )}

      {state.phase === 'error' && (
        <p className={`${styles.status} ${styles.statusError}`}>
          {state.message}
        </p>
      )}

      {state.phase === 'done' &&
        state.results.map(({ candidate, report }, index) => (
          <MessageCard
            key={index}
            candidate={candidate}
            report={report}
            expectedDomains={expectedDomains}
          />
        ))}
    </div>
  );
}

function MessageCard({
  candidate,
  report,
  expectedDomains,
}: {
  candidate: MessageCandidate;
  report: VerificationReport;
  expectedDomains?: string[];
}) {
  const { summary, signatures } = report;

  return (
    <section className={styles.message}>
      <h4 className={styles.messageTitle}>{candidate.label}</h4>

      <dl className={styles.summary}>
        <Field label="Dari" value={summary.from} />
        <Field label="Kepada" value={summary.to} />
        <Field label="Subjek" value={summary.subject} />
        <Field label="Tanggal" value={summary.date} />
      </dl>

      {signatures.length === 0 ? (
        <p className={`${styles.verdict} ${styles.verdictFail}`}>
          Pesan ini tidak memiliki tanda tangan DKIM sama sekali, sehingga
          keasliannya tidak dapat dibuktikan.
        </p>
      ) : (
        signatures.map((signature, index) => (
          <SignatureCard
            key={index}
            signature={signature}
            expectedDomains={expectedDomains}
          />
        ))
      )}
    </section>
  );
}

function SignatureCard({
  signature,
  expectedDomains,
}: {
  signature: SignatureResult;
  expectedDomains?: string[];
}) {
  const verdictClass =
    signature.status === 'pass'
      ? styles.verdictPass
      : signature.status === 'fail'
        ? styles.verdictFail
        : styles.verdictError;

  const expectationFailed =
    expectedDomains !== undefined &&
    signature.domain !== undefined &&
    !expectedDomains.some(
      (expected) =>
        signature.domain === expected ||
        signature.domain?.endsWith('.' + expected),
    );

  return (
    <div className={styles.signature}>
      <p className={`${styles.verdict} ${verdictClass}`}>
        <span className={styles.verdictIcon} aria-hidden="true">
          {signature.status === 'pass' ? '✓' : signature.status === 'fail' ? '✗' : '!'}
        </span>
        {signature.summary}
      </p>

      <dl className={styles.summary}>
        <Field label="Domain penanda tangan (d=)" value={signature.domain} mono />
        <Field label="Selektor (s=)" value={signature.selector} mono />
        <Field label="Algoritma" value={signature.algorithm} mono />
        <Field
          label="Kanonikalisasi"
          value={signature.canonicalization}
          mono
        />
        <Field
          label="Panjang kunci"
          value={signature.keyBits ? `${signature.keyBits} bit` : undefined}
        />
        <Field
          label="Ditandatangani pada"
          value={signature.signedAt?.toLocaleString('id-ID')}
        />
        <Field
          label="Berlaku sampai"
          value={signature.expiresAt?.toLocaleString('id-ID')}
        />
        <Field
          label="Hash badan email"
          value={
            signature.bodyHashValid === undefined
              ? undefined
              : signature.bodyHashValid
                ? 'cocok'
                : 'tidak cocok'
          }
        />
        <Field
          label="Tanda tangan kriptografis"
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
                : 'tidak sesuai dengan domain penanda tangan'
          }
        />
      </dl>

      {signature.status === 'pass' && signature.aligned === false && (
        <p className={styles.warning}>
          Tanda tangan sah, tetapi milik domain{' '}
          <code>{signature.domain}</code> yang berbeda dari domain pengirim{' '}
          <code>{signature.fromDomain}</code>. Yang terbukti hanyalah bahwa{' '}
          <code>{signature.domain}</code> pernah menandatangani pesan ini.
        </p>
      )}

      {expectationFailed && (
        <p className={styles.warning}>
          Domain penanda tangan bukan{' '}
          {expectedDomains!.map((domain, index) => (
            <React.Fragment key={domain}>
              {index > 0 && ' atau '}
              <code>{domain}</code>
            </React.Fragment>
          ))}
          .
        </p>
      )}

      {signature.warnings.map((warning, index) => (
        <p key={index} className={styles.warning}>
          {warning}
        </p>
      ))}

      {signature.signedHeaders.length > 0 && (
        <details className={styles.details}>
          <summary>Header yang ditandatangani ({signature.signedHeaders.length})</summary>
          <p className={styles.mono}>{signature.signedHeaders.join(', ')}</p>
        </details>
      )}

      {signature.record && (
        <details className={styles.details}>
          <summary>Record DNS kunci publik</summary>
          <p className={styles.mono}>
            {signature.selector}._domainkey.{signature.domain} IN TXT
          </p>
          <p className={`${styles.mono} ${styles.record}`}>{signature.record}</p>
        </details>
      )}
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
