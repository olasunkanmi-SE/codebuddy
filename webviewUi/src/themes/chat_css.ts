import { oneDarkCss } from "./atom-one-dark";
import { oneDarkReasonableCss } from "./code-highlight_atom-one-dark-reasonable";
import { codePenCss } from "./code-pen";
import { felipecCss } from "./felipec";
import { githubDarkDimmed } from "./gitbub-dark";
import { irBlack } from "./ir-black";
import { nightOwlCss } from "./night-owl";
import { stackOverFlowCss } from "./stackoverflow";
import { tokyoNightCss } from "./tokyo-night";

export function getChatCss(theme: string) {
  let selectedTheme = "";

  switch (theme) {
    case "Atom One Dark":
      selectedTheme = oneDarkCss;
      break;
    case "Atom One Dark Reasonable":
      selectedTheme = oneDarkReasonableCss;
      break;
    case "Code Pen":
      selectedTheme = codePenCss;
      break;
    case "felipec":
      selectedTheme = felipecCss;
      break;
    case "github dark":
      selectedTheme = githubDarkDimmed;
      break;
    case "ir black":
      selectedTheme = irBlack;
      break;
    case "night owl":
      selectedTheme = nightOwlCss;
      break;
    case "stackoverflow":
      selectedTheme = stackOverFlowCss;
      break;
    case "tokyo night":
      selectedTheme = tokyoNightCss;
      break;
    default:
      break;
  }
  return `${selectedTheme}`;
}
