import { Dict, isFunction, isString, memo } from "@chakra-ui/utils"
import { colorMix } from "./color-mix"
import { mapToJson } from "./map-to-json"
import {
  TokenDictionary,
  Utility,
  UtilityConfig,
  UtilityPropertyConfig,
} from "./types"

interface Options {
  tokens: TokenDictionary
  config: UtilityConfig
}

function normalize(config: UtilityPropertyConfig | undefined) {
  return config
}

function normalizeConfig(config: UtilityConfig) {
  return Object.fromEntries(
    Object.entries(config).map(([property, propertyConfig]) => {
      return [property, normalize(propertyConfig)]
    }),
  )
}

export function createUtilty(options: Options) {
  const configs = normalizeConfig(options.config)
  const tokens = options.tokens

  const shorthands = new Map<string, string>()
  const propValues = new Map<string, Dict>()

  function register(property: string, config: UtilityPropertyConfig) {
    configs[property] = normalize(config)
    assignProperty(property, config)
  }

  const assignProperty = (property: string, config: UtilityPropertyConfig) => {
    const values = getPropertyValues(config)
    if (!values) return
    propValues.set(property, values)
  }

  const assignProperties = () => {
    for (const [prop, config] of Object.entries(configs)) {
      if (!config) continue
      assignProperty(prop, config)
    }
  }

  const assignShorthands = () => {
    for (const [property, config] of Object.entries(configs)) {
      const { shorthand } = config ?? {}
      if (!shorthand) continue

      const values = Array.isArray(shorthand) ? shorthand : [shorthand]
      values.forEach((name) => shorthands.set(name, property))
    }
  }

  const assignColorPaletteProperty = () => {
    const values = mapToJson(tokens.colorPaletteMap) as Record<string, any>
    register("colorPalette", {
      values: Object.keys(values),
      transform: memo((value) => values[value]),
    })
  }

  const getPropertyValues = (
    config: UtilityPropertyConfig,
    resolveFn?: (key: string) => string,
  ) => {
    const { values } = config

    const fn = (key: string) => {
      const value = resolveFn?.(key)
      return value ? { [value]: value } : undefined
    }

    if (isString(values)) {
      return fn?.(values) ?? tokens.getCategoryValues(values) ?? {}
    }

    if (Array.isArray(values)) {
      return values.reduce<Dict<string>>((result, value) => {
        result[value] = value
        return result
      }, {})
    }

    if (isFunction(values)) {
      return values(resolveFn ? fn : tokens.getCategoryValues)
    }

    return values
  }

  const defaultTransform = memo((prop: string, value: string) => {
    return {
      [prop]: prop.startsWith("--") ? tokens.getVar(value, value) : value,
    }
  })

  const tokenFn = Object.assign(tokens.getVar, {
    raw: (path: string) => tokens.getByName(path),
  })

  const transform = memo((prop: string, raw: any) => {
    const key = resolveShorthand(prop)

    const config = configs[key]
    if (!config) {
      return defaultTransform(key, raw)
    }

    const value = propValues.get(key)?.[raw]
    if (!config.transform) {
      return defaultTransform(prop, value ?? raw)
    }

    const _colorMix = (value: string) => colorMix(value, tokenFn)

    return config.transform(value ?? raw, {
      raw,
      token: tokenFn,
      utils: { colorMix: _colorMix },
    })
  })

  function build() {
    assignShorthands()
    assignColorPaletteProperty()
    assignProperties()
  }

  build()

  const hasShorthand = shorthands.size > 0

  const resolveShorthand = memo((prop: string) => {
    return shorthands.get(prop) ?? prop
  })

  const keys = () => {
    return [...Array.from(shorthands.keys()), ...Object.keys(configs)]
  }

  const instance: Utility = {
    keys,
    hasShorthand,
    transform,
    resolveShorthand,
    register,
  }

  return instance
}
