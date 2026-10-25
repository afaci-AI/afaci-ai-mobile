const { withAppBuildGradle } = require('expo/config-plugins')

/**
 * Даёт debug-сборке отдельный applicationId (`kg.afaci.afaci_mobile.dev`),
 * чтобы debug- и release-сборки можно было установить одновременно.
 * Release сохраняет `kg.afaci.afaci_mobile`.
 */
module.exports = function withDebugApplicationIdSuffix(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      throw new Error(
        'withDebugApplicationIdSuffix поддерживает только Groovy build.gradle',
      )
    }

    const contents = gradleConfig.modResults.contents

    if (!contents.includes('applicationIdSuffix ".dev"')) {
      gradleConfig.modResults.contents = contents.replace(
        /(debug\s*\{\s*\n\s*signingConfig\s+signingConfigs\.debug)/,
        '$1\n            applicationIdSuffix ".dev"',
      )
    }

    return gradleConfig
  })
}
