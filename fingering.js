/*
 * Digitaciones del clarinete sistema Boehm (notas ESCRITAS, clarinete en Sib).
 *
 * Modelo de llaves suficientemente fiel para que cada nota del registro inicial
 * se distinga correctamente de las demás. Cada digitación marca como `true` los
 * agujeros tapados y las llaves pulsadas.
 *
 * Elementos del diagrama (todos booleanos):
 *   reg   -> llave de registro (pulgar izquierdo, parte trasera)
 *   thumb -> agujero del pulgar izquierdo (trasera)
 *   A     -> llave de "La de garganta" (índice izq, lateral superior)
 *   Gs    -> llave de Sol#/Lab de garganta
 *   L1,L2,L3 -> agujeros mano izquierda (índice, corazón, anular)
 *   R1,R2,R3 -> agujeros mano derecha (índice, corazón, anular)
 *   pL_EB    -> llave meñique IZQ: Mi/Si grave
 *   pL_FsCs  -> llave meñique IZQ: Fa#/Do#
 *   pR_FC    -> llave meñique DER: Fa/Do
 *   pR_AbEb  -> llave meñique DER: Lab/Mib (Sol#/Re#)
 *
 * Lógica de registro: las notas del registro clarín (Si4 a Do6) usan la misma
 * digitación que la nota un duodécima por debajo del registro grave, añadiendo
 * la llave de registro. Así B4..C6 derivan de E3..F4 + reg.
 *
 * Referencias: fingers estándar Boehm (French system). Registros según la
 * organización habitual: chalumeau E3–F#4, notas de garganta G4–Bb4,
 * clarín B4–C6. (clarinetfingeringchart.org, tonestro.com)
 */

(function () {
  function F(o) {
    return Object.assign(
      {
        reg: false, thumb: false,
        A: false, Gs: false,
        L1: false, L2: false, L3: false,
        R1: false, R2: false, R3: false,
        pL_EB: false, pL_FsCs: false,
        pR_FC: false, pR_AbEb: false,
      },
      o
    );
  }

  // --- Registro grave (chalumeau) y notas de garganta ---
  const low = {
    // Mi grave: todo tapado + meñique (Mi/Si)
    E3:  F({ thumb: 1, L1: 1, L2: 1, L3: 1, R1: 1, R2: 1, R3: 1, pR_FC: 0, pL_EB: 1 }),
    // Fa: como Mi + llave Fa/Do del meñique derecho
    F3:  F({ thumb: 1, L1: 1, L2: 1, L3: 1, R1: 1, R2: 1, R3: 1, pR_FC: 1 }),
    // Fa#: todo tapado + llave Fa#/Do# del meñique izquierdo
    'F#3': F({ thumb: 1, L1: 1, L2: 1, L3: 1, R1: 1, R2: 1, R3: 1, pL_FsCs: 1 }),
    // Sol: todo tapado, sin meñiques
    G3:  F({ thumb: 1, L1: 1, L2: 1, L3: 1, R1: 1, R2: 1, R3: 1 }),
    // Sol#/Lab: Sol + llave Lab/Mib (meñique derecho)
    'G#3': F({ thumb: 1, L1: 1, L2: 1, L3: 1, R1: 1, R2: 1, R3: 1, pR_AbEb: 1 }),
    // La: se levanta el anular derecho (R3)
    A3:  F({ thumb: 1, L1: 1, L2: 1, L3: 1, R1: 1, R2: 1 }),
    // Sib/La#: se levantan R2 y R3
    'A#3': F({ thumb: 1, L1: 1, L2: 1, L3: 1, R1: 1 }),
    // Si: solo mano izquierda tapada; mano derecha libre
    B3:  F({ thumb: 1, L1: 1, L2: 1, L3: 1 }),
    // Do: se levanta el anular izquierdo (L3)
    C4:  F({ thumb: 1, L1: 1, L2: 1 }),
    // Do#/Reb: se levanta el corazón izquierdo (L2)
    'C#4': F({ thumb: 1, L1: 1, L3: 1 }),
    // Re: solo índice izquierdo tapado
    D4:  F({ thumb: 1, L1: 1 }),
    // Mib/Re#: Re + llave Lab/Mib (meñique derecho)
    'D#4': F({ thumb: 1, L1: 1, pR_AbEb: 1 }),
    // Mi: solo pulgar (agujero trasero)
    E4:  F({ thumb: 1 }),
    // Fa: índice izquierdo tapado, sin pulgar
    F4:  F({ L1: 1 }),
    // Fa#: solo llave... (índice izq con media llave) — simplificado: L1 medio
    'F#4': F({ L1: 1, L2: 1, R1: 1 }),

    // --- Notas de garganta (G4–Bb4) ---
    // Sol de garganta: solo el agujero del pulgar... en realidad ninguno tapado + nada.
    G4:  F({ thumb: 1 }),           // Sol de garganta (pulgar)
    'G#4': F({ thumb: 1, Gs: 1 }),  // Sol#/Lab de garganta
    A4:  F({ thumb: 1, A: 1 }),     // La de garganta (llave A)
    'A#4': F({ thumb: 1, A: 1, Gs: 1 }), // Sib de garganta (A + Ab)
  };

  // Para el registro clarín reutilizamos la base grave + llave de registro.
  // (Si4 ... Do6 derivan de Mi3 ... Fa4 doce notas por debajo.)
  function withRegister(base) {
    const f = F(base);
    f.reg = true;
    f.thumb = true; // el pulgar sigue tapando el agujero trasero
    return f;
  }

  const FINGERINGS = {
    // Chalumeau + garganta
    E3: low.E3, F3: low.F3, 'F#3': low['F#3'], G3: low.G3, 'G#3': low['G#3'],
    A3: low.A3, 'A#3': low['A#3'], B3: low.B3,
    C4: low.C4, 'C#4': low['C#4'], D4: low.D4, 'D#4': low['D#4'], E4: low.E4,
    F4: low.F4, 'F#4': low['F#4'],
    G4: low.G4, 'G#4': low['G#4'], A4: low.A4, 'A#4': low['A#4'],

    // Clarín (registro) — base = nota 12ª por debajo + llave de registro
    B4:  withRegister(low.E3),     // Si4  <- Mi3 + reg
    C5:  withRegister(low.F3),     // Do5  <- Fa3 + reg
    'C#5': withRegister(low['F#3']),
    D5:  withRegister(low.G3),
    'D#5': withRegister(low['G#3']),
    E5:  withRegister(low.A3),
    F5:  withRegister(low['A#3']),
    'F#5': withRegister(low.B3),
    G5:  withRegister(low.C4),
    'G#5': withRegister(low['C#4']),
    A5:  withRegister(low.D4),
    'A#5': withRegister(low['D#4']),
    B5:  withRegister(low.E4),
    C6:  withRegister(low.F4),
  };

  window.FINGERINGS = FINGERINGS;
})();
