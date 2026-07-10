import {
  describeSortingScanPlantOutcome,
  normalizeLeafTrailStatus,
} from './sortingBoxMetrics';

/** Human-readable leaf trail status for scan messages. */
export function formatLeafTrailStatusLabel(status) {
  const raw = String(status || '').trim();
  if (raw && /[A-Z]/.test(raw.slice(1))) {
    return raw;
  }
  const norm = normalizeLeafTrailStatus(status);
  const labels = {
    forreceiving: 'For Receiving',
    received: 'Received',
    sorted: 'Sorted',
    packed: 'Packed',
    missing: 'Missing',
    damaged: 'Damaged',
    needstostay: 'Need to Stay',
    others: 'Others',
    shipping: 'Shipping',
    shipped: 'Shipped',
    active: 'Active',
  };
  return labels[norm] || raw || 'Unknown';
}

function outcome(title, tone, lines) {
  return {
    title,
    tone,
    lines: lines.filter(Boolean),
  };
}

function mishapOutcome(status, displayStatus) {
  if (status === 'missing') {
    return outcome('Plant is Missing', 'warning', [
      'This plant is tagged as Missing.',
      'It cannot move forward through a normal hub scan until resolved.',
      `Current status: ${displayStatus}.`,
      'Check the Missing tab in Receiving or contact your supervisor.',
    ]);
  }
  if (status === 'damaged') {
    return outcome('Plant is Damaged', 'warning', [
      'This plant is tagged as Damaged.',
      'It cannot move forward through a normal hub scan until resolved.',
      `Current status: ${displayStatus}.`,
      'Check the Damaged tab in Receiving.',
    ]);
  }
  if (status === 'needstostay') {
    return outcome('Plant Needs to Stay', 'warning', [
      'This plant is hanging in Sorting (Need to Stay).',
      'It is excluded from Packing until it is ready and scanned as Sorted.',
      `Current status: ${displayStatus}.`,
    ]);
  }
  if (status === 'others') {
    return outcome('Plant in Others', 'warning', [
      'This plant is in the Others category.',
      `Current status: ${displayStatus}.`,
      'Check the Others tab in Receiving.',
    ]);
  }
  return null;
}

function alreadyScannedLines(displayStatus, previousStatus, statusUpdated) {
  if (statusUpdated) return [];
  const lines = [
    'This plant was already scanned — no status change was made.',
    `Current status: ${displayStatus}.`,
  ];
  if (previousStatus && previousStatus !== displayStatus) {
    lines.push(`Previous status: ${previousStatus}.`);
  }
  return lines;
}

function updatedLines(displayStatus, previousStatus) {
  const lines = [`Status is now ${displayStatus}.`];
  if (previousStatus && previousStatus !== displayStatus) {
    lines.unshift(`Updated from ${previousStatus} to ${displayStatus}.`);
  }
  return lines;
}

/**
 * User-facing title + message after a hub QR scan.
 * @returns {{ title: string, tone: 'success' | 'warning' | 'info', lines: string[] }}
 */
