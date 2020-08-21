export enum SubscriptionLevel {
  Insider,
  Contributor,
  VIP,
}

export function getSubscriptionLevelName(level: SubscriptionLevel): string {
  switch (level) {
    case SubscriptionLevel.Insider:
      return "Insider";
    case SubscriptionLevel.Contributor:
      return "Contributor";
    case SubscriptionLevel.VIP:
      return "VIP";
    default:
      return "Unknown";
  }
}
