import { useDisclosure } from "@chakra-ui/hooks/use-disclosure"
import { useEventListener } from "@chakra-ui/hooks/use-event-listener"
import { mergeRefs } from "@chakra-ui/hooks/use-merge-refs"
import { callAllHandlers } from "@chakra-ui/utils/call-all"
import { PropGetter } from "@chakra-ui/utils/prop-types"
import { getScrollParent } from "@chakra-ui/utils/scroll-parent"
import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  type RefObject,
} from "react"
import { UsePopperProps, popperCSSVars, usePopper } from "../popper"
import { useTheme } from "../system"

export interface UseTooltipProps
  extends Pick<
    UsePopperProps,
    | "modifiers"
    | "gutter"
    | "offset"
    | "arrowPadding"
    | "direction"
    | "placement"
  > {
  /**
   * Delay (in ms) before showing the tooltip
   * @default 0ms
   */
  openDelay?: number
  /**
   * Delay (in ms) before hiding the tooltip
   * @default 0ms
   */
  closeDelay?: number
  /**
   * If `true`, the tooltip will hide on click
   * @default true
   */
  closeOnClick?: boolean
  /**
   * If `true`, the tooltip will hide while the pointer is down
   * @default true
   */
  closeOnPointerDown?: boolean
  /**
   * If `true`, the tooltip will hide on pressing Esc key
   * @default true
   */
  closeOnEsc?: boolean
  /**
   * Callback to run when the tooltip shows
   */
  onOpen?(): void
  /**
   * Callback to run when the tooltip hides
   */
  onClose?(): void
  /**
   * Custom `id` to use in place of `uuid`
   */
  id?: string
  /**
   * If `true`, the tooltip will be shown (in controlled mode)
   * @default false
   */
  open?: boolean
  /**
   * If `true`, the tooltip will be initially shown
   * @default false
   */
  defaultOpen?: boolean
  /**
   * @default false
   */
  disabled?: boolean
  /**
   * @default false
   */
  closeOnScroll?: boolean
  /**
   * @default 10
   */
  arrowSize?: number
  arrowShadowColor?: string
}

const getDoc = (ref: React.RefObject<Element | null>) =>
  ref.current?.ownerDocument || document

const getWin = (ref: React.RefObject<Element | null>) =>
  ref.current?.ownerDocument?.defaultView || window

