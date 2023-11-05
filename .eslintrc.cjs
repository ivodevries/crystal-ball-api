module.exports = {
    env: {
        node: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        sourceType: 'module',
        project: 'tsconfig.json',
    },
    // ignorePatterns: ['.eslintrc.cjs'],
    ignorePatterns: ['**/*.js', '**/*.cjs'],
    rules: {
        'dot-notation': 'error',
        'eol-last': [
            'error', 'always'
        ],
        '@typescript-eslint/indent': ['error'],
        'max-len': [
            'error',
            {
                code: 140,
                ignorePattern: '\'[^\']{100,}?\'|import \\{.*\\}',
                ignoreComments: true,
                ignoreRegExpLiterals: true,
            }
        ],
        'max-lines': [
            'error',
            400
        ],
        'no-constant-condition': [
            'error', { checkLoops: false }
        ],
        'no-empty': [
            'error',
            { allowEmptyCatch: true }
        ],
        'padded-blocks': [
            'error', 'never'
        ],
        'quotes': [
            'error',
            'single',
        ],
        'quote-props': [
            'error',
            'consistent-as-needed'
        ],
        'semi': [
            'error', 'always'
        ],
        'comma-spacing': ['error', { before: false, after: true }],
        'keyword-spacing': ['error', { before: true, after: true }],
        'object-curly-spacing': ['error', 'always'],
        'key-spacing': ['error', { mode: 'minimum' }],
        'no-multiple-empty-lines': ['error', { max: 1 }],
        'no-trailing-spaces': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        'space-before-blocks': 'error',
        'space-before-function-paren': ['error', {
            anonymous: 'never',
            named: 'ignore',
            asyncArrow: 'always'
        }],
        'spaced-comment': [
            'error',
            'always',
            { markers: ['/'] }
        ],
        'complexity': ['error', { max: 20 }],
        '@typescript-eslint/no-floating-promises': ['error', {ignoreIIFE: true}]
    }
};
