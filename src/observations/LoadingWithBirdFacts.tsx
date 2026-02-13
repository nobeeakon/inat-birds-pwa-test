import { useState, useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const LoadingWithBirdFacts = () => {
  const { t } = useTranslation();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const birdFacts = [
    t("birdFacts.fact1"),
    t("birdFacts.fact2"),
    t("birdFacts.fact3"),
    t("birdFacts.fact4"),
    t("birdFacts.fact5"),
    t("birdFacts.fact6"),
    t("birdFacts.fact7"),
    t("birdFacts.fact8"),
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentFactIndex((prevIndex) => (prevIndex + 1) % birdFacts.length);
    }, 3500);

    return () => clearInterval(intervalId);
  }, [birdFacts.length]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        py: 8,
      }}
    >
      <CircularProgress size={48} />
      <Typography
        variant="body1"
        sx={{
          textAlign: "center",
          maxWidth: "400px",
          minHeight: "3em",
          px: 2,
        }}
      >
        {birdFacts[currentFactIndex]}
      </Typography>
    </Box>
  );
};

export default LoadingWithBirdFacts;
