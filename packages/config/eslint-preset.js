module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier"
    ],
    parser: "@typescript-eslint/parser",
    // parserOptions: {
    //     project: ["./apps/api/tsconfig.json", "./apps/api/tests/tsconfig.json"],
    //     sourceType: "module",
    // },
    plugins: [
        "eslint-plugin-import",
        "eslint-plugin-jsdoc",
        "eslint-plugin-prefer-arrow",
        "@typescript-eslint",
        "@typescript-eslint/tslint",
    ],
    rules: {
        semi: [2, "always"],
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/array-type": [
            "error",
            {
                default: "array",
            },
        ],
        "@typescript-eslint/ban-types": [
            "error",
            {
                types: {
                    Object: {
                        message: "Avoid using the `Object` type. Did you mean `object`?",
                    },
                    Function: {
                        message: "Avoid using the `Function` type. Prefer a specific function type, like `() => void`.",
                    },
                    Boolean: {
                        message: "Avoid using the `Boolean` type. Did you mean `boolean`?",
                    },
                    Number: {
                        message: "Avoid using the `Number` type. Did you mean `number`?",
                    },
                    String: {
                        message: "Avoid using the `String` type. Did you mean `string`?",
                    },
                    Symbol: {
                        message: "Avoid using the `Symbol` type. Did you mean `symbol`?",
                    },
                },
            },
        ],
        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/dot-notation": "error",
        "@typescript-eslint/member-ordering": "error",
        "@typescript-eslint/naming-convention": "error",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-namespace": "error",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-shadow": [
            "error",
            {
                hoist: "all",
            },
        ],
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/prefer-for-of": "error",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/quotes": [
            "error",
            "double",
            {
                "avoidEscape": true,
                "allowTemplateLiterals": true
            }
        ],
        "@typescript-eslint/triple-slash-reference": [
            "error",
            {
                path: "always",
                types: "prefer-import",
                lib: "always",
            },
        ],
        "@typescript-eslint/unified-signatures": "error",
        complexity: "off",
        "constructor-super": "error",
        "dot-notation": "error",
        eqeqeq: ["error", "smart"],
        "guard-for-in": "error",
        "id-blacklist": "error",
        "id-match": "error",
        "import/order": "error",
        "jsdoc/check-alignment": "error",
        "jsdoc/check-indentation": "error",
        "jsdoc/newline-after-description": "error",
        "max-classes-per-file": ["error", 1],
        "max-len": [
            "error",
            {
                code: 100,
                ignoreComments: true,
                ignoreTemplateLiterals: true,
                ignoreRegExpLiterals: true,
                ignoreUrls: true,
                ignorePattern: '(^import .*)|(^.*it\\(".*)'
            },
        ],
        "new-parens": "error",
        "no-bitwise": "error",
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-console": "error",
        "no-debugger": "error",
        "no-empty": "off",
        "no-empty-function": "off",
        "no-eval": "error",
        "no-fallthrough": "off",
        "no-invalid-this": "off",
        "no-multiple-empty-lines": [
            "error",
            {
                max: 2,
                maxBOF: 0,
                maxEOF: 1
            }
        ],
        "no-new-wrappers": "error",
        "no-shadow": "off",
        "no-throw-literal": "error",
        "no-trailing-spaces": "error",
        "no-undef-init": "error",
        "no-underscore-dangle": "off",
        "no-unsafe-finally": "error",
        "no-unused-expressions": "error",
        "no-unused-labels": "error",
        "no-use-before-define": "off",
        "no-var": "error",
        "object-shorthand": "error",
        "one-var": ["error", "never"],
        "prefer-const": "error",
        "sort-keys": "error",
        quotes: [
            "error",
            "double",
            {
                "avoidEscape": true,
                "allowTemplateLiterals": true
            }
        ],
        radix: "error",
        "spaced-comment": [
            "error",
            "always",
            {
                markers: ["/"],
            },
        ],
        "use-isnan": "error",
        "valid-typeof": "off",
        "@typescript-eslint/tslint/config": [
            "error",
            {
                rules: {
                    "object-literal-sort-keys": true,
                },
            },
        ],
    },
};