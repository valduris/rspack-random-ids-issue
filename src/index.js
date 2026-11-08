import { a } from "./a.js";

window.entry = [a, () => import("./lazy1.js"), () => import("./lazy2.js"), () => import("./lazy3.js"), () => import("./lazy4.js"), () => import("./lazy5.js"), () => import("./lazy6.js"), () => import("./lazy7.js"), () => import("./lazy8.js")];
