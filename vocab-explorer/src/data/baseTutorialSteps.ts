export type TutorialStep = {
  title: string;
  description: string;
  targetId?: string;
};

export const baseTutorialSteps: TutorialStep[] = [
  {
    title: "Welcome",
    description: "Welcome to Vocabulary Explorer. This tutorial will guide you through the main features."
  },
  {
    title: "Search",
    description: "Use the search bar to look up a word. This will generate the Word Web.",
    targetId: "search-bar"
  },
  {
    title: "Word Web",
    description: "The Word Web shows related words and their connections.",
    targetId: "word-web-preview-target"
  },
  {
    title: "Groups",
    description: "You can organize words into Groups. Open the Groups page to learn more.",
    targetId: "groups-footer-button"
  },
  {
    title: "Settings",
    description: "Settings allow you to adjust features like Advanced Mode.",
    targetId: "settings-button"
  },
  {
    title: "Help",
    description: "Access Help anytime for guidance or to replay tutorials.",
    targetId: "help-button"
  },
  {
    title: "You're Ready",
    description: "You're ready to start exploring."
  }
];