export function useTooltip(props: Partial<UseTooltipProps> = {}) {
  const theme = useTheme()

  const {
    openDelay = 0,
    closeDelay = 0,
    closeOnClick = true,
    closeOnScroll,
    closeOnPointerDown,
    closeOnEsc = true,
    onOpen: onOpenProp,
    onClose: onCloseProp,
    placement,
    id,
    open: openProp,
    defaultOpen,
    arrowSize = 10,
    arrowShadowColor,
    arrowPadding,
    modifiers,
    disabled,
    gutter,
    offset,
    direction = theme.direction,
  } = props

  const { open, onOpen, onClose } = useDisclosure({
    open: openProp,
    defaultOpen,
    onOpen: onOpenProp,
    onClose: onCloseProp,
  })

  const { referenceRef, getPopperProps, getArrowInnerProps, getArrowProps } =
    usePopper({
      enabled: open,
      placement,
      arrowPadding,
      modifiers,
      gutter,
      offset,
      direction,
    })

  const uuid = useId()
  const uid = id ?? uuid
  const tooltipId = `tooltip-${uid}`

  const ref = useRef<HTMLElement>(null)

  const enterTimeout = useRef<number>()
  const clearEnterTimeout = useCallback(() => {
    if (enterTimeout.current) {
      clearTimeout(enterTimeout.current)
      enterTimeout.current = undefined
    }
  }, [])

  const exitTimeout = useRef<number>()
  const clearExitTimeout = useCallback(() => {
    if (exitTimeout.current) {
      clearTimeout(exitTimeout.current)
      exitTimeout.current = undefined
    }
  }, [])

  const closeNow = useCallback(() => {
    clearExitTimeout()
    onClose()
  }, [onClose, clearExitTimeout])

  const dispatchCloseEvent = useCloseEvent(ref, closeNow)

  const openWithDelay = useCallback(() => {
    if (!disabled && !enterTimeout.current) {
      if (open) dispatchCloseEvent()
      const win = getWin(ref)
      enterTimeout.current = win.setTimeout(onOpen, openDelay)
    }
  }, [dispatchCloseEvent, disabled, open, onOpen, openDelay])

  const closeWithDelay = useCallback(() => {
    clearEnterTimeout()
    const win = getWin(ref)
    exitTimeout.current = win.setTimeout(closeNow, closeDelay)
  }, [closeDelay, closeNow, clearEnterTimeout])

  const onClick = useCallback(() => {
    if (open && closeOnClick) {
      closeWithDelay()
    }
  }, [closeOnClick, closeWithDelay, open])

  const onPointerDown = useCallback(() => {
    if (open && closeOnPointerDown) {
      closeWithDelay()
    }
  }, [closeOnPointerDown, closeWithDelay, open])

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (open && event.key === "Escape") {
        closeWithDelay()
      }
    },
    [open, closeWithDelay],
  )

  useEventListener(
    () => getDoc(ref),
    "keydown",
    closeOnEsc ? onKeyDown : undefined,
  )

  useEventListener(
    () => {
      if (!closeOnScroll) return null
      const node = ref.current
      if (!node) return null
      const scrollParent = getScrollParent(node)
      return scrollParent.localName === "body" ? getWin(ref) : scrollParent
    },
    "scroll",
    () => {
      if (open && closeOnScroll) {
        closeNow()
      }
    },
    { passive: true, capture: true },
  )

  useEffect(() => {
    if (!disabled) return
    clearEnterTimeout()
    if (open) onClose()
  }, [disabled, open, onClose, clearEnterTimeout])

  useEffect(() => {
    return () => {
      clearEnterTimeout()
      clearExitTimeout()
    }
  }, [clearEnterTimeout, clearExitTimeout])

  /**
   * This allows for catching pointerleave events when the tooltip
   * trigger is disabled. There's currently a known issue in
   * React regarding the onPointerLeave polyfill.
   * @see https://github.com/facebook/react/issues/11972
   */
  useEventListener(() => ref.current, "pointerleave", closeWithDelay)

  const getTriggerProps: PropGetter = useCallback(
    (props = {}, _ref = null) => {
      const triggerProps = {
        ...props,
        ref: mergeRefs(ref, _ref, referenceRef),
        onPointerEnter: callAllHandlers(props.onPointerEnter, (e) => {
          if (e.pointerType === "touch") return
          openWithDelay()
        }),
        onClick: callAllHandlers(props.onClick, onClick),
        onPointerDown: callAllHandlers(props.onPointerDown, onPointerDown),
        onFocus: callAllHandlers(props.onFocus, openWithDelay),
        onBlur: callAllHandlers(props.onBlur, closeWithDelay),
        "aria-describedby": open ? tooltipId : undefined,
      }

      return triggerProps
    },
    [
      openWithDelay,
      closeWithDelay,
      onPointerDown,
      open,
      tooltipId,
      onClick,
      referenceRef,
    ],
  )

  const getPositionerProps: PropGetter = useCallback(
    (props = {}, forwardedRef = null) =>
      getPopperProps(
        {
          ...props,
          style: {
            ...props.style,
            [popperCSSVars.arrowSize.var]: arrowSize
              ? `${arrowSize}px`
              : undefined,
            [popperCSSVars.arrowShadowColor.var]: arrowShadowColor,
          },
        },
        forwardedRef,
      ),
    [getPopperProps, arrowSize, arrowShadowColor],
  )

  const getContentProps: PropGetter = useCallback(
    (props = {}, ref = null) => {
      const styles: React.CSSProperties = {
        ...props.style,
        position: "relative",
        transformOrigin: popperCSSVars.transformOrigin.varRef,
      }

      return {
        ref,
        ...props,
        id: tooltipId,
        role: "tooltip",
        style: styles,
      }
    },
    [tooltipId],
  )

  return {
    open,
    show: openWithDelay,
    hide: closeWithDelay,
    getTriggerProps,
    getContentProps,
    getPositionerProps,
    getArrowProps,
    getArrowInnerProps,
  }
}

export type UseTooltipReturn = ReturnType<typeof useTooltip>

const closeEventName = "chakra-ui:close-tooltip"

function useCloseEvent(ref: RefObject<Element>, close: () => void) {
  useEffect(() => {
    const doc = getDoc(ref)
    doc.addEventListener(closeEventName, close)
    return () => doc.removeEventListener(closeEventName, close)
  }, [close, ref])

  return () => {
    const doc = getDoc(ref)
    const win = getWin(ref)
    doc.dispatchEvent(new win.CustomEvent(closeEventName))
  }
}
