import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

import SpecieCard from "@/species/SpecieCard";
import type { SpeciesData } from "@/species/useFetchSpecies";

/**
 * The species list, rendering only the rows near the viewport.
 *
 * A location runs into the hundreds of species and every card mounts a photo plus two
 * dialogs, which is what makes scrolling and filtering slow on a phone. Rows are
 * virtualized rather than individual cards so the reading order stays the same as the
 * plain flex-wrap grid it replaces: a masonry-style column layout would break the
 * numbering shown on each card.
 *
 * The window is the scroll container (no page-level scroll wrapper exists), so row
 * offsets are measured against the document and shifted by the distance from the top
 * of the page to the start of the list.
 */

/** Matches the card's own maxWidth, so the row layout mirrors how the cards wrap. */
const CARD_MAX_WIDTH_PX = 400;
/** theme.spacing(2), as a number because it also feeds the column arithmetic. */
const GRID_GAP_PX = 16;
/** A phone-width card: 4/3 photo plus roughly two lines of content and the buttons. */
const ESTIMATED_ROW_HEIGHT_PX = 420;
/**
 * Rows kept mounted on each side of the viewport, above and below. They give a fast
 * scroll something already rendered to move into, and their photos a head start on
 * loading before they come into view.
 */
const OVERSCAN_ROWS = 3;

const getColumnCount = (availableWidth: number) => {
  if (availableWidth <= 0) {
    return 1;
  }
  const columnCount = Math.floor(
    (availableWidth + GRID_GAP_PX) / (CARD_MAX_WIDTH_PX + GRID_GAP_PX)
  );
  return Math.max(1, columnCount);
};

const chunkIntoRows = (species: SpeciesData[], columnCount: number) => {
  const rows: SpeciesData[][] = [];
  for (let index = 0; index < species.length; index += columnCount) {
    rows.push(species.slice(index, index + columnCount));
  }
  return rows;
};

const VirtualizedSpeciesGrid = ({
  species,
  showIndex,
}: {
  species: SpeciesData[];
  /** Numbers each card by its position, only meaningful on the unfiltered list. */
  showIndex: boolean;
}) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [listMetrics, setListMetrics] = useState({ offsetTop: 0, width: 0 });

  // The list starts below a header, a search field and an optional set of filter
  // chips, all of which change height, so both the offset and the available width are
  // observed rather than read once
  useLayoutEffect(() => {
    const listElement = listRef.current;
    if (!listElement) {
      return;
    }

    const measure = () => {
      const { top, width } = listElement.getBoundingClientRect();
      const offsetTop = top + window.scrollY;
      setListMetrics((previous) =>
        previous.offsetTop === offsetTop && previous.width === width
          ? previous
          : { offsetTop, width }
      );
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(listElement);
    // Content above the list growing or collapsing moves the list without resizing it
    resizeObserver.observe(document.body);

    return () => resizeObserver.disconnect();
  }, []);

  const columnCount = getColumnCount(listMetrics.width);

  const rows = useMemo(
    () => chunkIntoRows(species, columnCount),
    [species, columnCount]
  );

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => ESTIMATED_ROW_HEIGHT_PX,
    overscan: OVERSCAN_ROWS,
    scrollMargin: listMetrics.offsetTop,
    // Keyed by content so measured heights follow a row when filtering reshuffles the
    // list, instead of being reused for whatever ends up at the same position
    getItemKey: (rowIndex) => {
      const row = rows[rowIndex];
      return row ? `${row[0].taxon.id}-${row.length}` : rowIndex;
    },
  });

  return (
    <Box
      ref={listRef}
      sx={{ position: "relative", width: "100%" }}
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index];
        if (!row) {
          return null;
        }

        return (
          <Box
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              display: "flex",
              gap: 2,
              // Part of the measured height, so it acts as the gap between rows
              pb: 2,
              justifyContent: { xs: "center", sm: "flex-start" },
            }}
            style={{
              transform: `translateY(${
                virtualRow.start - virtualizer.options.scrollMargin
              }px)`,
            }}
          >
            {row.map((item, columnIndex) => (
              <Box
                key={`spp-${item.taxon.id}`}
                // Shrinks below the card width on a narrow phone, never grows past it
                sx={{ flex: `0 1 ${CARD_MAX_WIDTH_PX}px`, minWidth: 0 }}
              >
                <SpecieCard
                  data={item}
                  idx={
                    showIndex
                      ? virtualRow.index * columnCount + columnIndex + 1
                      : undefined
                  }
                />
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
};

export default VirtualizedSpeciesGrid;
