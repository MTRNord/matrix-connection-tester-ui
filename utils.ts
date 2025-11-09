import { createDefine } from "fresh";
import type { I18n } from "./lib/i18n.ts";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  i18n: I18n;
}

export const define = createDefine<State>();
