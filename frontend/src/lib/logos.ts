import prince from "../assets/logo/1.jpeg";
import jaguar from "../assets/logo/2.jpeg";
import dynamic from "../assets/logo/3.jpeg";
import victory from "../assets/logo/4.jpeg";
import benchmark from "../assets/logo/5.jpeg";
import icons from "../assets/logo/6.jpeg";
import warriors from "../assets/logo/7.jpeg";
import oscar from "../assets/logo/8.jpeg";
import emperor from "../assets/logo/9.jpeg";
import fortune from "../assets/logo/10.jpeg";
import millionare from "../assets/logo/11.jpeg";
import nest from "../assets/logo/12.jpeg";
import legends from "../assets/logo/13.jpeg";
import kings from "../assets/logo/14.jpeg";
import royals from "../assets/logo/15.jpeg";
import spark from "../assets/logo/16.jpeg";
import gladiators from "../assets/logo/17.jpeg";
import harmony from "../assets/logo/18.jpeg";
import azpire from "../assets/logo/19.jpeg";
import champions from "../assets/logo/20.jpeg";

export const TEAM_LOGOS: Record<string, string> = {
  PRC: prince,
  JAG: jaguar,
  DYN: dynamic,
  VTY: victory,
  BMK: benchmark,
  ICN: icons,
  WAR: warriors,
  OSC: oscar,
  EMP: emperor,
  FOR: fortune,
  MLN: millionare,
  NST: nest,
  LGD: legends,
  KNG: kings,
  ROY: royals,
  SPK: spark,
  GLD: gladiators,
  HMY: harmony,
  AZP: azpire,
  CHP: champions,
};

export const TEAM_COLORS: Record<string, string> = {
  PRC: "#306BCB",
  JAG: "#C96A12",
  DYN: "#1E8F5A",
  VTY: "#A85B1C",
  BMK: "#A87312",
  ICN: "#2F4EC2",
  WAR: "#B02D2D",
  OSC: "#4A5CC8",
  EMP: "#7E2433",
  FOR: "#1E7A46",
  MLN: "#1F9D61",
  NST: "#8D5A2B",
  LGD: "#4F5D75",
  KNG: "#6846AF",
  ROY: "#7A1F3D",
  SPK: "#C7492C",
  GLD: "#A43B2C",
  HMY: "#7856C9",
  AZP: "#0F8EA8",
  CHP: "#1B4DB1",
};
export type TeamTheme = {
  primary: string;
  secondary: string;
  highlight: string;
};

export const TEAM_THEMES: Record<string, TeamTheme> = {
  AZP: {
    primary: "#0F8EA8",
    secondary: "#153A69",
    highlight: "#6CE5E8",
  },

  BMK: {
    primary: "#A87312",
    secondary: "#2C2E35",
    highlight: "#F2C76E",
  },

  CHP: {
    primary: "#1B4DB1",
    secondary: "#101F52",
    highlight: "#F0B94A",
  },

  DYN: {
    primary: "#1E8F5A",
    secondary: "#0F4639",
    highlight: "#8EE7B2",
  },

  EMP: {
    primary: "#7E2433",
    secondary: "#241625",
    highlight: "#E7B36F",
  },

  FOR: {
    primary: "#1E7A46",
    secondary: "#123628",
    highlight: "#D8C06C",
  },

  GLD: {
    primary: "#A43B2C",
    secondary: "#2B2438",
    highlight: "#E9BE67",
  },

  HMY: {
    primary: "#7856C9",
    secondary: "#251A4A",
    highlight: "#E4C8FF",
  },

  ICN: {
    primary: "#2F4EC2",
    secondary: "#16264F",
    highlight: "#8AD5FF",
  },

  JAG: {
    primary: "#C96A12",
    secondary: "#322115",
    highlight: "#FFD57A",
  },

  KNG: {
    primary: "#6846AF",
    secondary: "#251B40",
    highlight: "#F1D57A",
  },

  LGD: {
    primary: "#4F5D75",
    secondary: "#1E2430",
    highlight: "#CBB577",
  },

  MLN: {
    primary: "#1F9D61",
    secondary: "#15352B",
    highlight: "#E7D27A",
  },

  NST: {
    primary: "#8D5A2B",
    secondary: "#2A231F",
    highlight: "#F0D09A",
  },

  OSC: {
    primary: "#4A5CC8",
    secondary: "#1B2148",
    highlight: "#BFD5FF",
  },

  PRC: {
    primary: "#306BCB",
    secondary: "#1B2758",
    highlight: "#F1A45C",
  },

  ROY: {
    primary: "#7A1F3D",
    secondary: "#2A1620",
    highlight: "#F5D2A5",
  },

  SPK: {
    primary: "#C7492C",
    secondary: "#4C171B",
    highlight: "#F6C55B",
  },

  VTC: {
    primary: "#A85B1C",
    secondary: "#1E3156",
    highlight: "#F5C66A",
  },

  WAR: {
    primary: "#B02D2D",
    secondary: "#2A1515",
    highlight: "#FFD36A",
  },
};

export const SPONSOR_LOGOS: Record<string, string> = {
  Tata: "https://commons.wikimedia.org/wiki/Special:FilePath/Tata_logo.svg",
  Dream11:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Dream11_Logo_2023.png",
  CRED: "https://commons.wikimedia.org/wiki/Special:FilePath/CRED-LOGO2.png",
  Swiggy:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Swiggy_Text_Logo.png",
  Jio: "https://commons.wikimedia.org/wiki/Special:FilePath/Reliance_Jio_Logo.svg",
  Upstox: "https://assets.upstox.com/common/images/upstox-logo-primary.svg",
  PhonePe:
    "https://commons.wikimedia.org/wiki/Special:FilePath/PhonePe_Logo.svg",
  Unacademy:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Unacademy-logo-official.svg",
};

export const SPONSOR_LINKS: Record<string, string> = {
  Tata: "https://www.tata.com/",
  Dream11: "https://www.dream11.com/",
  CRED: "https://cred.club/",
  Swiggy: "https://www.swiggy.com/",
  Jio: "https://www.jio.com/",
  Upstox: "https://upstox.com/",
  PhonePe: "https://www.phonepe.com/",
  Unacademy: "https://unacademy.com/",
};
