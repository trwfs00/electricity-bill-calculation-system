import type { UseFormReturnType } from "@mantine/form"
import { get } from "lodash"

export const NumberInputUtil = {
  valueWithZero(value: number | undefined | null) {
    return value || value === 0 ? value : ""
  },
  onBlurWithZero<T extends Record<string, unknown>>(
    form: UseFormReturnType<T>,
    fieldName: string
  ) {
    return () => {
      const { onBlur } = form.getInputProps(fieldName)
      const blurResult = onBlur()
      const values = form.getValues()
      if (typeof get(values, fieldName) === "string") {
        ;(form.setFieldValue as (field: string, value: unknown) => void)(
          fieldName,
          undefined
        )
      }
      return blurResult
    }
  },
}
