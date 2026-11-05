// EDIT YOUR TREATMENT MENU HERE.
// Reorder categories or services by moving their objects in these arrays.
// Move a service to another category by moving its complete object.
// IDs must be unique across the entire menu. Keep IDs stable for future integration.
// Prices are in SEK. Added groups, treatments, prices and times are fictional placeholders.
// duration is the displayed treatment time in minutes; edit it per service.
// Calendar reservations still use fixed 60-minute blocks independently.
// Empty categories are shown with a short message and cannot be booked.
const APPOINTMENT_DURATION = 60;
const CURRENCY = 'SEK';

const serviceCategories = [
  {
    id: 'consultations',
    name: 'Konsultationer',
    services: [
      {
        id: 'consultation',
        name: 'Hudanalys',
        price: 0,
        duration: 30,
        description: 'Vi analyserar din hud och skapar en personlig plan utifrån dina behov. Kostnadsfritt och utan förpliktelser.'
      },
      {
        id: 'follow-up',
        name: 'Uppföljande hudsamtal',
        price: 350,
        duration: 20,
        description: 'Vi följer upp din hudvårdsrutin och går igenom hur huden känns sedan ditt senaste besök.'
      },
      {
        id: 'routine-review',
        name: 'Genomgång av hudvårdsrutin',
        price: 450,
        duration: 30,
        description: 'Ta med din nuvarande rutin så tittar vi tillsammans på en enklare väg framåt.'
      }
    ]
  },
  {
    id: 'treatments',
    name: 'Ansiktsbehandlingar',
    services: [
      {
        id: 'signature',
        name: 'Ansiktsbehandling',
        price: 1200,
        duration: 60,
        description: 'En personligt anpassad ansiktsbehandling för balans och återfuktning. Exempelbehandling och demopris.'
      },
      {
        id: 'renewal',
        name: 'Hudförnyelse',
        price: 1500,
        duration: 45,
        description: 'En riktad behandling för jämnare hudton, förfinad textur och ny lyster. Exempelbehandling och demopris.'
      },
      {
        id: 'express-facial',
        name: 'Ansiktsbehandling express',
        price: 650,
        duration: 30,
        description: 'En kort stund för din hud med rengöring, en anpassad mask och avslutande hudvård.'
      },
      {
        id: 'calming-facial',
        name: 'Lugn & balans',
        price: 1100,
        duration: 50,
        description: 'En varsam ansiktsbehandling med mjuka moment och fokus på en behaglig upplevelse.'
      }
    ]
  },
  {
    id: 'hydration',
    name: 'Fukt & lyster',
    services: [
      {
        id: 'moisture-ritual',
        name: 'Fuktritual',
        price: 950,
        duration: 45,
        description: 'Rengöring, fuktmask och avslutande produkter i en avkopplande behandling.'
      },
      {
        id: 'glow-moment',
        name: 'En stund av lyster',
        price: 850,
        duration: 40,
        description: 'En lättare ansiktsritual när du vill ge huden lite extra uppmärksamhet.'
      },
      {
        id: 'seasonal-care',
        name: 'Säsongens hudvård',
        price: 1050,
        duration: 55,
        description: 'En behandling som anpassas efter årstiden och hur din hud känns just nu.'
      }
    ]
  },
  {
    id: 'brows-lashes',
    name: 'Bryn & fransar',
    services: [
      {
        id: 'brow-shaping',
        name: 'Formning av bryn',
        price: 300,
        duration: 20,
        description: 'Vi formar dina bryn med utgångspunkt i dina önskemål och deras naturliga form.'
      },
      {
        id: 'brow-tint',
        name: 'Färgning av bryn',
        price: 350,
        duration: 20,
        description: 'En anpassad nyans för en mjuk och genomtänkt inramning av ansiktet.'
      },
      {
        id: 'lash-tint',
        name: 'Färgning av fransar',
        price: 350,
        duration: 25,
        description: 'Fransfärgning för dig som önskar en mer markerad fransrad.'
      },
      {
        id: 'brow-lash-combination',
        name: 'Bryn & fransar komplett',
        price: 650,
        duration: 45,
        description: 'Formning och färgning av bryn tillsammans med fransfärgning i ett och samma besök.'
      }
    ]
  },
  {
    id: 'relaxation',
    name: 'Avkoppling & välbefinnande',
    services: [
      {
        id: 'facial-massage',
        name: 'Ansiktsmassage',
        price: 550,
        duration: 30,
        description: 'Lugna rörelser över ansikte och käklinje, med tid att bara vara en stund.'
      },
      {
        id: 'neck-shoulders',
        name: 'Nacke & axlar',
        price: 650,
        duration: 35,
        description: 'En avkopplande massage med fokus på nacke, axlar och övre delen av ryggen.'
      },
      {
        id: 'quiet-ritual',
        name: 'Den lugna ritualen',
        price: 1150,
        duration: 60,
        description: 'Ansiktsmassage, en mjuk mask och en stunds stillhet i en sammanhängande ritual.'
      }
    ]
  },
  {
    id: 'special-moments',
    name: 'Inför din speciella dag',
    services: [
      {
        id: 'occasion-consultation',
        name: 'Planering inför ett tillfälle',
        price: 400,
        duration: 30,
        description: 'Ett samtal om din hudvård inför bröllop, fest eller en annan dag du ser fram emot.'
      },
      {
        id: 'occasion-facial',
        name: 'Förberedande ansiktsbehandling',
        price: 1250,
        duration: 55,
        description: 'En personligt anpassad ansiktsbehandling med rengöring, mask och en lugn avslutning.'
      },
      {
        id: 'finishing-touch',
        name: 'Den sista touchen',
        price: 700,
        duration: 35,
        description: 'En kortare stund med varsam hudvård och omsorg om de små detaljerna.'
      }
    ]
  }
];
