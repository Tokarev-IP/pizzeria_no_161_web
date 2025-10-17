import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
  getDocsFromCache,
  getDocsFromServer,
  setDoc,
  doc
} from "firebase/firestore";
import { db } from "./FirebaseConfig";
import { FirebasePizzaData, FirebaseOrderData, FirebaseEmailData, MAIN_COLLECTION_PATH, MAIN_DOCUMENT_ID } from "./FirebaseData";
import { getDoc } from "firebase/firestore";

// Collection names
const PIZZAS_COLLECTION = "pizza";
const ORDERS_COLECTION = "order";
const MAIL_COLLECTION = "mail";

/**
 * Test Firestore connection and permissions
 */
export const testFirestoreConnection = async (): Promise<void> => {
  try {
    console.log('🧪 Testing Firestore connection...');
    const pizzasRef = collection(db, PIZZAS_COLLECTION);
    const q = query(pizzasRef);
    
    // Try to get just one document to test connection
    const querySnapshot = await getDocs(q);
    console.log('✅ Firestore connection successful!', {
      collection: PIZZAS_COLLECTION,
      documentCount: querySnapshot.size,
      empty: querySnapshot.empty
    });
    
    if (querySnapshot.empty) {
      console.warn('⚠️ Collection is empty - no documents found');
    }
    
  } catch (error: any) {
    console.error('❌ Firestore connection failed:', error);
    throw error;
  }
};

/**
 * Get all pizza data from Firestore with cache support
 */
export const getPizzaData = async (useCache: boolean = true): Promise<FirebasePizzaData[]> => {
  try {
    console.log("Starting pizza data fetch...", { useCache });
    const pizzasRef = collection(db, PIZZAS_COLLECTION);
    const q = query(pizzasRef, orderBy("price"));
    
    let querySnapshot: QuerySnapshot<DocumentData>;
    
    if (useCache) {
      try {
        // Try to get from cache first
        querySnapshot = await getDocsFromCache(q);
        console.log("✅ Pizza data loaded from cache", { 
          count: querySnapshot.size,
          fromCache: querySnapshot.metadata.fromCache 
        });
      } catch (cacheError) {
        // If cache fails, get from server
        console.log("Cache miss, fetching from server...");
        querySnapshot = await getDocsFromServer(q);
        console.log("✅ Pizza data loaded from server", { 
          count: querySnapshot.size,
          fromCache: querySnapshot.metadata.fromCache 
        });
      }
    } else {
      // Force load from server
      querySnapshot = await getDocsFromServer(q);
      console.log("✅ Pizza data loaded from server (cache disabled)", { 
        count: querySnapshot.size,
        fromCache: querySnapshot.metadata.fromCache 
      });
    }
    
    const pizzas: FirebasePizzaData[] = [];
    console.log(`Processing ${querySnapshot.size} documents from Firestore...`);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Processing document ${doc.id}:`, data);
      
      // Validate required fields
      if (data.name && typeof data.price === 'number' && data.description) {
        const pizzaData = {
          id: doc.id,
          name: data.name,
          price: data.price,
          description: data.description,
          photoUri: data.photoUri || null,
          available: data.available !== undefined ? data.available : true
        } as FirebasePizzaData;
        
        pizzas.push(pizzaData);
        console.log(`✅ Valid pizza added:`, pizzaData, `available: ${pizzaData.available}`);
      } else {
        console.warn(`❌ Invalid pizza data for document ${doc.id}:`, {
          hasName: !!data.name,
          hasPrice: typeof data.price === 'number',
          hasDescription: !!data.description,
          hasAvailable: data.available !== undefined,
          availableValue: data.available,
          priceType: typeof data.price,
          priceValue: data.price,
          fullData: data
        });
      }
    });
    
    if (pizzas.length === 0) {
      console.warn("⚠️ No valid pizza data found in Firestore");
    } else {
      console.log("🎉 Successfully loaded pizza data", { 
        count: pizzas.length,
        pizzas: pizzas.map(p => ({ id: p.id, name: p.name, price: p.price }))
      });
    }
    
    return pizzas;
  } catch (error: any) {
    console.error("Error getting pizza data:", error);
    
    // Provide more specific error messages
    if (error.code === 'permission-denied') {
      throw new Error("Permission denied. Please check your Firestore security rules.");
    } else if (error.code === 'unavailable') {
      throw new Error("Firestore is currently unavailable. Please try again later.");
    } else if (error.code === 'unauthenticated') {
      throw new Error("Authentication required. Please sign in again.");
    } else {
      throw new Error(`Failed to fetch pizza data: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Upload order data to Firestore
 */
export const uploadOrderData = async (orderData: Omit<FirebaseOrderData, "id">): Promise<string> => {
  try {
    const ordersRef = collection(db, ORDERS_COLECTION);
    const id = crypto.randomUUID();
    const orderDocRef = doc(ordersRef, id);
    await setDoc(orderDocRef, {
      ...orderData,
      id,
      // Keep the provided scheduled time; add createdAt only
      createdAt: serverTimestamp()
    });
    return id;
  } catch (error) {
    console.error("Error uploading order data:", error);
    throw new Error("Failed to upload order data");
  }
};

/**
 * Upload email message to Firestore `mail` collection for processing by Email extension
 */
export const uploadEmailMessage = async (emailData: FirebaseEmailData): Promise<string> => {
  try {
    const mailRef = collection(db, MAIL_COLLECTION);
    const id = crypto.randomUUID();
    const messageDocRef = doc(mailRef, id);
    await setDoc(messageDocRef, {
      ...emailData,
      createdAt: serverTimestamp()
    } as any);
    return id;
  } catch (error) {
    const err: any = error;
    console.error("Error uploading email message:", {
      code: err?.code,
      message: err?.message,
      details: err
    });
    throw new Error(err?.message || "Failed to upload email message");
  }
};

/**
 * Fetch main open/closed status from Firestore
 */
export const getMainOpenStatus = async (): Promise<boolean> => {
  try {
    const mainDocRef = doc(collection(db, MAIN_COLLECTION_PATH), MAIN_DOCUMENT_ID);
    const snap = await getDoc(mainDocRef);
    if (!snap.exists()) {
      console.warn("Main document not found; assuming open=true");
      return true;
    }
    const data = snap.data() as any;
    const isOpen = typeof data?.open === "boolean" ? data.open : true;
    return isOpen;
  } catch (error: any) {
    console.error("Error fetching main open status:", error);
    // Fail-open to avoid blocking users on transient errors
    return true;
  }
};
