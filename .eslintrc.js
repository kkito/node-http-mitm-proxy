// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  // add your custom rules here
  env: {
    es6: true
  },
  parserOptions: {
    ecmaVersion: 2017
  },
  rules: {
    // allow async-await
    'generator-star-spacing': 'off',
    'camelcase': 0,
    'vue/no-parsing-error': 0
  }
}
