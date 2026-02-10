import { useTranslation } from "react-i18next";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <ToggleButtonGroup
      value={i18n.language}
      exclusive
      onChange={(_, newLang) => newLang && changeLanguage(newLang)}
      sx={{ p: 1, gap: 1 }}
    >
      <ToggleButton value="en">EN</ToggleButton>
      <ToggleButton value="es">ES</ToggleButton>
    </ToggleButtonGroup>
  );
}
