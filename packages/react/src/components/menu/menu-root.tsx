import { useAnimationState } from "@chakra-ui/hooks"
import { MaybeRenderProp, pick, runIfFn } from "@chakra-ui/utils"
import { SlotRecipeProps, useSlotRecipe } from "../../styled-system"
import {
  RenderStrategyProps,
  RenderStrategyProvider,
  useRenderStrategy,
} from "../render-strategy"
import {
  AnimationStateProvider,
  MenuProvider,
  MenuStylesProvider,
} from "./menu-context"
import { UseMenuProps, useMenu } from "./use-menu"

export interface MenuRootProps
  extends UseMenuProps,
    SlotRecipeProps<"Menu">,
    Omit<RenderStrategyProps, "visible"> {
  children: MaybeRenderProp<any>
}

/**
 * Menu provides context, state, and focus management
 * to its sub-components. It doesn't render any DOM node.
 *
 * @see Docs https://chakra-ui.com/docs/components/menu
 */
export const MenuRoot: React.FC<MenuRootProps> = (props) => {
  const recipe = useSlotRecipe("Menu")

  const [variantProps, localProps] = recipe.splitVariantProps(props)
  const styles = recipe(variantProps)

  const { isLazy, lazyBehavior = "unmount", ...restProps } = localProps
  const api = useMenu(restProps)

  const menuState = pick(api, ["isOpen", "onClose", "forceUpdate"])

  const animationState = useAnimationState({
    isOpen: api.isOpen,
    ref: api.contentRef,
  })

  const renderApi = useRenderStrategy({
    isLazy,
    lazyBehavior,
    visible: animationState.present,
  })

  return (
    <MenuProvider value={api}>
      <RenderStrategyProvider value={renderApi}>
        <MenuStylesProvider value={styles}>
          <AnimationStateProvider value={animationState}>
            {runIfFn(props.children, menuState)}
          </AnimationStateProvider>
        </MenuStylesProvider>
      </RenderStrategyProvider>
    </MenuProvider>
  )
}

MenuRoot.displayName = "MenuRoot"
