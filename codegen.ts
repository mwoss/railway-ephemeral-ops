import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: {
    'https://backboard.railway.app/graphql/v2': {
      headers: {
        Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN || ''}`,
      },
    },
  },
  documents: 'lib/graphql/**/*.graphql',
  generates: {
    'generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-graphql-request',
      ],
      config: {
        skipTypename: false,
        withHooks: false,
        withHOC: false,
        withComponent: false,
      },
    },
  },
};

export default config;
