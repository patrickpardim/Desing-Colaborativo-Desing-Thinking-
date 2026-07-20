export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  isFacilitator: boolean;
  votesLeft: number;
  online: boolean;
}

export interface Idea {
  id: string;
  text: string;
  color: NoteColor;
  columnId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  votes: number; // For total votes/likes
  reactions: Record<string, number>;
  votedUsersByEmoji?: Record<string, string[]>; // Map of emoji -> participant IDs who voted
  hidden: boolean;
  createdAt: number;
}

export type RoomTemplate = 'design-thinking' | 'sticky-board';
export type RoomStatus = 'waiting' | 'active' | 'voting' | 'locked';

export interface RoomColumn {
  id: string;
  title: string;
  color: string; // border/accent color class
  locked: boolean;
}

export interface Room {
  pin: string;
  title: string;
  facilitatorName: string;
  template: RoomTemplate;
  status: RoomStatus;
  timerSeconds: number;
  timerActive: boolean;
  anonymizeAuthors: boolean;
  autoTimer: boolean;
  maxVotesPerPerson: number;
}

export interface BroadcastMessage {
  type: 'SYNC_ROOM' | 'SYNC_IDEAS' | 'SYNC_PARTICIPANTS' | 'ADD_IDEA' | 'UPDATE_IDEA' | 'DELETE_IDEA' | 'REACTION' | 'VOTE' | 'TRIGGER_BOT_ACTIVITY';
  payload: any;
  senderId: string;
}
