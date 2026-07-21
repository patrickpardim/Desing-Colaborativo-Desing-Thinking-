import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, ensureAuth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Room, Idea, Participant, RoomColumn } from '../types';

// Create a new room with columns and initial facilitator in Firestore
export async function createRoomInFirestore(
  room: Room,
  columns: RoomColumn[],
  facilitator: Participant
): Promise<void> {
  await ensureAuth();
  const roomPath = `rooms/${room.pin}`;
  try {
    // 1. Create Room document
    await setDoc(doc(db, 'rooms', room.pin), {
      ...room,
      createdAt: Date.now()
    });

    // 2. Create Column documents
    for (const col of columns) {
      await setDoc(doc(db, 'rooms', room.pin, 'columns', col.id), col);
    }

    // 3. Create Facilitator Participant document
    await setDoc(
      doc(db, 'rooms', room.pin, 'participants', facilitator.id),
      facilitator
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, roomPath);
  }
}

// Join room by adding/updating participant doc in Firestore
export async function joinRoomInFirestore(
  pin: string,
  participant: Participant
): Promise<Room | null> {
  await ensureAuth();
  const roomPath = `rooms/${pin}`;
  try {
    const roomSnap = await getDoc(doc(db, 'rooms', pin));
    if (!roomSnap.exists()) {
      return null;
    }

    await setDoc(
      doc(db, 'rooms', pin, 'participants', participant.id),
      participant,
      { merge: true }
    );

    return roomSnap.data() as Room;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, roomPath);
    return null;
  }
}

// List all active rooms from Firestore (for onboarding list)
export async function fetchRoomsFromFirestore(): Promise<Room[]> {
  await ensureAuth();
  const path = 'rooms';
  try {
    const querySnap = await getDocs(collection(db, 'rooms'));
    const rooms: Room[] = [];
    querySnap.forEach((docSnap) => {
      if (docSnap.exists()) {
        rooms.push(docSnap.data() as Room);
      }
    });
    return rooms;
  } catch (error) {
    console.warn("Could not fetch rooms from Firestore, fallback to local:", error);
    return [];
  }
}

// Realtime subscription to room document
export function subscribeToRoom(
  pin: string,
  onRoomUpdate: (room: Room | null) => void
) {
  const roomPath = `rooms/${pin}`;
  return onSnapshot(
    doc(db, 'rooms', pin),
    (docSnap) => {
      if (docSnap.exists()) {
        onRoomUpdate(docSnap.data() as Room);
      } else {
        onRoomUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, roomPath);
    }
  );
}

// Realtime subscription to columns
export function subscribeToColumns(
  pin: string,
  onColumnsUpdate: (columns: RoomColumn[]) => void
) {
  const path = `rooms/${pin}/columns`;
  return onSnapshot(
    collection(db, 'rooms', pin, 'columns'),
    (snapshot) => {
      const cols: RoomColumn[] = [];
      snapshot.forEach((colDoc) => {
        cols.push(colDoc.data() as RoomColumn);
      });
      onColumnsUpdate(cols);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Realtime subscription to ideas
export function subscribeToIdeas(
  pin: string,
  onIdeasUpdate: (ideas: Idea[]) => void
) {
  const path = `rooms/${pin}/ideas`;
  return onSnapshot(
    collection(db, 'rooms', pin, 'ideas'),
    (snapshot) => {
      const ideas: Idea[] = [];
      snapshot.forEach((ideaDoc) => {
        ideas.push(ideaDoc.data() as Idea);
      });
      // Sort ideas by createdAt ascending
      ideas.sort((a, b) => a.createdAt - b.createdAt);
      onIdeasUpdate(ideas);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Realtime subscription to participants
export function subscribeToParticipants(
  pin: string,
  onParticipantsUpdate: (participants: Participant[]) => void
) {
  const path = `rooms/${pin}/participants`;
  return onSnapshot(
    collection(db, 'rooms', pin, 'participants'),
    (snapshot) => {
      const participants: Participant[] = [];
      snapshot.forEach((pDoc) => {
        participants.push(pDoc.data() as Participant);
      });
      onParticipantsUpdate(participants);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Update room settings or status
export async function updateRoomInFirestore(
  pin: string,
  updateData: Partial<Room>
): Promise<void> {
  await ensureAuth();
  const roomPath = `rooms/${pin}`;
  try {
    await updateDoc(doc(db, 'rooms', pin), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, roomPath);
  }
}

// Update column lock state or title
export async function updateColumnInFirestore(
  pin: string,
  columnId: string,
  updateData: Partial<RoomColumn>
): Promise<void> {
  await ensureAuth();
  const path = `rooms/${pin}/columns/${columnId}`;
  try {
    await updateDoc(doc(db, 'rooms', pin, 'columns', columnId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Add idea
export async function addIdeaToFirestore(
  pin: string,
  idea: Idea
): Promise<void> {
  await ensureAuth();
  const path = `rooms/${pin}/ideas/${idea.id}`;
  try {
    await setDoc(doc(db, 'rooms', pin, 'ideas', idea.id), idea);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Update idea (text, column, votes, reactions, color, etc.)
export async function updateIdeaInFirestore(
  pin: string,
  ideaId: string,
  updateData: Partial<Idea>
): Promise<void> {
  await ensureAuth();
  const path = `rooms/${pin}/ideas/${ideaId}`;
  try {
    await updateDoc(doc(db, 'rooms', pin, 'ideas', ideaId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete idea
export async function deleteIdeaInFirestore(
  pin: string,
  ideaId: string
): Promise<void> {
  await ensureAuth();
  const path = `rooms/${pin}/ideas/${ideaId}`;
  try {
    await deleteDoc(doc(db, 'rooms', pin, 'ideas', ideaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Update participant
export async function updateParticipantInFirestore(
  pin: string,
  participantId: string,
  updateData: Partial<Participant>
): Promise<void> {
  await ensureAuth();
  const path = `rooms/${pin}/participants/${participantId}`;
  try {
    await updateDoc(
      doc(db, 'rooms', pin, 'participants', participantId),
      updateData
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Terminate room
export async function terminateRoomInFirestore(pin: string): Promise<void> {
  await ensureAuth();
  const path = `rooms/${pin}`;
  try {
    await deleteDoc(doc(db, 'rooms', pin));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
