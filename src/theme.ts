import { alpha, createTheme } from "@mui/material/styles";

/**
 * A field-guide palette: the greens and ochres of a printed bird guide, on warm paper
 * rather than pure white, so the photos — which are the point of every page — are the
 * only saturated thing on screen.
 *
 * MUI derives shades from these with lighten()/darken(), which only parse numeric
 * formats: CSS colour names such as "lightgreen" throw at runtime.
 */
const FOREST_GREEN = "#2f6f4e";
const FOREST_GREEN_DARK = "#215239";
const FOREST_GREEN_LIGHT = "#5d9a78";
// Only for link hover: a step below the dark shade, since links already sit at it
const FOREST_GREEN_DEEP = "#163a28";
const OCHRE = "#c07524";
const OCHRE_DARK = "#9a5c18";
const OCHRE_LIGHT = "#e0a15c";
const PAPER_BACKGROUND = "#f6f4ef";
const INK = "#1e2a24";
const INK_MUTED = "#5c6a63";
const HAIRLINE = "#e3ded3";

/**
 * Darkens the foot of a photo so a caption can sit on the picture itself rather than in
 * a panel below it — the plate-and-caption layout of a printed guide, and the only way
 * to show the name without spending a phone's scarce vertical space on it.
 */
const SCRIM_GRADIENT =
  "linear-gradient(to top, rgba(12, 20, 16, 0.96) 0%, rgba(12, 20, 16, 0.82) 35%, rgba(12, 20, 16, 0.45) 70%, rgba(12, 20, 16, 0) 100%)";

// A serif for headings and scientific names is the one cue that says "field guide"
// without costing a webfont download
const SERIF_FONT_STACK = [
  "ui-serif",
  "Iowan Old Style",
  "Palatino Linotype",
  "Georgia",
  "serif",
].join(", ");

const SANS_FONT_STACK = [
  "system-ui",
  "-apple-system",
  "Segoe UI",
  "Roboto",
  "Helvetica",
  "Arial",
  "sans-serif",
].join(", ");

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: FOREST_GREEN,
      dark: FOREST_GREEN_DARK,
      light: FOREST_GREEN_LIGHT,
      contrastText: "#fff",
    },
    secondary: {
      main: OCHRE,
      dark: OCHRE_DARK,
      light: OCHRE_LIGHT,
      contrastText: "#fff",
    },
    success: {
      main: "#3f8f5a",
      light: "#7fbd94",
      dark: "#2d6b41",
      // MUI's contrast calculation picks dark text on this green; white matches
      // the other contained buttons and reads better against the fill
      contrastText: "#fff",
    },
    info: {
      main: "#2f6f8f",
      light: "#7fb2cc",
      dark: "#1f4e66",
    },
    error: {
      main: "#b3403a",
    },
    background: {
      default: PAPER_BACKGROUND,
      paper: "#ffffff",
    },
    text: {
      primary: INK,
      secondary: INK_MUTED,
    },
    divider: HAIRLINE,
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: SANS_FONT_STACK,
    h1: {
      fontFamily: SERIF_FONT_STACK,
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: SERIF_FONT_STACK,
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontFamily: SERIF_FONT_STACK,
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h4: {
      fontFamily: SERIF_FONT_STACK,
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontFamily: SERIF_FONT_STACK,
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h6: { fontFamily: SERIF_FONT_STACK, fontWeight: 600 },
    button: { fontWeight: 600, letterSpacing: "0.01em" },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          // Absolute rather than em-relative: the old 0.6em/1.2em grew whenever a
          // button sat in larger text, which is what made rows of them overflow a phone
          padding: "6px 12px",
          fontSize: "0.875rem",
          minWidth: 0,
          borderRadius: 8,
        },
        sizeLarge: { padding: "10px 20px", fontSize: "1rem" },
        sizeSmall: { padding: "4px 8px", fontSize: "0.8125rem" },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiToolbar: {
      styleOverrides: {
        // The bar is chrome around the photo, not a place to spend 56px of a phone
        dense: { minHeight: 44 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        // MUI tints elevated surfaces with a white overlay, which flattens them
        // against the warm page background
        root: { backgroundImage: "none" },
      },
    },
    /**
     * Every link in the app is styled here rather than at each call site: green against
     * the ink of body text, plus an underline, since colour alone is not a cue every
     * reader can see. The rule is a hairline set off the baseline so it reads as a link
     * in a paragraph without the heavy default browser underline, which muddies the
     * italic serif of a scientific name.
     */
    MuiLink: {
      defaultProps: {
        underline: "always",
      },
      styleOverrides: {
        root: {
          color: FOREST_GREEN_DARK,
          textDecorationColor: alpha(FOREST_GREEN_DARK, 0.4),
          textDecorationThickness: "1px",
          textUnderlineOffset: "0.18em",
          // Hovering deepens the same green and brings the underline to full
          // strength; switching hue to the ochre of the accents read as a warning
          "&:hover": {
            color: FOREST_GREEN_DEEP,
            textDecorationColor: FOREST_GREEN_DEEP,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
        sizeSmall: { height: 22 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, paddingTop: 2, paddingBottom: 2 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: "#fff" },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: INK, fontSize: "0.75rem" },
      },
    },
  },
});

export { HAIRLINE, INK, SCRIM_GRADIENT };
export default theme;
