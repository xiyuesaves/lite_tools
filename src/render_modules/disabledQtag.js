import { options, updateOptions } from "./options.js";

function disableQtag() {
  if (app) {
    app.classList.toggle("disabled-level-tag", options.disableQtag.level);
    app.classList.toggle("disabled-title-tag", options.disableQtag.title);
    app.classList.toggle("disabled-all-tag", options.disableQtag.all);
  }
}
updateOptions(disableQtag);
export { disableQtag };
