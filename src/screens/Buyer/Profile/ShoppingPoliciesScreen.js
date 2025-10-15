import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

const ShoppingPoliciesScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const policies = [
    {
      title: 'ileafU Leafy Shop Policies',
      content:
        'Read Before Your Plant Takes Flight ✈\nFriendly guidelines to keep every Plant Flight fair, smooth, and scam-free.',
    },
    {
      subtitle: '1. Welcome to ileafU Marketplace',
      content:
        'ileafU connects plant lovers with trusted gardens across Thailand, Indonesia, and the Philippines. Every listing travels through our Plant Flight system, built for safe and transparent importing. These leafy policies keep everything fair, clear, and enjoyable for all users.',
    },
    {
      subtitle: '2. Before You Checkout',
      content:
        'Adding a plant to your cart does not reserve it. Only successful payment confirms your plant’s spot on the flight. Listings remain live and can be claimed by another buyer if checkout is not completed.',
    },
    {
      subtitle: '3. Payment & 10-Minute Re-Checkout Window',
      content:
        'If your payment fails or times out:\n- You’ll see a notice: “Payment Failed — Re-checkout to Secure Your Plant.”\n- You have 10 minutes to retry checkout.\n- After 10 minutes, the plant returns to public listings.\n- Repeated failed checkout loops to hold plants is considered unfair use.',
    },
    {
      subtitle: '4. Shipping Buddy System (Receiver & Joiners)',
      content:
        'A Receiver is the main account for a Plant Flight and must have an active paid order.\n- Joiners ride under the Receiver’s flight and must be approved.\n- A Receiver cannot be a Joiner in the same flight.\n- A Joiner can only be assigned to one Receiver per flight.\n- Joiners will automatically follow the Receiver’s UPS shipping method and cannot select separately.',
    },
    {
      subtitle: '5. Air Cargo Fees & Shipping Credit (Single Plant Listings Only — Receiver Only)',
      content:
        'Base Air Cargo Fee is $150, and it applies only to single plant listings.\n- This cargo fee is paid only by the Receiver at checkout.\n- Wholesale plants have separate cargo charges and do not count toward this $150 air cargo fee or toward Shipping Credit eligibility.\n- The $150 cargo fee becomes free as Shipping Credit when: ■ There are 15 or more single plant listings in the combined order (Receiver + Joiners) ■ And the total spend reaches $500 or more\n- Once conditions are met, a $150 Shipping Credit is applied back to the Receiver’s wallet only.\n- Joiners do not receive Shipping Credit, as they do not pay air cargo fees.',
    },
    {
      subtitle: '6. Plant Flight Options',
      content:
        'Plant Flights depart based on the origin country:\n- Thailand: Ships every week\n- Indonesia: Ships once a month\n- Philippines: Ships once a month\nIf you order plants only from Thailand, your Plant Flight options will be weekly. If you mix plants from different countries, your shipment will follow the next available combined flight, which may be later than Thailand-only orders. During checkout, you will be shown three available Plant Flight schedules to choose from. If you already have an existing order on an upcoming flight, new plants added before cut-off will automatically join the same flight. Cut-Off Rule: The cut-off date is 5 days before the Plant Flight date — after this, new plants cannot join that flight and will be scheduled for the next one.',
    },
    {
      subtitle: '7. Domestic UPS Delivery (Final Leg)',
      content:
        'Once plants arrive in the U.S. and pass USDA inspection, they continue via UPS:\n- $50 for the first plant (charged to Receiver)\n- $5 for each additional plant in the same flight\nThis UPS fee is tied to the Receiver’s delivery, and Joiners share the same delivery route.',
    },
    {
      subtitle: '8. Live Arrival Guarantee',
      content:
        'If a plant arrives dead on delivery, you may request compensation in Shipping Credit or plant value credit, issued to the Receiver’s account.\n- Claims must be submitted within the official claim window.\n- Mild import stress—like leaf yellowing, softness, or droop—is considered normal and not covered.',
    },
    {
      subtitle: '9. Sensitive Species Not Covered by Guarantee',
      content:
        'The following genera are known to be high-risk during import and are not eligible for Live Arrival Guarantee: Begonia, Peperomia, Dioscorea, Ficus\nThese species may melt even under ideal packing conditions — please order only if you are confident in high-risk plant acclimation.',
    },
    {
      subtitle: '10. Claim & Photo Rules',
      content:
        'To file a valid claim:\n1. Take clear photos of the dead plant immediately upon opening — dead is defined as having no viable node.\n2. Submit your claim through your Order Status “Plants Are Home” within 12 hours of delivery, based on the UPS delivery timestamp on the tracking log. Claims submitted after 12 hours, or after repotting, trimming, or overnight holding, are not eligible.',
    },
    {
      subtitle: '11. Cancellations & Order Changes',
      content:
        'Once a plant is marked “Ready to Fly,” it is locked in for export and cannot be canceled or modified. If payment fails but you still want the plant, you must re-checkout within 10 minutes before it returns to public listings.',
    },
    {
      subtitle: '12. Wholesale Orders',
      content:
        'Wholesale bundles ship under a different cargo structure.\n- Wholesale plants have their own cargo fee.\n- They do not count toward the 15 plant / $500 Shipping Credit promotion unless specifically stated.',
    },
    {
      subtitle: '13. Leaf Points, Shipping Credit & Promotions',
      content:
        'Shipping Credit applies only to the Receiver’s account after eligible flights.\n- Leaf Points may be earned during events and applied like store credit.\n- Credits reduce future checkout totals but cannot be converted to cash or withdrawn.',
    },
    {
      subtitle: '14. Fair Marketplace Rules',
      content:
        'To protect the marketplace:\n- No cart blocking via repeated failed payments.\n- No duplicate accounts to bypass restrictions.\n- Chargeback abuse may lead to account suspension and loss of credits.',
    },
    {
      subtitle: '15. Leafy Dictionary',
      content:
        'Plant Flight: Grouped shipment cycle from Asia to the U.S.\nReceiver: Main buyer who pays cargo and receives UPS delivery.\nJoiner: Buyer approved under the Receiver to share cargo and UPS delivery.\nReady to Fly: Payment confirmed — plant queued for export.\nFinal Boarding: Last call stage — no edits or cancellations allowed.\nShipping Credit: $150 cargo refund given only to the Receiver after qualifying conditions.\nMelt / Import Shock: Natural leaf stress not considered a dead plant.\nMissing Plant: A plant that never arrives or is lost in transit — eligible for credit.',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <View style={[styles.header, {paddingTop: insets.top + 10}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Policies</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {policies.map((item, idx) => (
          <View key={idx} style={styles.copySection}>
            {item.title && (
              <View style={styles.titleSection}>
                <Text style={styles.titleText}>{item.title}</Text>
              </View>
            )}
            {item.subtitle && (
              <Text style={styles.subtitleText}>{item.subtitle}</Text>
            )}
            <Text style={styles.contentText}>{item.content}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    width: '100%',
    minHeight: 100,
  },
  backButton: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
    flex: 1,
  },
  headerSpacer: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingBottom: 34,
  },
  copySection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    width: '100%',
  },
  titleSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 16,
    gap: 12,
    width: '100%',
  },
  titleText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#202325',
    width: '100%',
  },
  subtitleText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    width: '100%',
  },
  contentText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    width: '100%',
  },
});

export default ShoppingPoliciesScreen;
