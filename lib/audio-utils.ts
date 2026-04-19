export function detectAudioMimeType(data: Uint8Array): string {
  if (data.length >= 12) {
    const riff = String.fromCharCode(data[0], data[1], data[2], data[3]);
    const wave = String.fromCharCode(data[8], data[9], data[10], data[11]);
    if (riff === 'RIFF' && wave === 'WAVE') return 'audio/wav';
  }

  if (data.length >= 3) {
    const id3 = String.fromCharCode(data[0], data[1], data[2]);
    if (id3 === 'ID3') return 'audio/mpeg';
  }

  if (data.length >= 2 && data[0] === 0xff && (data[1] & 0xe0) === 0xe0) {
    return 'audio/mpeg';
  }

  if (data.length >= 4) {
    const magic = String.fromCharCode(data[0], data[1], data[2], data[3]);
    if (magic === 'OggS') return 'audio/ogg';
    if (magic === 'fLaC') return 'audio/flac';
  }

  if (data.length >= 12) {
    const box = String.fromCharCode(data[4], data[5], data[6], data[7]);
    if (box === 'ftyp') return 'audio/mp4';
  }

  return 'application/octet-stream';
}

export function createAudioBlob(data: Uint8Array): Blob {
  return new Blob([data.slice().buffer as ArrayBuffer], { type: detectAudioMimeType(data) });
}
