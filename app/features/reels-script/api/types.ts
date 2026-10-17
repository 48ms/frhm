export type ReelGoal = 'reach' | 'sends' | 'saves' | 'comments' | 'follows'
export type ReelLengthTier = '15-30s' | '30-60s' | '60-90s'
export type ReelAudioType = 'original_voice' | 'trending_audio_in_app'

export interface ReelBeat {
  timecode: string
  beatName: string
  visualShot: string
  veoPrompt?: string
  onScreenText: string // Sound-off first
  spokenAudio: string
  audioCue?: string
}

export interface ReelsScriptResult {
  title: string
  conceptOneIdea: string
  goal: ReelGoal
  lengthTier: ReelLengthTier
  audioType: ReelAudioType
  sendsQuestion: string
  coverFrameBrief: {
    gridSafeVisual: string
    centerBoldText: string
  }
  instagramSeo: {
    primaryKeyword: string
    secondaryKeywords: string[]
    captionOpener: string
  }
  audioNotes: string
  beats: ReelBeat[]
}

export interface GenerateReelsScriptInput {
  clientId: string
  topic: string
  clientName?: string
  goal?: ReelGoal
  lengthTier?: ReelLengthTier
  audioType?: ReelAudioType
  specificAngle?: string
}

export interface GenerateReelsScriptResponse {
  success: boolean
  data?: ReelsScriptResult
  error?: string
}
