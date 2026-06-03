/** Shared receiver-box grouping — matches Sorting alphabetical order + 1-based box numbers. */

export const getReceiverNameForBox = (item) => {
    const storedName = item?.receivingBoxData?.receiverName
        ? String(item.receivingBoxData.receiverName).trim()
        : '';
    if (storedName && storedName.toLowerCase() !== 'unassigned receiver') {
        return storedName;
    }
    if (item?.user?.name) return item.user.name.trim();
    const firstName = item?.receiverInfo?.firstName || item?.receiverInfo?.receiverFirstName || '';
    const lastName = item?.receiverInfo?.lastName || item?.receiverInfo?.receiverLastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;
    const buyerInfo = item?.buyerInfo || {};
    const fromBuyerInfo = `${buyerInfo.firstName || ''} ${buyerInfo.lastName || ''}`.trim();
    if (fromBuyerInfo) return fromBuyerInfo;
    if (item?.buyerName) return String(item.buyerName).trim();
    return 'Unassigned Receiver';
};

export const getReceiverFirstNameForBox = (receiverName) => {
    if (!receiverName || receiverName === 'Unassigned Receiver') return 'zzz';
    return receiverName.trim().split(/\s+/)[0].toLowerCase();
};

export const getJoinerNameForBox = (item) => {
    const joinerInfo = item?.joinerInfo || {};
    const firstName =
        joinerInfo.firstName ||
        joinerInfo.joinerFirstName ||
        item?.buyerInfo?.firstName ||
        '';
    const lastName =
        joinerInfo.lastName ||
        joinerInfo.joinerLastName ||
        item?.buyerInfo?.lastName ||
        '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || joinerInfo.username || joinerInfo.joinerUsername || null;
};

export const getReceiverBoxKey = (receiverName) =>
    `RX-${String(receiverName || 'UNASSIGNED')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'UNASSIGNED'}`;

export const isHubReceivedPlant = (item) => {
    const status = String(item?.leafTrailStatus || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');
    if (status === 'received') return true;
    if (item?.receivedDate) return true;
    return false;
};

/** Group plants into receiver boxes sorted A→Z; assigns boxNumber 1…N. */
export const groupItemsIntoSortedReceiverBoxes = (items = []) => {
    const grouped = new Map();

    items.forEach((item) => {
        if (!item?.id) return;
        const receiverName = getReceiverNameForBox(item);
        const existing = grouped.get(receiverName) || {
            receiverName,
            items: [],
            scannedCount: 0,
            unscannedCount: 0,
            joiners: new Set(),
        };

        existing.items.push(item);
        if (isHubReceivedPlant(item)) {
            existing.scannedCount += 1;
        } else {
            existing.unscannedCount += 1;
        }

        const joinerName = getJoinerNameForBox(item);
        if (joinerName) {
            existing.joiners.add(joinerName);
        }

        grouped.set(receiverName, existing);
    });

    return [...grouped.values()]
        .map((box) => ({
            ...box,
            joiners: [...box.joiners].sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => {
            const firstNameSort = getReceiverFirstNameForBox(a.receiverName).localeCompare(
                getReceiverFirstNameForBox(b.receiverName),
            );
            if (firstNameSort !== 0) return firstNameSort;
            return a.receiverName.localeCompare(b.receiverName);
        })
        .map((box, index) => {
            const storedNumbers = box.items
                .map((p) => Number(p?.receivingBoxData?.boxNumber))
                .filter((n) => Number.isFinite(n) && n > 0);
            const boxNumber =
                storedNumbers.length && storedNumbers.every((n) => n === storedNumbers[0])
                    ? storedNumbers[0]
                    : index + 1;
            return {
                ...box,
                boxNumber,
                boxLabel: String(boxNumber),
            };
        });
};

/** Flat list for assignReceiverBoxes API — one row per plant with shared boxNumber per receiver. */
export const buildReceiverBoxAssignments = (items = []) => {
    const boxes = groupItemsIntoSortedReceiverBoxes(items);
    const assignments = [];

    boxes.forEach((box) => {
        const receiverFirstName = getReceiverFirstNameForBox(box.receiverName);
        const boxKey = getReceiverBoxKey(box.receiverName);
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

/** Merge forReceiving + received lists (deduped by order id) for box assignment scope. */
export const mergeReceivingItemsForReceiverBoxes = (forReceivingData = [], receivedData = []) => {
    const deduped = new Map();
    [...forReceivingData, ...receivedData].forEach((item) => {
        if (item?.id) deduped.set(item.id, item);
    });
    return [...deduped.values()];
};
