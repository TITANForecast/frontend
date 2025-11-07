/**
 * Helper to serialize BigInt and Decimal fields for JSON responses
 * This is needed because JavaScript's JSON.stringify() doesn't support BigInt natively
 * and Prisma Decimal objects need to be converted to numbers
 */

export function serializeBigInt<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return obj.toString();
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeBigInt(item));
  }

  if (typeof obj === "object") {
    // Check if this is a Decimal object (Prisma Decimal or Decimal.js)
    // These objects have properties: s (sign), e (exponent), d (digits array)
    if ("d" in obj && "e" in obj && "s" in obj && Array.isArray((obj as any).d)) {
      try {
        const decimal = obj as any;
        
        // Simple and robust approach: construct the number from Decimal.js format
        // Format: {s: ±1, e: exponent, d: [digit, digit, ...]}
        // Value = s * (d joined as integer) * 10^(e - d.length + 1)
        
        const sign = decimal.s === -1 ? "-" : "";
        const digits = (decimal.d as number[]);
        const exponent = typeof decimal.e === "number" ? decimal.e : 0;
        
        if (digits.length === 0) return 0;
        
        // Join digits to form the coefficient
        // Note: digits[0] contains the leading digits, rest are 7-digit chunks
        let coefficient = digits[0].toString();
        for (let i = 1; i < digits.length; i++) {
          // Pad subsequent chunks to 7 digits (Decimal.js uses base 1e7)
          coefficient += digits[i].toString().padStart(7, '0');
        }
        
        // The exponent tells us where the decimal point is
        // e is the exponent of the first digit (0-indexed from start)
        // So we need to place decimal point after (e + 1) digits
        const decimalPosition = exponent + 1;
        
        let numStr: string;
        if (decimalPosition <= 0) {
          // Number is less than 1, like 0.00123
          numStr = "0." + "0".repeat(-decimalPosition) + coefficient;
        } else if (decimalPosition >= coefficient.length) {
          // Number is a whole number or has trailing zeros
          numStr = coefficient + "0".repeat(decimalPosition - coefficient.length);
        } else {
          // Decimal point is in the middle of coefficient
          numStr = coefficient.slice(0, decimalPosition) + "." + coefficient.slice(decimalPosition);
        }
        
        return parseFloat(sign + numStr);
      } catch (error) {
        console.error("Error parsing Decimal object:", error, obj);
        return 0;
      }
    }

    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "bigint") {
        serialized[key] = value.toString();
      } else if (value instanceof Date) {
        serialized[key] = value.toISOString();
      } else if (value && typeof value === "object") {
        serialized[key] = serializeBigInt(value);
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  }

  return obj;
}

/**
 * Create a JSON response with BigInt serialization
 */
export function jsonResponse(data: any, init?: ResponseInit) {
  return Response.json(serializeBigInt(data), init);
}
