/** Incomplete box — pink; complete box — light green (UI mockup). */
export const SORTING_BOX_COLOR_INCOMPLETE = '#FDE8F0';
export const SORTING_BOX_COLOR_COMPLETE = '#DFF5E6';

/** Lowercase leafTrailStatus for comparisons (handles "Sorted", "For Receiving", etc.). */
export function normalizeLeafTrailStatus(status) {
  return String(status || '').trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Trail #3 metrics — aligned with UI mockup + handwritten note.
 *
 * Card (mockup): For Receiving N · Received X of N · Sorted Y of N
 * Detail (note): Total Plants to Fulfill = Received − Missing − Damaged − Need to Stay
 *
 * Box complete (pink → light green) when every plant is received and sorted vs For Receiving total.
 */
export function computeSortingBoxMetrics(plants = []) {
  const forReceivingCount = plants.length;

  const needsToStayCount = plants.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) === 'needstostay',
  ).length;
  const missingCount = plants.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) === 'missing',
  ).length;
  const damagedCount = plants.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) === 'damaged',
  ).length;
  const missingDamagedCount = missingCount + damagedCount;

  /** Hub-received (no longer forReceiving). */
  const receivedCount = plants.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) !== 'forreceiving',
  ).length;

  const sortedCount = plants.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) === 'sorted',
  ).length;

  /** Handwritten: "Total Plants to Fulfill" */
  const totalPlantsToFulfill = Math.max(
    0,
    receivedCount - missingCount - damagedCount - needsToStayCount,
  );

  const isComplete =
    forReceivingCount === 0
      ? true
      : receivedCount >= forReceivingCount && sortedCount >= forReceivingCount;

  return {
    forReceivingCount,
    receivedCount,
    sortedCount,
    needsToStayCount,
    missingCount,
    damagedCount,
    missingDamagedCount,
    totalPlantsToFulfill,
    /** @deprecated use totalPlantsToFulfill — kept for API compatibility */
    toBeSortedCount: totalPlantsToFulfill,
    isComplete,
    boxColor: isComplete ? SORTING_BOX_COLOR_COMPLETE : SORTING_BOX_COLOR_INCOMPLETE,
  };
}

/** True when hub sort scan set leafTrailStatus to sorted. */
export function isSortedPlant(plant) {
  return normalizeLeafTrailStatus(plant?.leafTrailStatus) === 'sorted';
}

/** Plants still waiting for a sort scan in this receiver box. */
export function isAwaitingSortPlant(plant) {
  if (isSortedPlant(plant)) return false;
  const status = normalizeLeafTrailStatus(plant?.leafTrailStatus);
  return (
    status === 'received' ||
    status === 'forreceiving' ||
    status === 'needstostay' ||
    status === 'missing' ||
    status === 'damaged'
  );
}

export function sortingPlantStatusLabel(plant) {
  if (isSortedPlant(plant)) return 'Sorted';
  const status = normalizeLeafTrailStatus(plant?.leafTrailStatus);
  if (status === 'received') return 'Awaiting sort';
  if (status === 'forreceiving') return 'For receiving';
  if (status === 'needstostay') return 'Needs to stay';
  if (status === 'missing') return 'Missing';
  if (status === 'damaged') return 'Damaged';
  return 'Awaiting sort';
}

/** Whether this plant is included in Total Plants to Fulfill (received − missing − damaged − need to stay). */
export function plantCountsTowardSortingFulfill(plant) {
  const status = normalizeLeafTrailStatus(plant?.leafTrailStatus);
  if (status === 'forreceiving') return false;
  if (status === 'missing' || status === 'damaged' || status === 'needstostay') return false;
  return true;
}

/**
 * User-facing copy after a receiver-box sort scan — explains fulfill count vs plant lists.
 * @returns {{ tone: 'success' | 'warning', lines: string[] }}
 */