export function describeScanQrOutcome(plant, context = {}) {
  const {
    intakeMode = false,
    sortingBoxMode = false,
    packingTrayMode = false,
    sourceTabKey = '',
    targetLeafTrailStatus = null,
  } = context;

  const status = normalizeLeafTrailStatus(plant?.leafTrailStatus);
  const displayStatus = formatLeafTrailStatusLabel(plant?.leafTrailStatus);
  const previousStatus = formatLeafTrailStatusLabel(plant?.previousLeafTrailStatus);
  const statusUpdatedKnown = typeof plant?.statusUpdated === 'boolean';
  const statusUpdated = plant?.statusUpdated === true;
  const statusUnchanged = plant?.statusUpdated === false;
  const isReceivingScan = intakeMode || sourceTabKey === 'forReceiving';
  const targetStatus = normalizeLeafTrailStatus(targetLeafTrailStatus);

  const mishap = mishapOutcome(status, displayStatus);
  // Needs to Stay hangs in Sorting until ready — allow sort scan to mark it Sorted.
  const allowNeedsToStaySortScan =
    sortingBoxMode && status === 'needstostay' && targetStatus === 'sorted';
  if (mishap && !allowNeedsToStaySortScan && (statusUnchanged || !statusUpdatedKnown)) {
    return mishap;
  }

  if (isReceivingScan) {
    if (status === 'received') {
      if (statusUpdated) {
        return outcome('Marked as Received', 'success', [
          'This plant was successfully received at the hub.',
          ...updatedLines(displayStatus, previousStatus),
          'It will appear in the Received tab.',
        ]);
      }
      if (statusUnchanged) {
        return outcome('Already Received', 'warning', [
          'This plant was already scanned and received at the hub.',
          ...alreadyScannedLines(displayStatus, previousStatus, statusUpdated),
        ]);
      }
      return outcome('Received', 'info', [
        `Current status: ${displayStatus}.`,
        'If this plant was already received, no status change was made.',
        'Check the Received tab to confirm.',
      ]);
    }
    if (status === 'forreceiving') {
      return outcome('Still For Receiving', 'warning', [
        'This plant is still waiting to be received.',
        'The scan did not update the status.',
        `Current status: ${displayStatus}.`,
        'Try scanning again or check with your supervisor.',
      ]);
    }
    if (status === 'sorted') {
      return outcome('Already in Sorting', 'warning', [
        'This plant has already moved past receiving — it is in Sorting.',
        ...alreadyScannedLines(displayStatus, previousStatus, statusUpdated),
        'Find it under Plant Sorting by receiver name.',
      ]);
    }
    if (status === 'packed' || status === 'shipping' || status === 'shipped') {
      return outcome('Already Processed', 'warning', [
        `This plant is already past receiving (status: ${displayStatus}).`,
        'It cannot be received again via this scan.',
      ]);
    }
    if (mishap) return mishap;
  }

  if (sortingBoxMode) {
    if (statusUpdated && status === 'sorted') {
      return outcome('Marked as Sorted', 'success', [
        'This plant was sorted into this receiver box.',
        ...updatedLines(displayStatus, previousStatus),
        'It counts toward Total Plants to Fulfill and appears under the Sorted tab.',
        'It can now move to Packing.',
      ]);
    }
    if (statusUnchanged && status === 'sorted') {
      return outcome('Already Sorted', 'warning', [
        'This plant was already scanned and sorted in this box.',
        ...alreadyScannedLines(displayStatus, previousStatus, statusUpdated),
        'Open the Sorted tab in this receiver box to confirm.',
      ]);
    }
    const sortingDetail = describeSortingScanPlantOutcome(plant);
    if (sortingDetail) {
      const title =
        status === 'received' && !statusUpdated
          ? 'Not Sorted Yet'
          : mishap
            ? mishap.title
            : 'Scan Complete';
      return outcome(title, sortingDetail.tone, sortingDetail.lines);
    }
  }

  if (packingTrayMode) {
    if (statusUpdated && status === 'packed') {
      return outcome('Marked as Packed', 'success', [
        'This plant was packed into this tray.',
        ...updatedLines(displayStatus, previousStatus),
      ]);
    }
    if (statusUnchanged && status === 'packed') {
      return outcome('Already Packed', 'warning', [
        'This plant was already scanned and packed.',
        ...alreadyScannedLines(displayStatus, previousStatus, statusUpdated),
      ]);
    }
    if (status !== 'sorted' && status !== 'packed') {
      return outcome('Cannot Pack Yet', 'warning', [
        `This plant must be Sorted before it can be packed.`,
        `Current status: ${displayStatus}.`,
        'Complete sorting first, then scan again in the packing tray.',
      ]);
    }
    if (status === 'sorted' && statusUnchanged) {
      return outcome('Not Packed Yet', 'warning', [
        'This plant is Sorted but was not marked Packed by this scan.',
        `Current status: ${displayStatus}.`,
        'Confirm the tray number and try again.',
      ]);
    }
  }

  if (targetStatus === 'sorted') {
    if (statusUpdated && status === 'sorted') {
      return outcome('Marked as Sorted', 'success', [
        'This plant was marked as Sorted.',
        ...updatedLines(displayStatus, previousStatus),
      ]);
    }
    if (statusUnchanged && status === 'sorted') {
      return outcome('Already Sorted', 'warning', [
        'This plant was already scanned and sorted.',
        ...alreadyScannedLines(displayStatus, previousStatus, statusUpdated),
      ]);
    }
    if (status === 'received') {
      return outcome(
        statusUpdated ? 'Marked as Sorted' : 'Not Sorted',
        statusUpdated ? 'success' : 'warning',
        statusUpdated
          ? updatedLines(displayStatus, previousStatus)
          : [
              'This plant is Received but was not marked Sorted.',
              `Current status: ${displayStatus}.`,
            ],
      );
    }
    if (mishap) return mishap;
  }

  if (targetStatus === 'packed') {
    if (statusUpdated && status === 'packed') {
      return outcome('Marked as Packed', 'success', [
        'This plant was marked as Packed.',
        ...updatedLines(displayStatus, previousStatus),
      ]);
    }
    if (statusUnchanged && status === 'packed') {
      return outcome('Already Packed', 'warning', [
        'This plant was already scanned and packed.',
        ...alreadyScannedLines(displayStatus, previousStatus, statusUpdated),
      ]);
    }
    if (mishap) return mishap;
  }

  if (targetStatus === 'shipping' || targetStatus === 'shipped') {
    const label = targetStatus === 'shipped' ? 'Shipped' : 'Shipping';
    if (statusUpdated && status === targetStatus) {
      return outcome(`Marked as ${label}`, 'success', updatedLines(displayStatus, previousStatus));
    }
    if (statusUnchanged && status === targetStatus) {
      return outcome(`Already ${label}`, 'warning', [
        `This plant was already scanned and marked ${label}.`,
        ...alreadyScannedLines(displayStatus, previousStatus, statusUpdated),
      ]);
    }
  }

  if (mishap) return mishap;

  if (statusUpdated) {
    return outcome('Scan Success!', 'success', updatedLines(displayStatus, previousStatus));
  }

  if (statusUnchanged) {
    return outcome('Already Scanned', 'info', [
      ...alreadyScannedLines(displayStatus, previousStatus, statusUpdated),
      'Review the plant details below.',
    ]);
  }

  return outcome('Scan Complete', 'info', [
    `Current status: ${displayStatus}.`,
    statusUpdatedKnown
      ? 'Review the plant details below.'
      : 'If the status did not change, this plant may have already been scanned.',
  ]);
}

/** True when a For Receiving intake scan newly marked the plant received. */
export function isNewReceivingIntakeScan(plant, { intakeMode = false, sourceTabKey = '' } = {}) {
  if (!plant) return false;
  const status = normalizeLeafTrailStatus(plant.leafTrailStatus);
  const isReceivingScan = intakeMode || sourceTabKey === 'forReceiving';
  return isReceivingScan && status === 'received' && plant.statusUpdated === true;
}
