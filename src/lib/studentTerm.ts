import { GradeStandard, SchoolSettings } from '../types';

export function getStudentTerm(settings?: Partial<SchoolSettings> | null): string {
  if (settings?.studentTerm && (settings.studentTerm || '').trim().length > 0) {
    return (settings.studentTerm || '').trim();
  }
  return 'Murid';
}

export function getStudentTermLower(settings?: Partial<SchoolSettings> | null): string {
  return getStudentTerm(settings).toLowerCase();
}

export function getGradePredicateInfo(
  score: number,
  gradeStandards?: GradeStandard[],
  maxScale: number = 100
): { predicate: string; letter: string; description: string; fullText: string } {
  if (gradeStandards && gradeStandards.length > 0) {
    const sorted = [...gradeStandards].sort((a, b) => (Number(b.minScore) || 0) - (Number(a.minScore) || 0));
    
    const maxStandardMinScore = Math.max(...sorted.map((s) => Number(s.minScore) || 0));
    const effectiveScore = (maxScale === 10 && maxStandardMinScore > 10) ? score * 10 : score;

    const matched = sorted.find((st) => effectiveScore >= (Number(st.minScore) || 0));
    if (matched) {
      const pred = matched.predicate || '';
      const letter = matched.letter ? `(${matched.letter})` : '';
      const fullText = pred && letter ? `${pred} ${letter}` : pred || matched.letter || '-';
      return {
        predicate: matched.predicate || '',
        letter: matched.letter || '',
        description: matched.description || '',
        fullText,
      };
    }
  }

  let pred = 'Jayyid Jiddan';
  let letter = 'A';
  const normScore = maxScale === 10 ? score * 10 : score;

  if (normScore >= 90) {
    pred = 'Mumtaz';
    letter = 'A+';
  } else if (normScore >= 80) {
    pred = 'Jayyid Jiddan';
    letter = 'A';
  } else if (normScore >= 70) {
    pred = 'Jayyid';
    letter = 'B+';
  } else if (normScore >= 60) {
    pred = 'Maqbul';
    letter = 'B';
  } else {
    pred = 'Rasib / Mengulang';
    letter = 'C';
  }

  return {
    predicate: pred,
    letter,
    description: '',
    fullText: `${pred} (${letter})`,
  };
}

