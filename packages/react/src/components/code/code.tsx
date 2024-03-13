import { cx } from "@chakra-ui/utils"
import { forwardRef } from "react"
import {
  HTMLChakraProps,
  RecipeProps,
  chakra,
  useRecipe,
} from "../../styled-system"

export interface CodeProps
  extends HTMLChakraProps<"code">,
    RecipeProps<"Code"> {}

/**
 * React component to render inline code snippets.
 *
 * @see Docs https://chakra-ui.com/code
 */
export const Code = forwardRef<HTMLElement, CodeProps>(
  function Code(props, ref) {
    const recipe = useRecipe("Code", props.recipe)
    const [variantProps, localProps] = recipe.splitVariantProps(props)
    const styles = recipe(variantProps)

    return (
      <chakra.code
        ref={ref}
        {...localProps}
        className={cx("chakra-code", localProps.className)}
        css={[styles, props.css]}
      />
    )
  },
)

Code.displayName = "Code"
