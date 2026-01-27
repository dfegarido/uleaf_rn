import { useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { AuthContext } from '../auth/AuthProvider';

/**
 * Custom hook to track unread message count for the current user
 * Returns the total number of chats with unread messages
 * Updates in real-time using Firestore listeners
 */
export const useUnreadMessageCount = () => {
  const { userInfo } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user UID - handle different userInfo structures
    const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';

    if (!currentUserUid) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      // Query all chats where the user is a participant
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participantIds', 'array-contains', currentUserUid),
      );

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(
        chatsQuery,
        (snapshot) => {
          try {
            let count = 0;
            
            snapshot.forEach((doc) => {
              const chatData = doc.data();
              const unreadBy = chatData.unreadBy || [];
              
              // Check if current user is in the unreadBy array
              if (Array.isArray(unreadBy) && unreadBy.includes(currentUserUid)) {
                count++;
              }
            });

            setUnreadCount(count);
            setLoading(false);
          } catch (error) {
            console.error('Error processing unread messages:', error);
            setUnreadCount(0);
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error listening to unread messages:', error);
          setUnreadCount(0);
          setLoading(false);
        }
      );

      // Cleanup subscription on unmount
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up unread message listener:', error);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [userInfo]);

  return { unreadCount, loading };
};

