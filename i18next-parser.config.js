const i18NextParserConfig = {
    locales: ['en', 'de'],
    output: 'public/locales/$LOCALE/$NAMESPACE.json',
    sort: true,
    resetDefaultValueLocale: 'en',
    lexers: {
        tsx: [{ lexer: 'JsxLexer', transSupportBasicHtmlNodes: true }],
    },
};

export default i18NextParserConfig;