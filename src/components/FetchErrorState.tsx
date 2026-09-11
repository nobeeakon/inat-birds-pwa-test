import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import RefreshIcon from "@mui/icons-material/Refresh";

import type { FetchErrorKind } from "@/fetchData";
import { getRateLimitCooldownSeconds } from "@/rateLimit";

/**
 * How long a retry waits before it goes out, by how many have already been tried.
 *
 * Almost every failure here is the iNaturalist rate limit, which only clears with
 * time: firing again on the click spends the next request on the same refusal. Each
 * further attempt backs off more, and the last value is kept for the ones after it.
 */
const RETRY_DELAY_SECONDS = [5, 10, 20, 30];

const FetchErrorState = ({
  errorKind,
  onRetry,
}: {
  errorKind: FetchErrorKind;
  /** Must be referentially stable: it is read by the countdown effect. */
  onRetry: () => void;
}) => {
  const { t } = useTranslation();
  const [attemptCount, setAttemptCount] = useState(0);
  // Null when no retry is pending, which is also what the button reads to decide
  // whether it is offering a retry or counting one down
  const [secondsUntilRetry, setSecondsUntilRetry] = useState<number | null>(
    null
  );

  // One second at a time rather than a single timeout, so the button can count it
  // down: a retry that waits without saying so reads as a dead button
  useEffect(() => {
    if (secondsUntilRetry === null) return;

    const timeoutId = setTimeout(() => {
      if (secondsUntilRetry === 1) {
        setSecondsUntilRetry(null);
        onRetry();
        return;
      }

      setSecondsUntilRetry(secondsUntilRetry - 1);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [secondsUntilRetry, onRetry]);

  const startRetryCountdown = () => {
    const delayIndex = Math.min(attemptCount, RETRY_DELAY_SECONDS.length - 1);

    // A retry sent while the shared cooldown still holds is refused before it even
    // leaves, so the wait is never shorter than what is left of it
    setSecondsUntilRetry(
      Math.max(RETRY_DELAY_SECONDS[delayIndex], getRateLimitCooldownSeconds())
    );
    setAttemptCount(attemptCount + 1);
  };

  const isWaitingToRetry = secondsUntilRetry !== null;

  return (
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
            // Ochre rather than the error red: nothing is broken, the API is just
            // asking to be left alone for a moment
            bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.12),
            color: "secondary.dark",
          }}
        >
          <CloudOffIcon fontSize="medium" />
        </Box>

        <Typography variant="h6" component="h2">
          {errorKind === "rateLimit"
            ? t("fetchErrorRateLimitTitle")
            : t("fetchErrorTitle")}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {errorKind === "rateLimit"
            ? t("fetchErrorRateLimitBody")
            : t("fetchErrorBody")}
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={startRetryCountdown}
          disabled={isWaitingToRetry}
          startIcon={
            isWaitingToRetry ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <RefreshIcon />
            )
          }
          sx={{ mt: 1 }}
        >
          {isWaitingToRetry
            ? t("fetchErrorRetryingIn", { count: secondsUntilRetry })
            : t("retry")}
        </Button>

        {isWaitingToRetry && (
          <Typography variant="caption" color="text.secondary">
            {t("fetchErrorWaitingHint")}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default FetchErrorState;
