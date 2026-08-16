export interface ProTrait {
  icon: string;
  title: string;
  description: string;
}

export interface ProBio {
  slug: string;
  tagline: string;
  /** Path relative to /public — e.g. "/pros/bryson-dechambeau.jpg" */
  avatarPath?: string;
  traits: ProTrait[];
}

export const PRO_BIOS: Record<string, ProBio> = {
  "bryson-dechambeau": {
    slug: "bryson-dechambeau",
    avatarPath: "/pros/bryson-dechambeau.webp",
    tagline: "The Scientist — power golf through physics",
    traits: [
      {
        icon: "💪",
        title: "Explosive Power",
        description:
          "Generates elite clubhead speed by maximising ground reaction forces — he pushes hard into the ground on the downswing to create upward energy through the body.",
      },
      {
        icon: "🎯",
        title: "Rock-Solid Head Position",
        description:
          "His head barely moves from address through impact, giving the swing a consistent axis to rotate around. This is the foundation of his repeatability.",
      },
      {
        icon: "🔄",
        title: "Aggressive Hip Rotation",
        description:
          "Hips clear early and fast in the downswing, creating a powerful lag in the arms and club that releases at impact for maximum energy transfer.",
      },
      {
        icon: "📐",
        title: "Upright Swing Plane",
        description:
          "Swings on a steep, upright plane. This promotes shaft compression at impact and is part of his physics-based, single-plane approach to the iron swing.",
      },
      {
        icon: "🦶",
        title: "Strong Footwork",
        description:
          "Distinct heel lift in the backswing and a powerful leg drive through the ball. He treats the ground like a launch pad, not just a platform.",
      },
    ],
  },
  "grant-horvat": {
    slug: "grant-horvat",
    avatarPath: "/pros/grant-horvat.webp",
    tagline: "Pure tempo and natural athleticism",
    traits: [
      {
        icon: "🌊",
        title: "Silky Smooth Tempo",
        description:
          "Maintains a consistent 3:1 backswing-to-downswing tempo — the rhythm most instructors point to as ideal. Every swing feels unhurried even when hitting hard.",
      },
      {
        icon: "⚙️",
        title: "Perfect Sequencing",
        description:
          "Hips lead the downswing and the arms follow naturally. This kinematic sequence — ground up — is what separates good ball-strikers from great ones.",
      },
      {
        icon: "⚖️",
        title: "Athletic Balanced Finish",
        description:
          "Always arrives at a full, balanced finish with weight fully transferred to the lead side. If you can't hold your finish, you didn't swing well.",
      },
      {
        icon: "✋",
        title: "Neutral Grip",
        description:
          "A neutral-to-slightly-strong grip that promotes a consistent, natural square face at impact — no compensations needed in the downswing.",
      },
      {
        icon: "🎯",
        title: "Shaft Lean at Impact",
        description:
          "Consistently compresses the ball with forward shaft lean, trapping the ball before the turf. This is the single biggest sign of a skilled iron player.",
      },
    ],
  },
};

export function getProBio(slug: string): ProBio | null {
  return PRO_BIOS[slug] ?? null;
}
