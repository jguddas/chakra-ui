import { SystemProps } from "@chakra-ui/styled-system"
import { forwardRef, HTMLChakraProps } from "../system"
import { cx } from "@chakra-ui/utils/cx"
import { MenuCommand } from "./menu-command"
import { MenuIcon } from "./menu-icon"
import { StyledMenuItem } from "./styled-menu-item"
import { useMenuItem, UseMenuItemProps } from "./use-menu"

export interface StyledMenuItemProps extends HTMLChakraProps<"button"> {}

interface MenuItemOptions
  extends Pick<UseMenuItemProps, "disabled" | "focusable" | "closeOnSelect"> {
  /**
   * The icon to render before the menu item's label.
   * @type React.ReactElement
   */
  icon?: React.ReactElement
  /**
   * The spacing between the icon and menu item's label.
   * @type SystemProps["mr"]
   */
  iconSpacing?: SystemProps["mr"]
  /**
   * Right-aligned label text content, useful for displaying hotkeys.
   */
  command?: string
  /**
   * The spacing between the command and menu item's label.
   * @type SystemProps["ml"]
   */
  commandSpacing?: SystemProps["ml"]
}

type HTMLAttributes = React.HTMLAttributes<HTMLElement>

/**
 * Use prop `disabled` instead
 */
type disabledProps = "disabled" | "aria-disabled"

export interface MenuItemProps
  extends Omit<HTMLChakraProps<"button">, disabledProps>,
    MenuItemOptions {}

export const MenuItem = forwardRef<MenuItemProps, "button">((props, ref) => {
  const {
    icon,
    iconSpacing = "0.75rem",
    command,
    commandSpacing = "0.75rem",
    children,
    ...rest
  } = props

  const menuitemProps = useMenuItem(rest, ref) as HTMLAttributes

  const shouldWrap = icon || command

  const _children = shouldWrap ? (
    <span style={{ pointerEvents: "none", flex: 1 }}>{children}</span>
  ) : (
    children
  )

  return (
    <StyledMenuItem
      {...menuitemProps}
      className={cx("chakra-menu__menuitem", menuitemProps.className)}
    >
      {icon && (
        <MenuIcon fontSize="0.8em" marginEnd={iconSpacing}>
          {icon}
        </MenuIcon>
      )}
      {_children}
      {command && (
        <MenuCommand marginStart={commandSpacing}>{command}</MenuCommand>
      )}
    </StyledMenuItem>
  )
})

MenuItem.displayName = "MenuItem"
