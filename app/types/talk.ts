export type NonEmptyArray<T> = [T, ...T[]];

export interface GenericData<T> {
  privateData: boolean;
  value: T;
}

export interface SpeakerDetail {
  name: string;
  id: string;
  data: {
    twitter: GenericData<string>;
    bio: GenericData<string>;
    'zip-code': GenericData<string>;
    residence: GenericData<string>;
  };
  email: string;
}

export interface SessionUpdate {
  hasUnpublishedChanges: boolean;
  speakerUpdates: any[];
  oldValues: any[];
}

export interface TalkUpdate {
  updatedBy: string;
  updatedAt: string;
  talkid: string;
}

export interface PkomFeedback {
  author: string;
  created: string;
  id: string;
  talkid: string;
  feedbacktype: string;
  info: string;
}

export interface TagWithAuthor {
  author: string;
  tag: string;
}

export interface FeedbackSummary {
  commentList: string[];
  usefulSum: number;
  count: number;
  enjoySum: number;
}

export interface TalkDetail {
  postedBy: string;
  lastUpdated: string;
  conferenceId: string;
  speakers: NonEmptyArray<SpeakerDetail>;
  sessionUpdates: SessionUpdate;
  talkUpdates: TalkUpdate[];
  sessionId: string;
  id: string;
  data: {
    intendedAudience: GenericData<string>;
    abstract: GenericData<string>;
    title: GenericData<string>;
    participation?: GenericData<string>;
    outline?: GenericData<string>;
    suggestedKeywords?: GenericData<string>;
    length?: GenericData<string>;
    format?: GenericData<string>;
    infoToProgramCommittee?: GenericData<string>;
    equipment?: GenericData<string>;
    language?: GenericData<string>;
    room?: GenericData<string>;
    startTime?: GenericData<string>;
    endTime?: GenericData<string>;
    pkomfeedbacks?: GenericData<PkomFeedback[]>;
    tagswithauthor?: GenericData<TagWithAuthor[]>;
    tags?: GenericData<string[]>;
    feedback?: GenericData<FeedbackSummary>;
    video?: GenericData<string>;
  };
  status?: string;
} 