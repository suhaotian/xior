export const whiteFields = [
  'name',
  'version',
  'description',
  'keywords',
  'homepage',
  'bugs',
  'license',
  'author',
  'contributors',
  'funding',
  'files',
  'main',
  'types',
  'require',
  'import',
  'module',
  'browser',
  'bin',
  'man',
  'directories',
  'repository',
  // 'scripts',
  'config',
  'dependencies',
  'peerDependencies',
  'peerDependenciesMeta',
  'bundleDependencies',
  'optionalDependencies',
  'overrides',
  'engines',
  'os',
  'cpu',
  'publishConfig',
  'exports',
  'types',
  'typing',
  'module',
  'react-server',
  'react-native',
];

export function getFieldsMap() {
  const result = {};
  whiteFields.forEach((field) => {
    result[field.toLowerCase()] = true;
  });
  return result;
}
