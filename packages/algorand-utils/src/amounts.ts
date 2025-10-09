

/**
 * Convierte el input del usuario (string o number) a la unidad base del asset.
 * - Para ALGO: decimals = 6
 * - Para ASA: tomar decimals del asset metadata
 */
export function parseUserAmountToBaseUnits(userInput: string | number, decimals = 6): bigint {
  const inputStr = typeof userInput === 'number' ? userInput.toString() : userInput.trim();
  if (inputStr === '' || isNaN(Number(inputStr))) {
      console.error(`Invalid amount input: '${userInput}'`);
      return BigInt(0);
  }
  
  const parts = inputStr.split('.');
  const whole = BigInt(parts[0] === '' ? '0' : parts[0]);
  let fraction = '0';

  if (parts.length > 1 && decimals > 0) {
    // Tomar solo la cantidad de decimales permitidos por el activo
    const fractionPart = parts[1].slice(0, decimals);
    // Rellenar con ceros a la derecha si el usuario ingresó menos decimales
    fraction = fractionPart.padEnd(decimals, '0');
  }
  
  const wholeScaled = whole * (BigInt(10) ** BigInt(decimals));
  const fractionScaled = BigInt(fraction);

  return wholeScaled + fractionScaled;
}
