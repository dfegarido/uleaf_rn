const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("../util/firebaseAdmin");
const db = admin.firestore();

exports.getPendingPaymentOrders = onCall(async (request) => {
  try {
    const { plantCode, transactionNumber, sort = 'desc', limit = 10, lastDocId } = request.data;

    let query = db.collection('orders').where('status', '==', 'pending_payment');

    if (plantCode) {
      query = query.where('plantCode', '==', plantCode);
    }

    if (transactionNumber) {
      query = query.where('transactionNumber', '==', transactionNumber);
    }

    // Sorting
    query = query.orderBy('createdAt', sort === 'asc' ? 'asc' : 'desc');

    // Pagination
    if (lastDocId) {
      const lastDocSnapshot = await db.collection('orders').doc(lastDocId).get();
      if (lastDocSnapshot.exists) {
        query = query.startAfter(lastDocSnapshot);
      }
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: orders, lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null };
  } catch (error) {
    console.error("Error fetching pending payment orders:", error);
    throw new HttpsError('internal', 'Failed to fetch orders', error.message);
  }
});

exports.updateOrderToReadyToFly = onCall(async (request) => {
  try {
    const { orderIds } = request.data;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new HttpsError('invalid-argument', 'orderIds must be a non-empty array');
    }

    const batch = db.batch();
    
    orderIds.forEach(id => {
      const ref = db.collection('orders').doc(id);
      batch.update(ref, { status: 'Ready to Fly', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    });

    await batch.commit();

    return { success: true, message: `${orderIds.length} orders updated to Ready to Fly` };
  } catch (error) {
    console.error("Error updating orders:", error);
    throw new HttpsError('internal', 'Failed to update orders', error.message);
  }
});

exports.deletePendingOrder = onCall(async (request) => {
  try {
    const { orderId } = request.data;

    if (!orderId) {
      throw new HttpsError('invalid-argument', 'orderId is required');
    }

    await db.runTransaction(async (t) => {
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await t.get(orderRef);

      if (!orderDoc.exists) {
        throw new HttpsError('not-found', 'Order not found');
      }

      const orderData = orderDoc.data();
      const deletedOrderRef = db.collection('deletedOrders').doc(orderId);

      t.set(deletedOrderRef, { ...orderData, deletedAt: admin.firestore.FieldValue.serverTimestamp() });
      t.delete(orderRef);
    });

    return { success: true, message: 'Order deleted successfully' };
  } catch (error) {
    console.error("Error deleting order:", error);
    throw new HttpsError('internal', 'Failed to delete order', error.message);
  }
});
