import {
  Dict,
  compact,
  flatten,
  isObject,
  memo,
  mergeWith,
  splitProps,
} from "@chakra-ui/utils"
import { createConditions } from "./conditions"
import { createCssFn } from "./css"
import { isCssProperty } from "./is-valid-prop"
import { createPreflight } from "./preflight"
import { createRecipeFn } from "./recipe"
import { createSerializeFn } from "./serialize"
import { createTokenDictionary } from "./token-dictionary"
import { SystemConfig, SystemContext } from "./types"
import { createUtilty } from "./utility"

export function createSystem(options: SystemConfig): SystemContext {
  const {
    theme = {},
    utilities = {},
    globalCss = {},
    cssVarsRoot = ":where(:root, :host)",
    cssVarsPrefix = "chakra",
    preflight,
  } = options

  const tokens = createTokenDictionary({
    tokens: theme.tokens,
    semanticTokens: theme.semanticTokens,
    prefix: cssVarsPrefix,
  })

  const conditions = createConditions({
    conditions: options.conditions,
    breakpoints: theme.breakpoints,
  })

  const utility = createUtilty({
    config: utilities,
    tokens,
  })

  function assignComposition() {
    const { textStyles, layerStyles } = theme

    const compositions = compact({
      textStyle: textStyles,
      layerStyle: layerStyles,
    })

    for (const [key, values] of Object.entries(compositions)) {
      const flatValues = flatten(
        values ?? {},
        (v) => isObject(v) && "value" in v,
      )

      utility.register(key, {
        values: Object.keys(flatValues),
        transform(value) {
          return { "@layer compositions": css(flatValues[value]) }
        },
      })
    }
  }

  assignComposition()

  const properties = new Set(["css", ...utility.keys(), ...conditions.keys()])

  const isValidProperty = memo(
    (prop: string) => properties.has(prop) || isCssProperty(prop),
  )

  const css = createCssFn({ utility, conditions })
  const cva = createRecipeFn({ css })
  const serialize = createSerializeFn({ conditions, isValidProperty })

  function getTokenCss() {
    const result: Dict = {}

    for (const [key, values] of tokens.cssVarMap.entries()) {
      const varsObj = Object.fromEntries(values) as any
      if (Object.keys(varsObj).length === 0) continue

      if (key === "base") {
        const cssObj = css(serialize({ [cssVarsRoot]: varsObj }))
        mergeWith(result, cssObj)
      } else {
        const cssObject = css(serialize({ [key]: varsObj }))
        mergeWith(result, cssObject)
      }
    }

    return result
  }

  function getGlobalCss() {
    const keyframes = Object.fromEntries(
      Object.entries(theme.keyframes ?? {}).map(([key, value]) => [
        `@keyframes ${key}`,
        value,
      ]),
    )
    return Object.assign({}, keyframes, css(serialize(globalCss)))
  }

  function splitCssProps(props: any) {
    return splitProps(props, isValidProperty as any)
  }

  function getPreflightCss() {
    return createPreflight({ preflight })
  }

  const context: SystemContext = {
    tokens,
    conditions,
    utility,
    properties,
    isValidProperty,
    splitCssProps: splitCssProps as any,
    getTokenCss,
    getGlobalCss,
    getPreflightCss,
    css,
    cva,
  }

  return context
}
