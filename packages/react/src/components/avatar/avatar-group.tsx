import { cx } from "@chakra-ui/utils"
import {
  HTMLChakraProps,
  RecipePropsProvider,
  SlotRecipeProps,
  chakra,
  forwardRef,
  useSlotRecipe,
} from "../../styled-system"

export interface AvatarGroupProps
  extends HTMLChakraProps<"div">,
    SlotRecipeProps<"Avatar"> {}

/**
 * AvatarGroup displays a number of avatars grouped together in a stack.
 */
export const AvatarGroup = forwardRef<AvatarGroupProps, "div">(
  function AvatarGroup(props, ref) {
    const recipe = useSlotRecipe("Avatar")
    const [variantProps, localProps] = recipe.splitVariantProps(props)
    const styles = recipe(variantProps)

    return (
      <RecipePropsProvider value={variantProps}>
        <chakra.div
          ref={ref}
          role="group"
          {...localProps}
          css={[styles.group, localProps.css]}
          className={cx("chakra-avatar__group", props.className)}
        />
      </RecipePropsProvider>
    )
  },
)

AvatarGroup.displayName = "AvatarGroup"