export function describeSortingScanPlantOutcome(plant) {
  const status = normalizeLeafTrailStatus(plant?.leafTrailStatus);
  const displayStatus = String(plant?.leafTrailStatus || status || 'unknown').trim();

  if (status === 'sorted') {
    return {
      tone: 'success',
      lines: [
        'This plant is listed under the Sorted tab in this receiver box (not Awaiting to sort).',
        'It counts toward Total Plants to Fulfill for this box.',
        'Go back to the box and open Sorted to confirm.',
      ],
    };
  }

  if (status === 'forreceiving') {
    return {
      tone: 'warning',
      lines: [
        'This plant is not hub-received yet.',
        'It will not appear in Total Plants to Fulfill or Awaiting to sort until it is received at the hub.',
        `Current status: ${displayStatus}.`,
      ],
    };
  }

  if (status === 'missing' || status === 'damaged' || status === 'needstostay') {
    const reason =
      status === 'needstostay'
        ? 'Need to stay'
        : status === 'missing'
          ? 'Missing'
          : 'Damaged';
    return {
      tone: 'warning',
      lines: [
        `This plant is excluded from Total Plants to Fulfill (${reason}).`,
        'It will not appear under Awaiting to sort for fulfillment work.',
        `Current status: ${displayStatus}.`,
      ],
    };
  }

  if (status === 'received') {
    return {
      tone: 'warning',
      lines: [
        'This scan did not mark the plant as sorted.',
        'It should still appear under Awaiting to sort in this receiver box.',
        `Current status: ${displayStatus}.`,
      ],
    };
  }

  return {
    tone: 'warning',
    lines: [
      'This plant is not part of the fulfill workflow for this receiver box.',
      `Current status: ${displayStatus}.`,
    ],
  };
}

/** Stable box key from display receiver name — one box per receiver. */
export function buildReceiverBoxKeyFromName(receiverName) {
  const name = String(receiverName || '').trim() || 'Unassigned Receiver';
  return (
    `RX-${String(name)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}` || 'RX-UNASSIGNED'
  );
}

/** Merge API boxes that share the same receiver into one card. */
export function mergeSortingReceiverBoxesByReceiver(boxes = []) {
  const merged = new Map();

  boxes.forEach((box) => {
    const receiverName = String(box?.receiverName || 'Unassigned Receiver').trim();
    const boxKey = buildReceiverBoxKeyFromName(receiverName);
    const existing = merged.get(boxKey);

    if (!existing) {
      merged.set(boxKey, {
        ...box,
        boxKey,
        receiverName,
        receiverFirstName:
          box.receiverFirstName ||
          receiverName.split(/\s+/)[0].toLowerCase(),
        joiners: [...(box.joiners || [])],
        plants: [...(box.plants || [])],
      });
      return;
    }

    existing.plants.push(...(box.plants || []));
    existing.joiners = [
      ...new Set([...(existing.joiners || []), ...(box.joiners || [])]),
    ].sort((a, b) => a.localeCompare(b));
    if (!existing.avatar && box.avatar) existing.avatar = box.avatar;
    if (!existing.username && box.username) existing.username = box.username;
    if (!existing.buyerUid && box.buyerUid) existing.buyerUid = box.buyerUid;
  });

  return [...merged.values()].map((box) => {
    const metrics = computeSortingBoxMetrics(box.plants);
    return {
      ...box,
      ...metrics,
      plants: sortPlantsForSortingBoxList(box.plants),
      joiners: [...(box.joiners || [])].sort((a, b) => a.localeCompare(b)),
    };
  });
}

/** Display sort key: genus + species, then plant code. */
function sortingPlantSortKey(plant) {
  const name = [plant?.genus, plant?.species].filter(Boolean).join(' ').trim();
  if (name) return name.toLowerCase();
  return String(plant?.plantCode || '').trim().toLowerCase();
}

/** Plants in a receiver box — A→Z by name, then plant code. */
export function sortPlantsForSortingBoxList(plants = []) {
  return [...plants].sort((a, b) => {
    const nameCmp = sortingPlantSortKey(a).localeCompare(sortingPlantSortKey(b), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    if (nameCmp !== 0) return nameCmp;
    return String(a.plantCode || '').localeCompare(String(b.plantCode || ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });
}
