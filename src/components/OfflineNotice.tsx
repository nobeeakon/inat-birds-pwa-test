import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert, Button } from "@mui/material";
import CloudOffIcon from "@mui/icons-material/CloudOff";

import StatusCard from "@/components/StatusCard";

/**
 * What the app says while the browser reports no connection.
 *
 * Neither variant offers a retry: the fetches are held back by the same connection
 * state these read, so they start again on their own the moment it returns. What the
 * user is told instead is which part of the app still works without a network.
 */

/** Above content that is still usable: saved observations, a saved species list. */
export const OfflineBanner = ({ message }: { message: string }) => (
  <Alert
    severity="warning"
    icon={<CloudOffIcon fontSize="inherit" />}
    sx={{ mb: 1 }}
  >
    {message}
  </Alert>
);

/** In place of a page that has nothing saved to fall back on. */
export const OfflineState = ({
  message,
  showSpeciesLink = false,
}: {
  message: string;
  /** Only worth offering when there is a saved species list to open. */
  showSpeciesLink?: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <StatusCard
      icon={<CloudOffIcon fontSize="medium" />}
      title={t("offlineTitle")}
      body={message}
    >
      {showSpeciesLink && (
        <Button
          component={Link}
          to="/species"
          variant="contained"
          size="large"
          sx={{ mt: 1 }}
        >
          {t("offlineOpenSpecies")}
        </Button>
      )}
    </StatusCard>
  );
};
