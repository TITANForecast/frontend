export const formatValue = (value: number): string =>
  Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumSignificantDigits: 3,
    notation: "compact",
  }).format(value);

export const formatThousands = (value: number): string =>
  Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 3,
    notation: "compact",
  }).format(value);

// Format currency with commas (e.g., $1,753,394.00)
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "$0.00";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format number with commas (e.g., 1,753,394.00)
export const formatNumber = (
  value: number | null | undefined,
  decimals: number = 2
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0" + (decimals > 0 ? "." + "0".repeat(decimals) : "");
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const getCssVariable = (variable: string): string => {
  if (typeof window === "undefined") {
    return "";
  }
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
};

const adjustHexOpacity = (hexColor: string, opacity: number): string => {
  // Remove the '#' if it exists
  hexColor = hexColor.replace("#", "");

  // Convert hex to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Return RGBA string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const adjustHSLOpacity = (hslColor: string, opacity: number): string => {
  // Convert HSL to HSLA
  return hslColor.replace("hsl(", "hsla(").replace(")", `, ${opacity})`);
};

const adjustOKLCHOpacity = (oklchColor: string, opacity: number): string => {
  // Add alpha value to OKLCH color
  return oklchColor.replace(
    /oklch\((.*?)\)/,
    (match, p1) => `oklch(${p1} / ${opacity})`
  );
};

export const adjustColorOpacity = (color: string, opacity: number): string => {
  if (color.startsWith("#")) {
    return adjustHexOpacity(color, opacity);
  } else if (color.startsWith("hsl")) {
    return adjustHSLOpacity(color, opacity);
  } else if (color.startsWith("oklch")) {
    return adjustOKLCHOpacity(color, opacity);
  } else {
    return "";
  }
};

export const oklchToRGBA = (oklchColor: string): string => {
  // Create a temporary div to use for color conversion
  const tempDiv = document.createElement("div");
  tempDiv.style.color = oklchColor;
  document.body.appendChild(tempDiv);

  // Get the computed style and convert to RGB
  const computedColor = window.getComputedStyle(tempDiv).color;
  document.body.removeChild(tempDiv);

  return computedColor;
};
