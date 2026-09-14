import type { ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

/**
 * The card a page puts in place of its content when there is nothing to show: a rate
 * limited fetch, a missing connection. One shell for all of them, so those screens
 * differ in what they say rather than in how they look.
 */
const StatusCard = ({
  icon,
  title,
  body,
  children,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  /** Whatever the user can do about it: a retry button, a link elsewhere. */
  children?: ReactNode;
}) => (
  <Box
    sx={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: 2,
    }}
  >
    <Paper
      variant="outlined"
      sx={{
        maxWidth: 400,
        width: "100%",
        px: 3,
        py: 4,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Ochre rather than the error red: nothing is broken, the app is only
          // waiting on something outside it
          bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.12),
          color: "secondary.dark",
        }}
      >
        {icon}
      </Box>

      <Typography variant="h6" component="h2">
        {title}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {body}
      </Typography>

      {children}
    </Paper>
  </Box>
);

export default StatusCard;
