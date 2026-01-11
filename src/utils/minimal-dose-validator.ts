/**
 * Minimal Dose Validator
 *
 * Validates if a proof unit meets the minimal dose requirement for a habit.
 * Parses unit strings like "30 min", "5 km", "10 pages" and compares values.
 */

export interface ParsedUnit {
  value: number;
  unit: string;
  original: string;
}

export interface ValidationResult {
  isValid: boolean;
  isMinimalDose: boolean;
  reason: string;
  proofValue?: number;
  requiredValue?: number;
}

/**
 * Parse a unit string into value and unit type
 * Examples: "30 min" -> {value: 30, unit: "min"}
 *           "5 km" -> {value: 5, unit: "km"}
 *           "10 pages" -> {value: 10, unit: "pages"}
 */
export function parseUnit(unitString: string): ParsedUnit | null {
  if (!unitString || typeof unitString !== 'string') {
    return null;
  }

  const trimmed = unitString.trim();

  // Match patterns like "30 min", "5.5 km", "10pages", "15 minutes"
  const regex = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/;
  const match = trimmed.match(regex);

  if (!match) {
    return null;
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  // Normalize common unit variations
  const normalizedUnit = normalizeUnit(unit);

  return {
    value,
    unit: normalizedUnit,
    original: trimmed
  };
}

/**
 * Normalize unit variations to consistent format
 * Examples: "minutes" -> "min", "kilometers" -> "km"
 */
function normalizeUnit(unit: string): string {
  const unitMap: { [key: string]: string } = {
    'minutes': 'min',
    'minute': 'min',
    'mins': 'min',
    'hours': 'hr',
    'hour': 'hr',
    'hrs': 'hr',
    'kilometers': 'km',
    'kilometer': 'km',
    'kms': 'km',
    'miles': 'mi',
    'mile': 'mi',
    'meters': 'm',
    'meter': 'm',
    'pages': 'page',
    'reps': 'rep',
    'repetitions': 'rep',
    'repetition': 'rep',
    'sets': 'set',
    'seconds': 'sec',
    'second': 'sec',
    'secs': 'sec'
  };

  return unitMap[unit.toLowerCase()] || unit.toLowerCase();
}

/**
 * Validate if a proof unit meets the minimal dose requirement
 * @param proofUnit - The proof unit string (e.g., "30 min")
 * @param minimalDoseUnit - The minimal dose requirement (e.g., "20 min")
 * @returns ValidationResult with isValid and isMinimalDose flags
 */
export function validateMinimalDose(proofUnit: string, minimalDoseUnit: string): ValidationResult {
  // Parse both units
  const proof = parseUnit(proofUnit);
  const minimal = parseUnit(minimalDoseUnit);

  // If either parsing failed, can't validate
  if (!proof) {
    return {
      isValid: false,
      isMinimalDose: false,
      reason: `Invalid proof unit format: "${proofUnit}". Expected format like "30 min" or "5 km".`
    };
  }

  if (!minimal) {
    return {
      isValid: false,
      isMinimalDose: false,
      reason: `Invalid minimal dose format: "${minimalDoseUnit}". Expected format like "20 min" or "3 km".`
    };
  }

  // Check if units match
  if (proof.unit !== minimal.unit) {
    return {
      isValid: false,
      isMinimalDose: false,
      reason: `Unit mismatch: proof is in "${proof.unit}" but minimal dose is in "${minimal.unit}".`,
      proofValue: proof.value,
      requiredValue: minimal.value
    };
  }

  // Compare values
  const meetsMinimum = proof.value >= minimal.value;
  const isExactly = proof.value === minimal.value;

  if (meetsMinimum && isExactly) {
    return {
      isValid: true,
      isMinimalDose: true,
      reason: `Proof matches minimal dose exactly: ${proof.value} ${proof.unit}`,
      proofValue: proof.value,
      requiredValue: minimal.value
    };
  } else if (meetsMinimum) {
    return {
      isValid: true,
      isMinimalDose: false,
      reason: `Proof exceeds minimal dose: ${proof.value} ${proof.unit} > ${minimal.value} ${minimal.unit}`,
      proofValue: proof.value,
      requiredValue: minimal.value
    };
  } else {
    return {
      isValid: false,
      isMinimalDose: false,
      reason: `Proof does not meet minimal dose: ${proof.value} ${proof.unit} < ${minimal.value} ${minimal.unit}`,
      proofValue: proof.value,
      requiredValue: minimal.value
    };
  }
}

/**
 * Check if a proof meets or exceeds the minimal dose
 * Simpler version that just returns true/false
 */
export function meetsMinimalDose(proofUnit: string, minimalDoseUnit: string): boolean {
  const result = validateMinimalDose(proofUnit, minimalDoseUnit);
  return result.isValid && (result.isMinimalDose || (result.proofValue !== undefined && result.requiredValue !== undefined && result.proofValue >= result.requiredValue));
}

/**
 * Determine if a proof is exactly the minimal dose
 */
export function isExactlyMinimalDose(proofUnit: string, minimalDoseUnit: string): boolean {
  const result = validateMinimalDose(proofUnit, minimalDoseUnit);
  return result.isValid && result.isMinimalDose;
}
