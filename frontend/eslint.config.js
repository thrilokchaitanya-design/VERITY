const readonly = Object.fromEntries(
  `Array ArrayBuffer BigInt Boolean DataView Date Error EvalError Float32Array Float64Array Function Infinity Int16Array Int32Array Int8Array Intl JSON Map Math NaN Number Object Promise RangeError ReferenceError Reflect RegExp Set String Symbol SyntaxError TypeError Uint16Array Uint32Array Uint8Array Uint8ClampedArray WeakMap WeakSet decodeURI decodeURIComponent encodeURI encodeURIComponent isFinite isNaN parseFloat parseInt undefined`.split(' ').map(name => [name, 'readonly'])
);

const browser = Object.fromEntries(
  `Image IntersectionObserver ResizeObserver cancelAnimationFrame document performance requestAnimationFrame window`.split(' ').map(name => [name, 'readonly'])
);

export default [{
  files: ['src/components/**/*.jsx', 'src/effects.jsx'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
    globals: { ...readonly, ...browser }
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-unreachable': 'error'
  }
}];
