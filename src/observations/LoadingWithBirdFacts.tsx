import { useState, useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const LoadingWithBirdFacts = () => {
  const { t } = useTranslation();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

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
      setIsExiting(true);
      setTimeout(() => {
        setCurrentFactIndex((prevIndex) => (prevIndex + 1) % birdFacts.length);
        setIsExiting(false);
      }, 500);
    }, 4000);

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
      <Box
        sx={{
          maxWidth: "300px",
          width: "100%",
          minHeight: "3em",
          px: 2,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Typography
          key={currentFactIndex}
          variant="body1"
          sx={{
            textAlign: "center",
            animation: isExiting
              ? "slideOutRight 0.5s ease-in forwards"
              : "slideInLeft 0.5s ease-out",
            "@keyframes slideInLeft": {
              "0%": {
                opacity: 0,
                transform: "translateX(-100%)",
              },
              "70%": {
                opacity: 1,
              },
              "100%": {
                transform: "translateX(0)",
              },
            },
            "@keyframes slideOutRight": {
              "0%": {
                opacity: 1,
                transform: "translateX(0)",
              },
              "70%": {
                opacity: 0,
              },
              "100%": {
                transform: "translateX(100%)",
              },
            },
          }}
        >
          {birdFacts[currentFactIndex]}
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingWithBirdFacts;
