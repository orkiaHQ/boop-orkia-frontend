import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'http://127.0.0.1:8080/graphql',
  documents: ['src/**/*.graphql'],
  generates: {
    'src/gql/': {
      preset: 'client',
      config: {
        documentMode: 'string',
        strictScalars: true,
        scalars: {
          DateTime: 'string',
          JSON: 'unknown',
          UUID: 'string',
        },
      },
    },
  },
}

export default config
