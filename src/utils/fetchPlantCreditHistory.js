/**
 * Fetches plant credit transaction history for a buyer.
 * Used by both Admin (PlantCreditsManagement) and Buyer (BuyerPlantCreditsScreen).
 */
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export async function fetchPlantCreditHistory(buyerUid) {
  const allTransactions = [];

  try {
    const creditsSnap = await getDocs(
      query(
        collection(db, 'credit_transactions'),
        where('buyerUid', '==', buyerUid)
      )
    );

    for (const docSnapshot of creditsSnap.docs) {
      const data = docSnapshot.data();
      const isShippingCredit =
        data.creditType?.toLowerCase().includes('shipping') ||
        data.type?.toLowerCase().includes('shipping');

      if (!isShippingCredit) {
        const transaction = {
          id: docSnapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : new Date(),
        };
        transaction.plantCode = data.plantCode || data.plantDetails?.plantCode;
        transaction.plantName = data.plantName || data.plantDetails?.plantName;
        transaction.plantImage = data.plantImage || data.plantDetails?.plantImage || data.plantDetails?.image;

        let fetchedOrderData = null;

        if (data.orderId) {
          try {
            let orderData = null;
            if (data.orderId.startsWith('TXN')) {
              const orderQuery = await getDocs(
                query(collection(db, 'order'), where('trxNumber', '==', data.orderId), limit(1))
              );
              if (!orderQuery.empty) orderData = orderQuery.docs[0].data();
            } else {
              const orderDoc = await getDoc(doc(db, 'order', data.orderId));
              if (orderDoc.exists()) orderData = orderDoc.data();
            }

            if (orderData) {
              fetchedOrderData = orderData;
              transaction.orderDate = orderData.createdAt?.toDate ? orderData.createdAt.toDate() : null;
              let plants = orderData.products || orderData.items || [];

              if (plants?.length > 0) {
                let plant = plants.find(p => p.plantCode === transaction.plantCode) || (plants.length === 1 ? plants[0] : null);
                if (plant) {
                  if (!transaction.plantName) transaction.plantName = plant.plantName || plant.scientificName || plant.name;
                  if (!transaction.plantImage) transaction.plantImage = plant.plantImage || plant.image || plant.photoUrl;
                  if (!transaction.plantCode) transaction.plantCode = plant.plantCode || plant.code;
                }
              } else if (orderData.plantCode) {
                transaction.plantCode = orderData.plantCode;
                transaction.plantName = orderData.plantName;
                transaction.plantImage = orderData.plantImage || orderData.imagePrimary;
                transaction.genus = orderData.genus;
                transaction.species = orderData.species;
                transaction.unitPrice = orderData.unitPrice || orderData.usdPrice;
              }
            }
          } catch (_) {}
        }

        if (data.processedBy?.length > 20) {
          try {
            const adminDoc = await getDoc(doc(db, 'admin', data.processedBy));
            transaction.processedByName = adminDoc.exists()
              ? `${adminDoc.data().firstName || ''} ${adminDoc.data().lastName || ''}`.trim() || adminDoc.data().email
              : data.processedBy;
          } catch (_) {
            transaction.processedByName = data.processedBy;
          }
        } else {
          transaction.processedByName = data.processedBy;
        }

        if (transaction.plantCode && (!transaction.plantName || !transaction.plantImage)) {
          try {
            const listingsSnap = await getDocs(
              query(collection(db, 'listings'), where('plantCode', '==', transaction.plantCode), limit(1))
            );
            if (!listingsSnap.empty) {
              const ld = listingsSnap.docs[0].data();
              if (!transaction.plantName) transaction.plantName = ld.plantName || ld.scientificName || ld.name;
              if (!transaction.plantImage) transaction.plantImage = ld.plantImage || ld.image || ld.photoUrl || ld.images?.[0];
              transaction.genus = ld.genus;
              transaction.species = ld.species;
            } else if (fetchedOrderData) {
              if (!transaction.plantName) transaction.plantName = fetchedOrderData.plantName || (fetchedOrderData.genus && fetchedOrderData.species ? `${fetchedOrderData.genus} ${fetchedOrderData.species}` : fetchedOrderData.scientificName);
              if (!transaction.plantImage) transaction.plantImage = fetchedOrderData.plantImage || fetchedOrderData.imagePrimary;
              if (!transaction.genus) transaction.genus = fetchedOrderData.genus;
              if (!transaction.species) transaction.species = fetchedOrderData.species;
              if (!transaction.unitPrice) transaction.unitPrice = fetchedOrderData.unitPrice || fetchedOrderData.usdPrice;
            }
          } catch (_) {}
        }

        allTransactions.push(transaction);
      }
    }

    allTransactions.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error fetching plant credit history:', err);
  }

  return allTransactions;
}
