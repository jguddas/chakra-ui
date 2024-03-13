import { cx } from "@chakra-ui/utils"
import { forwardRef } from "react"
import {
  HTMLChakraProps,
  SlotRecipeProps,
  chakra,
  useSlotRecipe,
} from "../../styled-system"
import { FieldContextProvider, FieldStylesProvider } from "./field-context"
import { splitFieldProps } from "./field-props"
import { FieldContext } from "./types"
import { useFieldProvider } from "./use-field-provider"

export interface FieldRootProps
  extends HTMLChakraProps<"div">,
    SlotRecipeProps<"Field">,
    FieldContext {}

/**
 * FormControl provides context such as
 * `isInvalid`, `isDisabled`, and `isRequired` to form elements.
 *
 * This is commonly used in form elements such as `input`,
 * `select`, `textarea`, etc.
 *
 * @see Docs https://chakra-ui.com/docs/components/form-control
 */
export const FieldRoot = forwardRef<HTMLDivElement, FieldRootProps>(
  function FieldRoot(props, ref) {
    const recipe = useSlotRecipe("Field", props.recipe)
    const [variantProps, localProps] = recipe.splitVariantProps(props)
    const styles = recipe(variantProps)

    const [formControlProps, rootProps] = splitFieldProps(localProps)
    const api = useFieldProvider(formControlProps)

    return (
      <FieldContextProvider value={api}>
        <FieldStylesProvider value={styles}>
          <chakra.div
            {...api.getRootProps(rootProps, ref)}
            className={cx("chakra-form-control", props.className)}
            css={[styles.root, props.css]}
          />
        </FieldStylesProvider>
      </FieldContextProvider>
    )
  },
)

FieldRoot.displayName = "FormControl"
