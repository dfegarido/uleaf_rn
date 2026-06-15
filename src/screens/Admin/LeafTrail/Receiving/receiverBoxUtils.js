/** Shared receiver-box grouping — matches Sorting alphabetical order + 1-based box numbers. */

const normalizeLeafTrailStatusKey = (status) =>
    String(status || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');

/** Order receiver (customer) display name — never the hub admin who scanned. */
export const getOrderReceiverDisplayName = (item) => {
    if (item?.buyerName) {
        const name = String(item.buyerName).trim();
        if (name) return name;
    }

    const ri = item?.receiverInfo || {};
    const firstName = ri.receiverFirstName || ri.firstName || '';
    const lastName = ri.receiverLastName || ri.lastName || '';
    const fromReceiver = `${firstName} ${lastName}`.trim();
    if (fromReceiver) return fromReceiver;

    const bi = item?.buyerInfo || {};
    const fromBuyerInfo = `${bi.firstName || ''} ${bi.lastName || ''}`.trim();
    if (fromBuyerInfo) return fromBuyerInfo;

    return '';
};

export const getReceiverNameForBox = (item) => {
    const orderReceiver = getOrderReceiverDisplayName(item);
    if (orderReceiver) return orderReceiver;

    const storedName = item?.receivingBoxData?.receiverName
        ? String(item.receivingBoxData.receiverName).trim()
        : '';
    if (storedName && storedName.toLowerCase() !== 'unassigned receiver') {
        return storedName;
    }

    return 'Unassigned Receiver';
};

export const getReceiverUsernameForBox = (item) => {
    const fromApi = item?.receiverUsername ? String(item.receiverUsername).trim() : '';
    if (fromApi) return fromApi.replace(/^@/, '');

    const isJoiner = Boolean(item?.isJoinerOrder);
    const ri = item?.receiverInfo || {};
    if (isJoiner) {
        const receiverUsername = String(ri.receiverUsername || ri.username || '').trim();
        if (receiverUsername) return receiverUsername.replace(/^@/, '');
    }

    const bi = item?.buyerInfo || {};
    const buyerUsername = String(bi.username || '').trim();
    return buyerUsername ? buyerUsername.replace(/^@/, '') : '';
};

export const getReceiverFirstNameForBox = (receiverName) => {
    if (!receiverName || receiverName === 'Unassigned Receiver') return 'zzz';
    return receiverName.trim().split(/\s+/)[0].toLowerCase();
};

export const getJoinerNameForBox = (item) => {
    const fromApi = item?.joinerName ? String(item.joinerName).trim() : '';
    if (fromApi) return fromApi;

    const joinerInfo = item?.joinerInfo || {};
    const firstName =
        joinerInfo.firstName ||
        joinerInfo.joinerFirstName ||
        '';
    const lastName =
        joinerInfo.lastName ||
        joinerInfo.joinerLastName ||
        '';
    const fullName = `${firstName} ${lastName}`.trim();
    const username = String(joinerInfo.joinerUsername || joinerInfo.username || '')
        .trim()
        .replace(/^@/, '');
    if (fullName && username) return `${fullName} @${username}`;
    return fullName || username || null;
};

export const getReceiverUidForBox = (item) => {
    const receiverUid =
        item?.receiverInfo?.receiverUid || item?.receiverInfo?.receiverId || '';
    if (receiverUid) return String(receiverUid).trim();
    if (!item?.isJoinerOrder && item?.buyerUid) return String(item.buyerUid).trim();
    return '';
};

/** One box per customer (receiver UID), across all plant flights. */
export const getReceiverBoxGroupKey = (item) => {
    const uid = getReceiverUidForBox(item);
    if (uid) return `RX-UID-${uid}`;
    const storedKey = item?.receivingBoxData?.boxKey
        ? String(item.receivingBoxData.boxKey).trim()
        : '';
    if (storedKey) return storedKey;
    return getReceiverBoxKey(getReceiverNameForBox(item));
};

export const getReceiverBoxKey = (receiverName) =>
    `RX-${String(receiverName || 'UNASSIGNED')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'UNASSIGNED'}`;

/** Hub-scanned plants: received, sorted, or needs to stay (not forReceiving). */
export const isReceiverBoxScannedPlant = (item) => {
    const status = normalizeLeafTrailStatusKey(item?.leafTrailStatus);
    if (status === 'forreceiving') return false;
    if (status === 'received' || status === 'sorted' || status === 'needstostay') return true;
    if (item?.receivedDate) return true;
    return false;
};

/** @deprecated Use isReceiverBoxScannedPlant */
export const isHubReceivedPlant = isReceiverBoxScannedPlant;

export const getReceiverBoxPlantStatusPill = (item) => {
    const status = normalizeLeafTrailStatusKey(item?.leafTrailStatus);
    if (status === 'forreceiving') {
        return { label: 'Unscanned', variant: 'unscanned' };
    }
    if (status === 'sorted') {
        return { label: 'Sorted', variant: 'sorted' };
    }
    if (status === 'needstostay') {
        return { label: 'Need to Stay', variant: 'needsToStay' };
    }
    return { label: 'Scanned', variant: 'scanned' };
};

const getStoredReceiverBoxNumber = (item) => {
    const n = Number(item?.receivingBoxData?.boxNumber);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

const getBoxMemberItems = (box) => box?.items || box?.plants || [];

const compareReceiverNames = (a, b) => {
    const firstCmp = getReceiverFirstNameForBox(a).localeCompare(getReceiverFirstNameForBox(b));
    if (firstCmp !== 0) return firstCmp;
    return a.localeCompare(b);
};

/**
 * Stable sequential box numbers per receiver (1, 2, 3…).
 * Each receiver gets exactly one unique number; stale duplicate stored numbers are corrected.
 */
export const assignStableReceiverBoxNumbers = (boxes = []) => {
    const normalizedBoxes = boxes
        .map((box) => ({
            ...box,
            groupKey:
                box.groupKey ||
                (box.receiverUid ? `RX-UID-${box.receiverUid}` : '') ||
                getReceiverBoxKey(box.receiverName || ''),
            receiverName: String(box?.receiverName || '').trim(),
        }))
        .filter((box) => box.groupKey);

    const preferredByGroupKey = new Map();
    normalizedBoxes.forEach((box) => {
        const counts = new Map();
        getBoxMemberItems(box).forEach((item) => {
            const n = getStoredReceiverBoxNumber(item);
            if (n) counts.set(n, (counts.get(n) || 0) + 1);
        });
        if (counts.size) {
            const [best] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
            preferredByGroupKey.set(box.groupKey, best[0]);
        }
    });

    const groupKeys = [...new Set(normalizedBoxes.map((b) => b.groupKey))].sort((a, b) => {
        const nameA = normalizedBoxes.find((box) => box.groupKey === a)?.receiverName || '';
        const nameB = normalizedBoxes.find((box) => box.groupKey === b)?.receiverName || '';
        return compareReceiverNames(nameA, nameB);
    });

    const assignedByGroupKey = new Map();
    const usedNumbers = new Set();

    const takeNextFree = () => {
        let candidate = 1;
        while (usedNumbers.has(candidate)) candidate += 1;
        usedNumbers.add(candidate);
        return candidate;
    };

    groupKeys.forEach((groupKey) => {
        const preferred = preferredByGroupKey.get(groupKey);
        const boxNumber =
            preferred != null && !usedNumbers.has(preferred) ? preferred : takeNextFree();
        if (preferred != null && boxNumber === preferred) {
            usedNumbers.add(preferred);
        }
        assignedByGroupKey.set(groupKey, boxNumber);
    });

    return normalizedBoxes
        .map((box) => {
            const boxNumber = assignedByGroupKey.get(box.groupKey) || 0;
            const trayNumber = boxNumber ? String(boxNumber) : '';
            return {
                ...box,
                boxNumber,
                boxLabel: trayNumber,
                sortingTrayNumber: trayNumber,
            };
        })
        .filter((box) => box.boxNumber > 0)
        .sort((a, b) => a.boxNumber - b.boxNumber);
};

/** Group plants into receiver boxes sorted A→Z; assigns stable boxNumber 1…N. */
export const groupItemsIntoSortedReceiverBoxes = (items = []) => {
    const grouped = new Map();

    items.forEach((item) => {
        if (!item?.id) return;
        const receiverName = getReceiverNameForBox(item);
        const groupKey = getReceiverBoxGroupKey(item);
        const receiverUid = getReceiverUidForBox(item);
        const existing = grouped.get(groupKey) || {
            groupKey,
            receiverUid,
            receiverName,
            receiverUsername: '',
            items: [],
            scannedCount: 0,
            unscannedCount: 0,
            joiners: new Set(),
        };

        if (!existing.receiverUid && receiverUid) {
            existing.receiverUid = receiverUid;
        }

        const orderReceiverName = getOrderReceiverDisplayName(item);
        if (orderReceiverName) {
            existing.receiverName = orderReceiverName;
        } else if (
            receiverName &&
            receiverName !== 'Unassigned Receiver' &&
            existing.receiverName === 'Unassigned Receiver'
        ) {
            existing.receiverName = receiverName;
        }

        if (!existing.receiverUsername) {
            const username = getReceiverUsernameForBox(item);
            if (username) existing.receiverUsername = username;
        }

        existing.items.push(item);
        if (isReceiverBoxScannedPlant(item)) {
            existing.scannedCount += 1;
        } else {
            existing.unscannedCount += 1;
        }

        const joinerName = getJoinerNameForBox(item);
        if (joinerName) {
            existing.joiners.add(joinerName);
        }

        grouped.set(groupKey, existing);
    });

    return assignStableReceiverBoxNumbers([...grouped.values()].map((box) => ({
        ...box,
        joiners: [...box.joiners].sort((a, b) => a.localeCompare(b)),
    })));
};

/** Flat list for assignReceiverBoxes API — one row per plant with shared boxNumber per receiver. */
export const buildReceiverBoxAssignments = (items = []) => {
    const boxes = groupItemsIntoSortedReceiverBoxes(items);
    const assignments = [];

    boxes.forEach((box) => {
        const receiverFirstName = getReceiverFirstNameForBox(box.receiverName);
        const boxKey = box.groupKey || getReceiverBoxKey(box.receiverName);
        const joiners = box.joiners;

        box.items.forEach((item) => {
            const joinerName = getJoinerNameForBox(item);
            assignments.push({
                orderId: item.id,
                receiverName: box.receiverName,
                receiverFirstName,
                boxKey,
                boxNumber: box.boxNumber,
                joiners: joinerName ? [joinerName] : joiners,
            });
        });
    });

    return assignments;
};

export const receiverBoxAssignmentSignature = (assignments = []) =>
    assignments
        .map((a) => `${a.orderId}:${a.receiverName}:${a.boxNumber}`)
        .sort()
        .join('|');

/** Only persist assignments when box # or receiver name changed on the order. */
export const filterReceiverBoxAssignmentsNeedingPersist = (items = [], assignments = []) => {
    const itemById = new Map(items.map((item) => [item.id, item]));
    return assignments.filter((assignment) => {
        const item = itemById.get(assignment.orderId);
        if (!item) return true;
        const stored = item.receivingBoxData || {};
        const storedNumber = Number(stored.boxNumber);
        const storedName = String(stored.receiverName || '').trim();
        const storedKey = String(stored.boxKey || '').trim();
        if (
            Number.isFinite(storedNumber) &&
            storedNumber === assignment.boxNumber &&
            storedName === assignment.receiverName &&
            (!assignment.boxKey || !storedKey || storedKey === assignment.boxKey)
        ) {
            return false;
        }
        return true;
    });
};

/** Plants eligible for receiver boxes on the Received tab. */
export const mergeReceivingItemsForReceiverBoxes = (receiverBoxPlants = []) =>
    (receiverBoxPlants || []).filter((item) => item?.id);

/** Resolve receiver-box plants from API (supports legacy forReceiving + received merge). */
export const getReceiverBoxPlantsFromReceivingResponse = (response) => {
    if (Array.isArray(response?.receiverBoxPlants?.data)) {
        return response.receiverBoxPlants.data;
    }
    const deduped = new Map();
    [...(response?.forReceiving?.data || []), ...(response?.received?.data || [])].forEach((item) => {
        if (item?.id) deduped.set(item.id, item);
    });
    return [...deduped.values()];
};
