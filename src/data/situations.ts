import type { RoomSafetyCheck, SituationGuide } from "../types";

export const situationGuides: SituationGuide[] = [
  {
    id: "followed",
    title: "Someone following me",
    indicators: [
      "They repeatedly mirror your turns",
      "They keep the same distance over multiple turns",
      "They wait nearby when you stop"
    ],
    actions: [
      "Move toward a staffed public place",
      "Share your location with trusted contacts",
      "Trigger Protection Mode if pattern continues"
    ]
  },
  {
    id: "unsafe_ride",
    title: "Unsafe ride",
    indicators: [
      "Route deviates without explanation",
      "Driver ignores requests to stop",
      "You feel trapped or threatened"
    ],
    actions: [
      "Call a trusted contact on speaker",
      "Request stop at a crowded place",
      "Start Social Exit timer and prepare to exit"
    ]
  },
  {
    id: "harassment",
    title: "Harassment",
    indicators: [
      "Repeated unwanted approach",
      "Boundary requests are ignored",
      "Behavior is escalating"
    ],
    actions: [
      "Use clear boundary language once",
      "Move toward security or staff",
      "Document details in Incident Log"
    ]
  },
  {
    id: "uneasy_place",
    title: "Uncomfortable environment",
    indicators: [
      "Low visibility and isolated area",
      "No easy exit route",
      "Your instinct says leave now"
    ],
    actions: [
      "Trust your instinct and leave early",
      "Open Safe Haven list and navigate",
      "Enable temporary safety timer"
    ]
  }
];

export const initialRoomSafetyChecklist: RoomSafetyCheck[] = [
  { id: "door_lock", label: "Room door lock is working", checked: false },
  { id: "windows", label: "Windows and balcony access secured", checked: false },
  { id: "reception", label: "Front desk contact saved", checked: false },
  { id: "exit_route", label: "Emergency exit route checked", checked: false },
  { id: "lighting", label: "Hallway lighting adequate", checked: false }
];
