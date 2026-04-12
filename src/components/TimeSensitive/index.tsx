import React from 'react';
import Admonition from '@theme/Admonition';

function getTotalMonths(writtenDate: string): number {
  const written = new Date(writtenDate);
  const now = new Date();

  let years = now.getFullYear() - written.getFullYear();
  let months = now.getMonth() - written.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  return years * 12 + months;
}

function getTimeAgo(writtenDate: string): string {
  const written = new Date(writtenDate);
  const now = new Date();

  let years = now.getFullYear() - written.getFullYear();
  let months = now.getMonth() - written.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} tahun`);
  }
  if (months > 0) {
    parts.push(`${months} bulan`);
  }

  return parts.length > 0 ? parts.join(' ') : 'kurang dari sebulan';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface TimeSensitiveProps {
  written: string;
}

export default function TimeSensitive({ written }: TimeSensitiveProps): React.ReactNode {
  if (getTotalMonths(written) <= 2) {
    return null;
  }

  const timeAgo = getTimeAgo(written);
  const formattedDate = formatDate(written);

  return (
    <Admonition type="caution" title="Informasi Mungkin Sudah Tidak Akurat">
      Artikel ini ditulis pada <strong>{formattedDate}</strong> ({timeAgo} yang
      lalu). Situasi saat ini mungkin sudah berbeda dari saat artikel ini
      ditulis.
    </Admonition>
  );
}
