/*
 * Datos de notas para clarinete en Sib (notación escrita, clave de Sol).
 *
 * Cada nota define:
 *  - id: identificador único
 *  - latin: nombre en notación latina (Do, Re, Mi, Fa, Sol, La, Si), con alteración
 *  - letter: letra base para dibujar en el pentagrama (C D E F G A B)
 *  - octave: octava científica de la nota ESCRITA (no suena igual, es clarinete en Sib)
 *  - step: índice diatónico absoluto para ordenar y colocar en el pentagrama
 *  - accidental: '', '#' o 'b'
 *  - freq: frecuencia aproximada del SONIDO REAL para el audio de referencia (Hz)
 *  - fingering: estado de las llaves para el diagrama (ver fingering.js)
 *
 * El rango cubre el registro inicial habitual: desde Mi grave (mi3 escrito)
 * hasta Do agudo del registro medio-agudo, que es lo típico del primer año.
 *
 * NOTA sobre el pentagrama: usamos clave de Sol. La línea central (3ª) es Si4.
 * step se calcula como (octava * 7 + índiceLetra), con C=0,D=1,E=2,F=3,G=4,A=5,B=6.
 */

(function () {
  const LETTER_INDEX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

  function stepOf(letter, octave) {
    return octave * 7 + LETTER_INDEX[letter];
  }

  // Definición ordenada de grave a agudo (nota escrita para clarinete).
  // freq = frecuencia del sonido real (un tono mayor por debajo de lo escrito).
  // Para la referencia de audio usamos la frecuencia escrita temperada para que
  // coincida con lo que el alumno ve; es una ayuda, no una afinación de concierto.
  const raw = [
    // letra, octava, latín, alteración
    ['E', 3, 'Mi', ''],
    ['F', 3, 'Fa', ''],
    ['F', 3, 'Fa', '#', 'Fa#'],
    ['G', 3, 'Sol', ''],
    ['G', 3, 'Sol', '#', 'Sol#'],
    ['A', 3, 'La', ''],
    ['A', 3, 'La', '#', 'Sib'],
    ['B', 3, 'Si', ''],
    ['C', 4, 'Do', ''],
    ['C', 4, 'Do', '#', 'Do#'],
    ['D', 4, 'Re', ''],
    ['D', 4, 'Re', '#', 'Mib'],
    ['E', 4, 'Mi', ''],
    ['F', 4, 'Fa', ''],
    ['F', 4, 'Fa', '#', 'Fa#'],
    ['G', 4, 'Sol', ''],
    ['G', 4, 'Sol', '#', 'Sol#'],
    ['A', 4, 'La', ''],
    ['A', 4, 'La', '#', 'Sib'],
    ['B', 4, 'Si', ''],
    ['C', 5, 'Do', ''],
    ['C', 5, 'Do', '#', 'Do#'],
    ['D', 5, 'Re', ''],
    ['D', 5, 'Re', '#', 'Mib'],
    ['E', 5, 'Mi', ''],
    ['F', 5, 'Fa', ''],
    ['G', 5, 'Sol', ''],
    ['A', 5, 'La', ''],
    ['B', 5, 'Si', ''],
    ['C', 6, 'Do', ''],
  ];

  // Frecuencia temperada (escrita) a partir de A4 = 440 Hz.
  function writtenFreq(letter, octave, accidental) {
    const semis = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    let n = semis[letter] + (octave - 4) * 12;
    if (accidental === '#') n += 1;
    if (accidental === 'b') n -= 1;
    // n semitonos respecto a C4; A4 está a n=9
    return 440 * Math.pow(2, (n - 9) / 12);
  }

  const NOTES = raw.map((r) => {
    const [letter, octave, latin, accidental = '', latinName] = r;
    const displayLatin = latinName || latin;
    return {
      id: `${letter}${accidental}${octave}`,
      letter,
      octave,
      accidental,
      latin: displayLatin,
      latinBase: latin,
      step: stepOf(letter, octave),
      freq: writtenFreq(letter, octave, accidental),
      fingering: window.FINGERINGS[`${letter}${accidental}${octave}`] || null,
    };
  });

  // Presets de rango (por id de nota).
  const PRESETS = {
    beginner: { from: 'G3', to: 'C5' },   // Sol grave a Do agudo
    first: { from: 'E3', to: 'G5' },      // Primer año típico
    full: { from: 'E3', to: 'C6' },       // Rango completo incluido
  };

  window.NOTE_DATA = { NOTES, PRESETS };
})();
