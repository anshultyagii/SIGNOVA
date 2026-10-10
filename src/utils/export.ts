import type { RecordedGestureSequence } from '../types/landmarks';

/**
 * Downloads a JavaScript object or string as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports a recorded gesture sequence as JSON
 */
export function exportSequenceAsJSON(sequence: RecordedGestureSequence): void {
  const content = JSON.stringify(sequence, null, 2);
  const filename = `${sequence.label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
  downloadFile(content, filename, 'application/json');
}

/**
 * Exports a recorded gesture sequence as CSV
 * Rows: frame 0 to frame N
 * Columns: frame_id, timestamp, feature_0 ... feature_1661
 */
export function exportSequenceAsCSV(sequence: RecordedGestureSequence): void {
  if (sequence.frames.length === 0) return;

  const featureCount = sequence.frames[0].featureVector.length;
  const header = ['frame_index', 'timestamp', ...Array.from({ length: featureCount }, (_, i) => `f_${i}`)].join(',');

  const rows = sequence.frames.map((frame, idx) => {
    return [idx, frame.timestamp, ...frame.featureVector].join(',');
  });

  const csvContent = [header, ...rows].join('\n');
  const filename = `${sequence.label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`;
  downloadFile(csvContent, filename, 'text/csv');
}
