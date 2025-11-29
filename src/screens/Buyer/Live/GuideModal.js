import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';

const GuideModal = ({ isVisible, onClose }) => {
  return (
    <Modal
      animationType="slide" // Keep slide animation
      transparent={true}   // Make modal transparent to control background
      visible={isVisible}
      onRequestClose={onClose}>
      {/* This overlay ensures the background is white and pushes content down */}
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <BackSolidIcon width={24} height={24} color="#393D40" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Shop Guidelines</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>
          <ScrollView style={styles.container}>
            <View style={styles.content}>
              <Text style={styles.lastUpdatedText}>Last updated October 30, 2025</Text>
              <Text style={styles.bodyText}>ileafU Leafy Shopping Policies Read Before Your Plant Takes Flight ✈ Friendly guidelines to keep
every Plant Flight fair, smooth, and scam-free.</Text>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>1</Text>
                <Text style={styles.bulletText}>Welcome to ileafU Marketplace ileafU connects plant lovers with trusted gardens across Thailand,
Indonesia, and the Philippines. Every listing travels through our Plant Flight system, built for safe and
transparent importing. These leafy policies keep everything fair, clear, and enjoyable for all users.</Text>
              </View>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>2</Text>
                <Text style={styles.bulletText}>Before You Checkout Adding a plant to your cart does not reserve it. Only successful payment
confirms your plant’s spot on the flight. Listings remain live and can be claimed by another buyer if
checkout is not completed.</Text>
              </View>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>3</Text>
                <Text style={styles.bulletText}>Payment & 10-Minute Re-Checkout Window If your payment fails or times out: - You’ll see a notice:
“Payment Failed — Re-checkout to Secure Your Plant.” - You have 10 minutes to retry checkout. - After
10 minutes, the plant returns to public listings. - Repeated failed checkout loops to hold plants is
considered unfair use.</Text>
              </View>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>4</Text>
                <Text style={styles.bulletText}>Shipping Buddy System (Receiver & Joiners) - A Receiver is the main account for a Plant Flight and
must have an active paid order. - Joiners ride under the Receiver’s flight and must be approved. - A
Receiver cannot be a Joiner in the same flight. - A Joiner can only be assigned to one Receiver per
flight. - Joiners will automatically follow the Receiver’s UPS shipping method and cannot select
separately.</Text>
              </View>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>5</Text>
                <Text style={styles.bulletText}>Air Cargo Fees & Shipping Credit (Single Plant Listings Only — Receiver Only) - Base Air Cargo Fee
is $150, and it applies only to single plant listings. - This cargo fee is paid only by the Receiver at
checkout. - Wholesale plants have separate cargo charges and do not count toward this $150 air cargo
fee or toward Shipping Credit eligibility. - The $150 cargo fee becomes free as Shipping Credit when: 
There are 15 or more single plant listings in the combined order (Receiver + Joiners) And the total
spend reaches $500 or more - Once conditions are met, a $150 Shipping Credit is applied back to the
Receiver’s wallet only. - Joiners do not receive Shipping Credit, as they do not pay air cargo fees.</Text>
              </View>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>6</Text>
                <Text style={styles.bulletText}>Plant Flight Options Plant Flights depart based on the origin country: - Thailand: Ships every week -
Indonesia: Ships once a month - Philippines: Ships once a month If you order plants only from
Thailand, your Plant Flight options will be weekly. If you mix plants from different countries, your
shipment will follow the next available combined flight, which may be later than Thailand-only orders.
During checkout, you will be shown three available Plant Flight schedules to choose from. If you
already have an existing order on an upcoming flight, new plants added before cut-off will automatically
join the same flight. Cut-Off Rule: The cut-off date is 5 days before the Plant Flight date — after this,
new plants cannot join that flight and will be scheduled for the next one.</Text>
              </View>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>7</Text>
                <Text style={styles.bulletText}>Domestic UPS Delivery (Final Leg) Once plants arrive in the U.S. and pass USDA inspection, they
continue via UPS: - $50 for the first plant (charged to Receiver) - $5 for each additional plant in the
same flight This UPS fee is tied to the Receiver’s delivery, and Joiners share the same delivery route.
8. Live Arrival Guarantee If a plant arrives dead on delivery, you may request compensation in Shipping
Credit or plant value credit, issued to the Receiver’s account. - Claims must be submitted within the
official claim window. - Mild import stress—like leaf yellowing, softness, or droop—is considered normal
and not covered.</Text>
              </View>
               <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>8</Text>
                <Text style={styles.bulletText}>Live Arrival Guarantee If a plant arrives dead on delivery, you may request compensation in Shipping
Credit or plant value credit, issued to the Receiver’s account. - Claims must be submitted within the
official claim window. - Mild import stress—like leaf yellowing, softness, or droop—is considered normal
and not covered.</Text>
              </View>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>9</Text>
                <Text style={styles.bulletText}>Sensitive Species Not Covered by Guarantee The following genera are known to be high-risk during
import and are not eligible for Live Arrival Guarantee: Begonia, Peperomia, Dioscorea, Ficus These
species may melt even under ideal packing conditions — please order only if you are confident in
high-risk plant acclimation.</Text>
              </View>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>10</Text>
                <Text style={styles.bulletText}>Claim & Photo Rules To file a valid claim: 1. Take clear photos of the dead plant immediately upon
opening — dead is defined as having no viable node. 2. Submit your claim through your Order Status
“Plants Are Home” within 12 hours of delivery, based on the UPS delivery timestamp on the tracking
log. Claims submitted after 12 hours, or after repotting, trimming, or overnight holding, are not eligible.</Text>
              </View>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>11</Text>
                <Text style={styles.bulletText}>Cancellations & Order Changes Once a plant is marked “Ready to Fly,” it is locked in for export and
cannot be canceled or modified. If payment fails but you still want the plant, you must re-checkout
within 10 minutes before it returns to public listings.</Text>
              </View>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>12</Text>
                <Text style={styles.bulletText}>Wholesale Orders Wholesale bundles ship under a different cargo structure. - Wholesale plants
have their own cargo fee. - They do not count toward the 15 plant / $500 Shipping Credit promotion
unless specifically stated.</Text>
              </View>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>13</Text>
                <Text style={styles.bulletText}>Leaf Points, Shipping Credit & Promotions - Shipping Credit applies only to the Receiver’s account
after eligible flights. - Leaf Points may be earned during events and applied like store credit. - Credits
reduce future checkout totals but cannot be converted to cash or withdrawn.</Text>
              </View>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>14</Text>
                <Text style={styles.bulletText}>Fair Marketplace Rules To protect the marketplace: - No cart blocking via repeated failed payments.
- No duplicate accounts to bypass restrictions. - Chargeback abuse may lead to account suspension
and loss of credits.</Text>
              </View>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletSymbol}>15</Text>
                <Text style={styles.bulletText}>Leafy Dictionary Plant Flight: Grouped shipment cycle from Asia to the U.S. Receiver: Main buyer
who pays cargo and receives UPS delivery. Joiner: Buyer approved under the Receiver to share cargo
and UPS delivery. Ready to Fly: Payment confirmed — plant queued for export. Final Boarding: Last
call stage — no edits or cancellations allowed. Shipping Credit: $150 cargo refund given only to the
Receiver after qualifying conditions. Melt / Import Shock: Natural leaf stress not considered a dead
plant. Missing Plant: A plant that never arrives or is lost in transit — eligible for credit.</Text>
              </View>
            </View>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
            </View>
            {/* <View style={styles.content}>
              <Text style={styles.bodyText}>NO REFUND,RETURN,EXCHANGE.</Text>
              <Text style={styles.bodyTextBottom}>
                While we encourage sellers to establish clear and detailed shop
                policies, it's important to ensure these policies align with
                ILeafU's platform policies and Terms and Conditions. 
              </Text>
              <Text style={styles.bodyTextBottom}>If there's ever a conflict between a seller's shop policies and
                ILeafU's platform policies, our platform's policies will be
                prioritized to maintain a fair and consistent experience for all
                users. </Text>
              <Text style={styles.bodyTextBottom}> For more details or assistance, please reach out to
                ILeafU's Customer Support team.</Text>
            </View> */}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Set the background color here
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 28, // to balance the header
  },
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  lastUpdatedText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#647276',
  },
  bodyText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22.4, // 140% of 16px
    color: '#393D40',
  },
  bodyTextBottom: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22.4, // 140% of 16px
    color: '#393D40',
    marginBottom: 10,
  },
  dividerContainer: {
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 0, // Space between bullet points
    alignItems: 'flex-start', // Align items to the top if text wraps
  },
  bulletSymbol: {
    fontSize: 16, // Adjust size as needed
    marginRight: 8, // Space between bullet and text
    lineHeight: 22, // Match lineHeight of bulletText for alignment
    color: '#333', // Adjust color as needed
  },
  bulletText: {
    flex: 1, // Allow text to wrap
    fontSize: 16, // Adjust size as needed
    lineHeight: 22, // Adjust line spacing as needed
    color: '#333', // Adjust color as needed
  },
});

export default GuideModal;
