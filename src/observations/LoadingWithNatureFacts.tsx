import { useState, useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const LoadingWithNatureFacts = () => {
  const { t } = useTranslation();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const natureFacts = [
    t("natureFacts.fact1"),
    t("natureFacts.fact2"),
    t("natureFacts.fact3"),
    t("natureFacts.fact4"),
    t("natureFacts.fact5"),
    t("natureFacts.fact6"),
    t("natureFacts.fact7"),
    t("natureFacts.fact8"),
    t("natureFacts.fact9"),
    t("natureFacts.fact10"),
    t("natureFacts.fact11"),
    t("natureFacts.fact12"),
    t("natureFacts.fact13"),
    t("natureFacts.fact14"),
    t("natureFacts.fact15"),
    t("natureFacts.fact16"),
    t("natureFacts.fact17"),
    t("natureFacts.fact18"),
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setCurrentFactIndex(
          (prevIndex) => (prevIndex + 1) % natureFacts.length
        );
        setIsExiting(false);
      }, 500);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [natureFacts.length]);

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
          {natureFacts[currentFactIndex]}
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingWithNatureFacts;
