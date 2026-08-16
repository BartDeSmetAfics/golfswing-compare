export const SWING_PHASES = [
  "ADDRESS",
  "TAKEAWAY",
  "TOP_OF_BACKSWING",
  "DOWNSWING_TRANSITION",
  "IMPACT",
  "FOLLOW_THROUGH",
] as const;

export type SwingPhase = (typeof SWING_PHASES)[number];

export const SWING_PHASE_LABELS: Record<SwingPhase, string> = {
  ADDRESS: "Address",
  TAKEAWAY: "Takeaway",
  TOP_OF_BACKSWING: "Top of backswing",
  DOWNSWING_TRANSITION: "Downswing",
  IMPACT: "Impact",
  FOLLOW_THROUGH: "Follow-through",
};

export const CLUB_TYPES = ["IRON", "DRIVER", "CHIP", "PUTT"] as const;
export type ClubType = (typeof CLUB_TYPES)[number];

export const CAMERA_ANGLES = ["FACE_ON", "DOWN_THE_LINE"] as const;
export type CameraAngle = (typeof CAMERA_ANGLES)[number];

export const CAMERA_ANGLE_LABELS: Record<CameraAngle, string> = {
  FACE_ON: "Tegenover (face-on)",
  DOWN_THE_LINE: "Van achter (down-the-line)",
};
