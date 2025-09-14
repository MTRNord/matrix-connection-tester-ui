declare module 'react-plotly.js' {
    import * as React from 'react';
    import { Layout, Config, Data } from 'plotly.js';
    export interface PlotParams {
        data: Data[];
        layout?: Partial<Layout>;
        config?: Partial<Config>;
        style?: React.CSSProperties;
        className?: string;
        useResizeHandler?: boolean;
    }
    export default class Plot extends React.Component<PlotParams> { }
}
