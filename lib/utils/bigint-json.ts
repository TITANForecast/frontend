/**
 * Helper to serialize BigInt fields to strings for JSON responses
 * This is needed because JavaScript's JSON.stringify() doesn't support BigInt natively
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
