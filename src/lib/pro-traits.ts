import type { Locale } from "./i18n";

export interface ProTrait {
  icon: string;
  title: string;
  description: string;
}

export interface ProBio {
  slug: string;
  tagline: string;
  /** Path relative to /public — e.g. "/pros/bryson-dechambeau.webp" */
  avatarPath?: string;
  traits: ProTrait[];
}

type L = { nl: string; en: string; fr: string };

interface RawProTrait {
  icon: string;
  title: L;
  description: L;
}

interface RawProBio {
  slug: string;
  tagline: L;
  avatarPath?: string;
  traits: RawProTrait[];
}

const RAW_PRO_BIOS: Record<string, RawProBio> = {
  "bryson-dechambeau": {
    slug: "bryson-dechambeau",
    avatarPath: "/pros/bryson-dechambeau.webp",
    tagline: {
      en: "The Scientist — power golf through physics",
      nl: "De Wetenschapper — krachtigolf door fysica",
      fr: "Le Scientifique — golf de puissance par la physique",
    },
    traits: [
      {
        icon: "💪",
        title: {
          en: "Explosive Power",
          nl: "Explosieve kracht",
          fr: "Puissance explosive",
        },
        description: {
          en: "Generates elite clubhead speed by maximising ground reaction forces — he pushes hard into the ground on the downswing to create upward energy through the body.",
          nl: "Genereert elite clubhoofdsnelheid door maximale grondreactieskrachten — hij duwt hard de grond in op de neerwingse slag om opwaartse energie door het lichaam te creëren.",
          fr: "Génère une vitesse de tête de club d'élite en maximisant les forces de réaction au sol — il pousse fort dans le sol lors de la descente pour créer une énergie ascendante dans le corps.",
        },
      },
      {
        icon: "🎯",
        title: {
          en: "Rock-Solid Head Position",
          nl: "Rotsvaste hoofdpositie",
          fr: "Position de tête immuable",
        },
        description: {
          en: "His head barely moves from address through impact, giving the swing a consistent axis to rotate around. This is the foundation of his repeatability.",
          nl: "Zijn hoofd beweegt nauwelijks van adres tot impact, waardoor de swing een consistente rotatie-as heeft. Dit is de basis van zijn herhaalbaarheid.",
          fr: "Sa tête bouge à peine de l'adresse jusqu'à l'impact, donnant au swing un axe de rotation cohérent. C'est le fondement de sa répétabilité.",
        },
      },
      {
        icon: "🔄",
        title: {
          en: "Aggressive Hip Rotation",
          nl: "Agressieve heuprotatie",
          fr: "Rotation des hanches agressive",
        },
        description: {
          en: "Hips clear early and fast in the downswing, creating a powerful lag in the arms and club that releases at impact for maximum energy transfer.",
          nl: "Heupen draaien vroeg en snel in de neerwingse slag, wat een krachtige achterstand in de armen en de club creëert die bij impact vrijkomt voor maximale energieoverdracht.",
          fr: "Les hanches s'effacent tôt et rapidement dans la descente, créant un retard puissant dans les bras et le club qui se libère à l'impact pour un transfert d'énergie maximal.",
        },
      },
      {
        icon: "📐",
        title: {
          en: "Upright Swing Plane",
          nl: "Steile swinghelling",
          fr: "Plan de swing vertical",
        },
        description: {
          en: "Swings on a steep, upright plane. This promotes shaft compression at impact and is part of his physics-based, single-plane approach to the iron swing.",
          nl: "Swingt op een steile, verticale helling. Dit bevordert schachtcompressie bij impact en maakt deel uit van zijn op fysica gebaseerde, éénplans benadering van de ijzerswing.",
          fr: "Swingue sur un plan raide et vertical. Cela favorise la compression de la shaft à l'impact et fait partie de son approche à plan unique basée sur la physique.",
        },
      },
      {
        icon: "🦶",
        title: {
          en: "Strong Footwork",
          nl: "Krachtig voetwerk",
          fr: "Travail des pieds puissant",
        },
        description: {
          en: "Distinct heel lift in the backswing and a powerful leg drive through the ball. He treats the ground like a launch pad, not just a platform.",
          nl: "Duidelijke hielopheffing in de teruggaande swing en een krachtige beendrang door de bal. Hij behandelt de grond als een startplatform, niet alleen als een steun.",
          fr: "Élévation distincte du talon lors du backswing et une poussée puissante des jambes à travers la balle. Il traite le sol comme une rampe de lancement, pas seulement comme un support.",
        },
      },
    ],
  },

  "grant-horvat": {
    slug: "grant-horvat",
    avatarPath: "/pros/grant-horvat.webp",
    tagline: {
      en: "Pure tempo and natural athleticism",
      nl: "Puur tempo en natuurlijk atletisme",
      fr: "Tempo pur et athlétisme naturel",
    },
    traits: [
      {
        icon: "🌊",
        title: {
          en: "Silky Smooth Tempo",
          nl: "Zijdezacht tempo",
          fr: "Tempo d'une fluidité soyeuse",
        },
        description: {
          en: "Maintains a consistent 3:1 backswing-to-downswing tempo — the rhythm most instructors point to as ideal. Every swing feels unhurried even when hitting hard.",
          nl: "Houdt een consistent 3:1 tempo aan tussen teruggaande en neerwingse swing — het ritme dat de meeste leraren als ideaal beschouwen. Elke swing voelt ontspannen aan, ook als hij hard slaat.",
          fr: "Maintient un tempo constant de 3:1 entre le backswing et la descente — le rythme que la plupart des instructeurs considèrent comme idéal. Chaque swing semble détendu même quand il frappe fort.",
        },
      },
      {
        icon: "⚙️",
        title: {
          en: "Perfect Sequencing",
          nl: "Perfecte volgorde",
          fr: "Séquencement parfait",
        },
        description: {
          en: "Hips lead the downswing and the arms follow naturally. This kinematic sequence — ground up — is what separates good ball-strikers from great ones.",
          nl: "Heupen leiden de neerwingse swing en de armen volgen van nature. Deze kinematische volgorde — van de grond omhoog — scheidt goede balstrijkers van geweldige.",
          fr: "Les hanches mènent la descente et les bras suivent naturellement. Cette séquence cinématique — du sol vers le haut — distingue les bons frappeurs de balle des grands.",
        },
      },
      {
        icon: "⚖️",
        title: {
          en: "Athletic Balanced Finish",
          nl: "Atletische, evenwichtige finish",
          fr: "Finish athlétique et équilibré",
        },
        description: {
          en: "Always arrives at a full, balanced finish with weight fully transferred to the lead side. If you can't hold your finish, you didn't swing well.",
          nl: "Komt altijd aan bij een volledige, evenwichtige finish met het gewicht volledig overgedragen naar de voorste zijde. Als je je finish niet kunt vasthouden, heb je niet goed geswingd.",
          fr: "Arrive toujours à une position finale complète et équilibrée avec le poids entièrement transféré sur le côté avant. Si vous ne pouvez pas tenir votre finish, vous n'avez pas bien swingué.",
        },
      },
      {
        icon: "✋",
        title: {
          en: "Neutral Grip",
          nl: "Neutrale greep",
          fr: "Grip neutre",
        },
        description: {
          en: "A neutral-to-slightly-strong grip that promotes a consistent, natural square face at impact — no compensations needed in the downswing.",
          nl: "Een neutrale tot licht sterke greep die een consistente, natuurlijke vierkante face bij impact bevordert — geen compensaties nodig in de neerwingse swing.",
          fr: "Un grip neutre à légèrement fort qui favorise une face naturellement carrée et cohérente à l'impact — pas de compensations nécessaires dans la descente.",
        },
      },
      {
        icon: "🎯",
        title: {
          en: "Shaft Lean at Impact",
          nl: "Schachthelling bij impact",
          fr: "Inclinaison de la shaft à l'impact",
        },
        description: {
          en: "Consistently compresses the ball with forward shaft lean, trapping the ball before the turf. This is the single biggest sign of a skilled iron player.",
          nl: "Comprimeert de bal consistent met voorwaartse schachthelling, waardoor de bal vóór de zode wordt getrappt. Dit is het duidelijkste teken van een bedreven ijzerspeler.",
          fr: "Compresse la balle de manière constante avec une inclinaison avant de la shaft, piégeant la balle avant le gazon. C'est le signe le plus évident d'un joueur de fers qualifié.",
        },
      },
    ],
  },
};

function resolveLocale(raw: RawProBio, locale: Locale): ProBio {
  return {
    slug: raw.slug,
    avatarPath: raw.avatarPath,
    tagline: raw.tagline[locale],
    traits: raw.traits.map((t) => ({
      icon: t.icon,
      title: t.title[locale],
      description: t.description[locale],
    })),
  };
}

/** Returns bio with English strings — use getLocalizedProBio in locale-aware contexts. */
export function getProBio(slug: string): ProBio | null {
  const raw = RAW_PRO_BIOS[slug];
  if (!raw) return null;
  return resolveLocale(raw, "en");
}

export function getLocalizedProBio(slug: string, locale: Locale): ProBio | null {
  const raw = RAW_PRO_BIOS[slug];
  if (!raw) return null;
  return resolveLocale(raw, locale);
}
