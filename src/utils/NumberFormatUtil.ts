export const NumberFormatUtil = {
  /**
   * Format number with commas and minimum decimal places
   * @param value - Number to format
   * @param minDecimals - Minimum decimal places (default: 2)
   * @param maxDecimals - Maximum decimal places (default: 4)
   * @returns Formatted string with commas and proper decimal places
   */
  toCommaWithMinDecimal(
    value: number,
    minDecimals: number = 2,
    maxDecimals: number = 4
  ): string {
    if (isNaN(value) || !isFinite(value)) {
      return "0"
    }

    // Convert to string with proper decimal places
    const formatted = value.toLocaleString("en-US", {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    })

    return formatted
  },

  /**
   * Format number as percentage with minimum decimal places
   * @param value - Number to format (0-1 for percentage)
   * @param minDecimals - Minimum decimal places (default: 0)
   * @param maxDecimals - Maximum decimal places (default: 0)
   * @returns Formatted percentage string
   */
  toPercentage(
    value: number,
    minDecimals: number = 0,
    maxDecimals: number = 0
  ): string {
    const percentage = value * 100
    return (
      this.toCommaWithMinDecimal(percentage, minDecimals, maxDecimals) + "%"
    )
  },

  /**
   * Format number with Thai Baht currency
   * @param value - Number to format
   * @param minDecimals - Minimum decimal places (default: 2)
   * @param maxDecimals - Maximum decimal places (default: 2)
   * @returns Formatted string with "บาท" suffix
   */
  toBaht(
    value: number,
    minDecimals: number = 2,
    maxDecimals: number = 2
  ): string {
    return this.toCommaWithMinDecimal(value, minDecimals, maxDecimals) + " บาท"
  },

  /**
   * Format number with per unit suffix
   * @param value - Number to format
   * @param minDecimals - Minimum decimal places (default: 4)
   * @param maxDecimals - Maximum decimal places (default: 4)
   * @returns Formatted string with "บาท/หน่วย" suffix
   */
  toBahtPerUnit(
    value: number,
    minDecimals: number = 4,
    maxDecimals: number = 4
  ): string {
    return (
      this.toCommaWithMinDecimal(value, minDecimals, maxDecimals) + " บาท/หน่วย"
    )
  },
}
